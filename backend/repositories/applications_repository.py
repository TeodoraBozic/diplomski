from bson import ObjectId
from database.connection import applications_col

class ApplicationRepository:


    #kreiranje prijave
    async def create(self, application_data: dict):
        result = await applications_col.insert_one(application_data)
        return str(result.inserted_id)


    #find po useru i po eventu
    async def find_by_user_and_event(self, user_id: str, event_id: str):
        return await applications_col.find_one({
            "user_id": ObjectId(user_id),
            "event_id": ObjectId(event_id)
        })

    
    async def find_by_event(self, event_id: str):
        apps = await applications_col.find({"event_id": ObjectId(event_id)}).to_list(length=None)
        for a in apps:
            a["_id"] = str(a["_id"])
            a["user_id"] = str(a["user_id"])
            a["event_id"] = str(a["event_id"])
        return apps

    async def find_by_user(self, user_id: str):
        apps = await applications_col.find({"user_id": ObjectId(user_id)}).to_list(length=None)
        for a in apps:
            a["_id"] = str(a["_id"])
            a["user_id"] = str(a["user_id"])
            a["event_id"] = str(a["event_id"])
        return apps

    async def update_status(self, application_id: str, update_data: dict):
        await applications_col.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_data}
        )
