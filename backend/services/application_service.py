from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from models.organisation_models import OrganisationDB
from models.user_models import UserDB
from repositories.applications_repository import ApplicationRepository
from models.application_models import ApplicationIn, ApplicationDB, ApplicationUpdate, ApplicationStatus
from repositories.events_repository import EventRepository
from database.connection import applications_col
from repositories.organisations_repository import OrganisationRepository
from services.notification_service import NotificationService
class ApplicationService:
    def __init__(self):
        
        self.repo = ApplicationRepository()
        self.event_repo = EventRepository()
        self.org_repo = OrganisationRepository()
        self.notif_service = NotificationService()
        
        

    # korisnik se prijavljuje = radi!! i snapchot radi za sad mi ima smisla
    async def apply(self, application: ApplicationIn, current_user: UserDB):

        # 1️⃣ Validacija eventa
        event = await self.event_repo.find_by_id(str(application.event_id))
        if not event:
            raise HTTPException(status_code=404, detail="Događaj nije pronađen.")

        # Pretvori ID-jeve u ObjectId
        user_id = ObjectId(current_user.id)
        event_id = ObjectId(application.event_id)

        # 2️⃣ Provera da li je korisnik već aplicirao
        existing = await self.repo.find_by_user_and_event(user_id, event_id)
        if existing:
            raise HTTPException(status_code=400, detail="Već ste se prijavili na ovaj događaj.")

        # Snapshot korisnika
        user_snapshot = {
            "first_name": current_user.first_name,
            "email": current_user.email,
            "username": current_user.username,
        }

        # 3️⃣ Priprema podataka za čuvanje
        app_data = application.model_dump()
        app_data.update({
            "user_id": user_id,
            "event_id": event_id,
            "status": ApplicationStatus.pending,
            "created_at": datetime.utcnow(),
            "user_info": user_snapshot
        })

        inserted_id = await self.repo.create(app_data)

        # 4️⃣ Slanje obaveštenja
        await self.notif_service.notify_org(
            organisation_id=str(event["organisation_id"]),
            message=f"New volunteer applied for your event: {event['title']}"
        )

        return {
            "message": "Prijava uspešno poslata.",
            "application_id": inserted_id,
            "status": ApplicationStatus.pending
        }
        
        
    async def get_user_applications(self, user_id: str):
        return await self.repo.find_by_user(user_id)

    async def get_event_applications(self, event_id: str, organisation_id: str):
        # ✅ proveri da li event pripada toj organizaciji
        event = await self.event_repo.find_by_id(event_id)
        if not event or str(event["organisation_id"]) != organisation_id:
            raise HTTPException(status_code=403, detail="Event ne pripada organizaciji")

        # ✅ dohvati organizaciju
        org = await self.org_repo.find_by_id(event["organisation_id"])

        # ✅ sve prijave za event
        applications = await self.repo.find_by_event(event_id)
        
        applications = [a for a in applications if a["status"] != "cancelled"]

        # 📦 obogati svaku prijavu sa dodatnim info
        for app in applications:
            app["event_title"] = event["title"]
            app["organisation_name"] = org["name"] if org else "Nepoznata organizacija"

        return applications



    async def update_status(self, app_id: str, update: ApplicationUpdate, current_org: OrganisationDB):
       #organizacija menja status prijave!! 

        #pronalazimo prijavu
        application = await applications_col.find_one({"_id": ObjectId(app_id)})
        if not application:
            raise HTTPException(status_code=404, detail="Prijava nije pronađena.")

        #pronalazimo event
        event = await self.event_repo.find_by_id(str(application["event_id"]))
        if not event:
            raise HTTPException(status_code=404, detail="Događaj nije pronađen.")

        #BITNO! organizacija moze samo svoje evente da kontrolise
        if str(event["organisation_id"]) != str(current_org["_id"]):
            raise HTTPException(status_code=403, detail="Nemate dozvolu da menjate ovu prijavu.")

        #azuriranje
        update_data = update.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.utcnow()

        await self.repo.update_status(app_id, update_data)

        return {"message": "Status prijave je uspešno ažuriran."}
    
    #radi
    async def get_all_applications_for_org(self, organisation_id: str):
   
        #uzmi sve evente te organizacije
        events = await self.event_repo.find_by_organisation(organisation_id)
        if not events:
            return []  # nema događaja = nema prijava

        # 2️⃣ mapiraj event_id -> (naziv eventa)
        event_map = {str(e["_id"]): e["title"] for e in events}

        # 3️⃣ pronađi sva apliciranja koja se odnose na te evente
        event_ids = list(event_map.keys())
        applications = await self.repo.find_by_multiple_events(event_ids)
        
        applications = [a for a in applications if a["status"] != "cancelled"]

        # 4️⃣ dodaj naziv eventa i naziv organizacije
        org = await self.org_repo.find_by_id(organisation_id)
        org_name = org["name"] if org else "Nepoznata organizacija"

        for app in applications:
            app["event_title"] = event_map.get(app["event_id"], "Nepoznat događaj")
            app["organisation_name"] = org_name

        return applications

    #radi
    async def get_my_applications(self, user_id: str):
        
        applications = await self.repo.find_by_user(user_id)
        if not applications:
            return []

        event_ids = [a["event_id"] for a in applications]

        events = await self.event_repo.find_by_ids(event_ids)
        event_map = {str(e["_id"]): e for e in events}

        for app in applications:
            event = event_map.get(app["event_id"])
            if event:
                app["event_title"] = event["title"]

                # dohvati i organizaciju eventa
                org = await self.org_repo.find_by_id(str(event["organisation_id"]))
                app["organisation_name"] = org["name"] if org else "Nepoznata organizacija"
            else:
                app["event_title"] = "Nepoznat događaj"
                app["organisation_name"] = "Nepoznata organizacija"

        return applications


#radi
    async def cancel_application(self, app_id: str, current_user):
        
        # Pronađi prijavu
        application = await self.repo.find_by_id(app_id)
        if not application:
            raise HTTPException(status_code=404, detail="Prijava nije pronađena.")
        
        # Proveri da li je korisnik vlasnik prijave
        if str(application["user_id"]) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Nije dozvoljeno povući tuđu prijavu.")

        # Ako je već odobrena ili odbijena, možda ne sme da se povuče (opciono)
        if application["status"] in ["accepted", "rejected"]:
            raise HTTPException(status_code=400, detail="Ne možete povući prijavu koja je već obrađena.")

        # Ažuriraj status
        update_data = {
            "status": "cancelled",
            "updated_at": datetime.utcnow()
        }

        await self.repo.update_status(app_id, update_data)
        return {"message": "Prijava je uspešno povučena."}