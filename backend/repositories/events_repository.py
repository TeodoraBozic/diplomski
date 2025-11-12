from bson import ObjectId
from fastapi import HTTPException
from database.connection import events_col, organisations_col


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
    
    async def find_by_title(self, title: str):
        event = await events_col.find_one({"title": title})
        if event:
            event["_id"] = str(event["_id"])
            event["organisation_id"] = str(event["organisation_id"])
        return event




    async def find_all(self):
        events = await events_col.find().to_list(length=None)
        for ev in events:
            ev["_id"] = str(ev["_id"])
            if isinstance(ev.get("organisation_id"), ObjectId):
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
            if "organisation_id" in ev:
                ev["organisation_id"] = str(ev["organisation_id"])
        return events


#pretraga za korisnike, oni mogu po name-u organizacije da pretrazuju
    async def find_by_organisation_username(self, username: str):
        org = await organisations_col.find_one({"username": username})
        if not org:
            raise ValueError("Organisation not found")

        org_id = org["_id"]
        events = await events_col.find({"organisation_id": org_id}).to_list(length=None)
        for ev in events:
            ev["_id"] = str(ev["_id"])
            ev["organisation_id"] = str(ev["organisation_id"])
        return events
    
    
    
    #pitati profesora!! on sad nalazi niš i Niš ali ne radi za Nis ili nis, da pitam sta je najbolje resenje
    #da imam bas samo pretragu po gradovima da nije samo filter za search
    async def find_by_location(self, city: str):
        events = await events_col.find(
            {"location": {"$regex": city, "$options": "i"}}
        ).to_list(length=None)

        for ev in events:
            ev["_id"] = str(ev["_id"])
            if "organisation_id" in ev:
                ev["organisation_id"] = str(ev["organisation_id"])
        return events


    async def delete_by_id(self, event_id: str):
        result = await events_col.delete_one({"_id": ObjectId(event_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Event nije pronađen")
        
    #ovo je neki cudan helper koji nam treba da izvlaci eventove po id-jevima        
    async def find_by_ids(self, ids: list[str]):
        events = await events_col.find({"_id": {"$in": [ObjectId(i) for i in ids]}}).to_list(length=None)
        for e in events:
            e["_id"] = str(e["_id"])
            e["organisation_id"] = str(e["organisation_id"])
        return events