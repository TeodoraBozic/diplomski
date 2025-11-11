from datetime import datetime
import re
from bson import ObjectId
from fastapi import HTTPException
from date_helpers import get_current_month_range, get_current_week_range
from repositories.organisations_repository import OrganisationRepository
from repositories.events_repository import EventRepository
from models.event_models import EventCategory, EventIn, EventUpdate


class EventService:
    def __init__(self):
        self.repo = EventRepository()
        self.org_repo = OrganisationRepository()  # mora biti self!

    # 🔹 pomoćna funkcija za dodavanje organisation_name
    async def _attach_organisation_names(self, events: list[dict]) -> list[dict]:
        if not events:
            return []
        
        org_ids = [str(ev.get("organisation_id")) for ev in events if ev.get("organisation_id")]
        unique_org_ids = list(set(org_ids))
        if not unique_org_ids:
            return events

        orgs = await self.org_repo.find_many_by_ids(unique_org_ids)
        org_map = {str(org["_id"]): org["name"] for org in orgs}

        for ev in events:
            org_id = str(ev.get("organisation_id"))
            ev["organisation_name"] = org_map.get(org_id)
            ev.pop("organisation_id", None)

        return events


    #kreira se event
    async def create_event(self, event: EventIn, organisation_id: str):
        event_data = event.model_dump()
        event_data["organisation_id"] = ObjectId(organisation_id)  # ✅ ovo dodaj
        event_data["created_at"] = datetime.utcnow()

        result_id = await self.repo.create_event(event_data)
        return {"message": "Uspesno kreiran event", "id": result_id}


    #get all events sa imenima organizacija = radi
    async def get_all_events(self):
            events = await self.repo.find_all()
            now = datetime.utcnow()

            # filtriramo samo evente koji još traju ili tek počinju
            active_events = [e for e in events if e["end_date"] > now]

            # dodajemo imena organizacija
            for ev in active_events:
                org = await self.org_repo.find_by_id(str(ev["organisation_id"]))
                ev["organisation_name"] = org["name"] if org else None
                ev.pop("organisation_id", None)

            return active_events

    #get event by id = radi
    async def get_event_by_id(self, event_id: str):
        event = await self.repo.find_by_id(event_id)
        if not event:
            raise ValueError("Event not found")

        org = await self.org_repo.find_by_id(str(event["organisation_id"]))
        event["organisation_name"] = org["name"] if org else None
        event.pop("organisation_id", None)
        return event
    
    async def get_event_by_title(self, title: str):
        event = await self.repo.find_by_title(title)
        if not event:
            raise ValueError("Event not found")

        org = await self.org_repo.find_by_id(str(event["organisation_id"]))
        event["organisation_name"] = org["name"] if org else None
        event.pop("organisation_id", None)
        return event
    
    

    #moji eventi
    async def get_events_by_organisation(self, organisation_id: str):
        events = await self.repo.find_by_organisation(organisation_id)
        return await self._attach_organisation_names(events)

  

    async def filter_events(self, category=None, tags=None, location=None, date_from=None, date_to=None):
        query = {}

        # Kategorija
        if category:
            query["category"] = category

        # Lokacija (case-insensitive pretraga)
        if location:
            query["location"] = {"$regex": location, "$options": "i"}

        # Tagovi (bar jedan od navedenih)
        if tags:
            query["tags"] = {"$in": tags}

        # Vremenski opseg
        if date_from or date_to:
            date_filter = {}
            try:
                if date_from:
                    date_filter["$gte"] = datetime.fromisoformat(date_from)
                if date_to:
                    date_filter["$lte"] = datetime.fromisoformat(date_to)
            except ValueError:
                # Ako je format datuma loš
                raise ValueError("Invalid date format. Use ISO format, e.g. 2025-05-12T00:00:00")
            query["start_date"] = date_filter

        events = await self.repo.filter_events(query)
        return await self._attach_organisation_names(events)

    # 7️⃣ Ažuriranje eventa
    async def update_event(self, event_id: str, update_data: EventUpdate):
        update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
        update_dict["updated_at"] = datetime.utcnow()
        success = await self.repo.update(event_id, update_dict)
        if not success:
            raise ValueError("Event not found or not updated")
        return {"message": "Event successfully updated"}

    # 8️⃣ Brisanje eventa
    async def delete_event(self, event_id: str):
        deleted = await self.repo.delete(event_id)
        if not deleted:
            raise ValueError("Event not found or not deleted")
        return {"message": "Event successfully deleted"}



    async def get_events_by_organisation_username(self, username: str):
            org = await self.org_repo.find_by_username(username)
            if not org:
                raise ValueError("Organisation not found")

            org_id = str(org["_id"])
            events = await self.repo.find_by_organisation(org_id)

            # možeš opcionalno da dodaš ime organizacije u svaki event
            for ev in events:
                ev["organisation_name"] = org["name"]
                ev.pop("organisation_id", None)

            return events
        
        
    async def get_events_by_location(self, city: str):
        events = await self.repo.find_by_location(city)
        return await self._attach_organisation_names(events)
    
    
    #svi eventi ovog meseca
    async def get_events_this_month(self):
        date_from, date_to = get_current_month_range()
        events = await self.filter_events(date_from=date_from.isoformat(), date_to=date_to.isoformat())
        return await self._attach_organisation_names(events)

    #upcoming events
    async def get_events_this_week(self):
        date_from, date_to = get_current_week_range()
        events = await self.filter_events(date_from=date_from.isoformat(), date_to=date_to.isoformat())
        return await self._attach_organisation_names(events)


    async def delete_event(self, event_id: str, organisation_id: str):
        event = await self.repo.find_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event nije pronađen")

        # samo organizacija koja je kreirala event može da ga obriše
        if str(event["organisation_id"]) != str(organisation_id):
            raise HTTPException(status_code=403, detail="Nemate dozvolu da obrišete ovaj event")

        await self.repo.delete_by_id(event_id)
        return {"message": "Event uspešno obrisan"}
    
    
    
    async def get_past_events_for_org(self, organisation_id: str):
        now = datetime.utcnow()
        events = await self.repo.find_by_organisation(organisation_id)
        past = [e for e in events if e["end_date"] <= now]

        # dodaj ime organizacije
        for ev in past:
            org = await self.org_repo.find_by_id(str(ev["organisation_id"]))
            ev["organisation_name"] = org["name"] if org else None
            ev.pop("organisation_id", None)

        return past


    #javni prikaz istorije - npr neki urser gleda organizacioni profil i zeli da vidi prethodne evente
    async def get_public_past_events(self, organisation_id: str):
        now = datetime.utcnow()
        events = await self.repo.find_by_organisation(organisation_id)
        past = [e for e in events if e["end_date"] <= now]

        # možemo ostaviti organisation_name radi prikaza
        org = await self.org_repo.find_by_id(str(organisation_id))
        org_name = org["name"] if org else None

        for ev in past:
            ev["organisation_name"] = org_name
            ev.pop("organisation_id", None)

        return past
    
    
    async def get_upcoming_events(self):
        now = datetime.utcnow()
        events = await self.repo.find_all()

        # filtriramo samo buduće
        upcoming = [e for e in events if e["start_date"] > now]

        # sortiranje po datumu početka (najskoriji prvi)
        upcoming.sort(key=lambda e: e["start_date"])

        # dodamo ime organizacije i sklonimo organisation_id iz response-a
        for ev in upcoming:
            org = await self.org_repo.find_by_id(str(ev["organisation_id"]))
            ev["organisation_name"] = org["name"] if org else None
            ev.pop("organisation_id", None)

        return upcoming
    
    
    async def get_nearby_events(self, user_city: str):
        if not user_city:
            return []

        # regex pretraga po lokaciji (nije case sensitive)
        regex = re.compile(user_city, re.IGNORECASE)

        events = await self.repo.find_all()
        now = datetime.utcnow()

        # filtriramo samo aktivne evente u istom gradu
        nearby = [
            e for e in events
            if e["end_date"] > now and regex.search(e["location"] or "")
        ]

        # dodajemo naziv organizacije
        for ev in nearby:
            org = await self.org_repo.find_by_id(str(ev["organisation_id"]))
            ev["organisation_name"] = org["name"] if org else None
            ev.pop("organisation_id", None)

        return nearby
    
    
    async def get_all_categories(self):
        #ovo pretvara enum u listu vrednosti!!
        return [cat.value for cat in EventCategory]