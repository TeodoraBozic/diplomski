from bson import ObjectId
from database.connection import applications_col


class ApplicationRepository:

    # -------------------------------------------------
    # CREATE APPLICATION
    # -------------------------------------------------
    async def create(self, application_data: dict):
        result = await applications_col.insert_one(application_data)
        return str(result.inserted_id)

    # -------------------------------------------------
    # FIND BY USER + EVENT  (KORISTI SE U APPLY)
    # -------------------------------------------------
    async def find_by_user_and_event(self, user_id: ObjectId, event_id: ObjectId):
        return await applications_col.find_one({
            "user_id": user_id,
            "event_id": event_id
        })

    # -------------------------------------------------
    # FIND BY EVENT
    # -------------------------------------------------
    async def find_by_event(self, event_id: str):
        event_oid = ObjectId(event_id)
        apps = await applications_col.find({"event_id": event_oid}).to_list(length=None)

        for a in apps:
            a["_id"] = str(a["_id"])
            a["user_id"] = str(a["user_id"])
            a["event_id"] = str(a["event_id"])

        return apps

    # -------------------------------------------------
    # FIND BY USER (KORISTI SE U GET_MY_APPLICATIONS)
    # -------------------------------------------------
    async def find_by_user(self, user_id: str):
        user_oid = ObjectId(user_id)
        apps = await applications_col.find({"user_id": user_oid}).to_list(length=None)

        for a in apps:
            a["_id"] = str(a["_id"])
            a["user_id"] = str(a["user_id"])
            a["event_id"] = str(a["event_id"])

        return apps

    # -------------------------------------------------
    # FIND BY MULTIPLE EVENTS (ORG — ALL APPLICATIONS)
    # -------------------------------------------------
    async def find_by_multiple_events(self, event_ids: list[str]):

        event_oids = [ObjectId(eid) for eid in event_ids]

        apps = await applications_col.find({
            "event_id": {"$in": event_oids}
        }).to_list(length=None)

        for a in apps:
            a["_id"] = str(a["_id"])
            a["user_id"] = str(a["user_id"])
            a["event_id"] = str(a["event_id"])

        return apps

    # -------------------------------------------------
    # UPDATE STATUS
    # -------------------------------------------------
    async def update_status(self, application_id: str, update_data: dict):
        await applications_col.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_data}
        )

    # -------------------------------------------------
    # FIND BY ID (KORISTI SE U CANCEL)
    # -------------------------------------------------
    async def find_by_id(self, app_id: str):
        application = await applications_col.find_one({"_id": ObjectId(app_id)})
        if not application:
            return None

        application["_id"] = str(application["_id"])
        application["user_id"] = str(application["user_id"])
        application["event_id"] = str(application["event_id"])

        return application


    async def find_appls_by_event(self, event_id: str):
        apps = await applications_col.find({
            "event_id": ObjectId(event_id)
        }).to_list(length=None)

        for a in apps:
            a["_id"] = str(a["_id"])
            a["user_id"] = str(a["user_id"])
            a["event_id"] = str(a["event_id"])

            # ⬅️ OVO je bilo izgubljeno! I zbog ovoga Pydantic puca!
            if "user_info" in a and "id" in a["user_info"]:
                a["user_info"]["id"] = str(a["user_info"]["id"])

        return apps

