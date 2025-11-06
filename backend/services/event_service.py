from datetime import datetime
from repositories.events_repository import EventRepository
from models.event_models import EventIn, EventUpdate


class EventService:
    def __init__(self):
        self.repo = EventRepository()

    # 1️⃣ Kreiranje eventa
    async def create_event(self, event: EventIn):
        event_data = event.model_dump()
        event_data["created_at"] = datetime.utcnow()
        # Event je odmah "odobren" jer je organizacija već verifikovana
        result_id = await self.repo.create_event(event_data)
        return {"message": "Event successfully created", "id": result_id}

    # 2️⃣ Svi eventi
    async def get_all_events(self):
        return await self.repo.find_all()

    # 3️⃣ Event po ID-u
    async def get_event_by_id(self, event_id: str):
        event = await self.repo.find_by_id(event_id)
        if not event:
            raise ValueError("Event not found")
        return event

    # 4️⃣ Eventi jedne organizacije
    async def get_events_by_organisation(self, organisation_id: str):
        return await self.repo.find_by_organisation(organisation_id)

    # 5️⃣ Search (pretraga po nazivu, opisu, tagovima, kategoriji)
    async def search_events(self, query: str):
        return await self.repo.search(query)

    # 6️⃣ Filter događaja po više kriterijuma
    async def filter_events(self, category=None, tags=None, location=None, date_from=None, date_to=None):
        query = {}

        if category:
            query["category"] = category

        if location:
            query["location"] = {"$regex": location, "$options": "i"}

        if tags:
            query["tags"] = {"$in": tags}

        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = datetime.fromisoformat(date_from)
            if date_to:
                date_filter["$lte"] = datetime.fromisoformat(date_to)
            query["start_date"] = date_filter

        return await self.repo.filter_events(query)

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
