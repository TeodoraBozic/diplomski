from bson import ObjectId
from database.connection import events_col


class EventRepository:

   
    async def create_event(self, event_data: dict):
        result = await events_col.insert_one(event_data)
        return str(result.inserted_id)

    async def find_by_id(self, event_id: str):
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if event:
            event["_id"] = str(event["_id"])
            event["organisation_id"] = str(event["organisation_id"])
        return event


    async def find_all(self):
        events = await events_col.find().to_list(length=None)
        for ev in events:
            ev["_id"] = str(ev["_id"])
            ev["organisation_id"] = str(ev["organisation_id"])
        return events


    async def find_by_organisation(self, organisation_id: str):
        events = await events_col.find(
            {"organisation_id": ObjectId(organisation_id)}
        ).to_list(length=None)
        for ev in events:
            ev["_id"] = str(ev["_id"])
            ev["organisation_id"] = str(ev["organisation_id"])
        return events

    #filter eventova po nazivu, opisu kategoriji tagovima ZA SAD
    async def search(self, query: str):
        events = await events_col.find({
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"category": {"$regex": query, "$options": "i"}},
                {"tags": {"$regex": query, "$options": "i"}}
            ]
        }).to_list(length=None)

        for ev in events:
            ev["_id"] = str(ev["_id"])
            ev["organisation_id"] = str(ev["organisation_id"])
        return events


    async def update(self, event_id: str, update_data: dict):
        result = await events_col.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0


    async def delete(self, event_id: str):
        result = await events_col.delete_one({"_id": ObjectId(event_id)})
        return result.deleted_count > 0
    

    async def filter_events(self, query: dict):
        events = await events_col.find(query).to_list(length=None)
        for ev in events:
            ev["_id"] = str(ev["_id"])
            ev["organisation_id"] = str(ev["organisation_id"])
        return events
