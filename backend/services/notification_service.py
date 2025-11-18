from datetime import datetime
from bson import ObjectId
from repositories.notifications_repository import NotificationRepository
from ws_manager import ws_manager
from database.connection import notifications_col


class NotificationService:

    def __init__(self):
        self.repo = NotificationRepository()

    async def notify_org(self, organisation_id: str, message: str):
        """Upiši u bazu + pošalji WebSocket-u"""

        data = {
            "organisation_id": ObjectId(organisation_id),
            "message": message,
            "created_at": datetime.utcnow(),
            "is_read": False,
        }

        # 1. upiši notifikaciju u bazu
        notif_id = await self.repo.create(data)

        # 2. pošalji real-time preko WS
        await ws_manager.send_to_org(organisation_id, message)

        return notif_id

    async def get_notifications(self, organisation_id: str):
        return await self.repo.get_by_org(organisation_id)

    async def mark_read(self, notification_id: str):
        await self.repo.mark_as_read(notification_id)



    async def mark_all_read(self, organisation_id: str):
        await notifications_col.update_many(
            {"organisation_id": ObjectId(organisation_id), "is_read": False},
            {"$set": {"is_read": True}}
        )
        return {"message": "All notifications marked as read"}


    async def get_unread_count(self, organisation_id: str):
        count = await notifications_col.count_documents({
            "organisation_id": ObjectId(organisation_id),
            "is_read": False
        })
        return {"unread": count}

