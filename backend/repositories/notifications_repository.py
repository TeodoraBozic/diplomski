from bson import ObjectId
from database.connection import notifications_col


class NotificationRepository:

    async def create(self, data: dict):
        """Upisuje novu notifikaciju u MongoDB"""
        result = await notifications_col.insert_one(data)
        return str(result.inserted_id)

    async def get_by_org(self, organisation_id: str):
        """Vrati sve notifikacije organizacije"""
        cursor = notifications_col.find({
            "organisation_id": ObjectId(organisation_id)
        }).sort("created_at", -1)

        result = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["organisation_id"] = str(doc["organisation_id"])
            result.append(doc)
        return result

    async def mark_as_read(self, notification_id: str):
        await notifications_col.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"is_read": True}}
        )
