# repositories/review_repository.py

from bson import ObjectId
from database.connection import reviews_col


class ReviewRepository:

    def __init__(self):
        self.col = reviews_col

    # ============================
    # CREATE
    # ============================
    async def create_review(self, data: dict):
        result = await self.col.insert_one(data)
        return result.inserted_id

    # ============================
    # FIND BY ID
    # ============================
    async def find_by_id(self, id: ObjectId):
        return await self.col.find_one({"_id": id})

    # ============================
    # USER → ORG review (za proveru duplikata)
    # ============================
    async def find_user_to_org_review(self, user_id: ObjectId, event_id: ObjectId):
        return await self.col.find_one({
            "user_id": user_id,
            "event_id": event_id,
            "direction": "user_to_org"
        })

    # ============================
    # ORG → USER review (za proveru duplikata)
    # ============================
    async def find_org_to_user_review(self, user_id: ObjectId, organisation_id: ObjectId, event_id: ObjectId):
        return await self.col.find_one({
            "user_id": user_id,
            "organisation_id": organisation_id,
            "event_id": event_id,
            "direction": "org_to_user"
        })

    # ============================
    # FIND MANY
    # ============================
    async def find_many(self, filter: dict):
        cursor = self.col.find(filter)
        return await cursor.to_list(length=None)

    # ============================
    # AGGREGATE
    # ============================
    async def aggregate(self, pipeline: list):
        cursor = self.col.aggregate(pipeline)
        return await cursor.to_list(length=None)
