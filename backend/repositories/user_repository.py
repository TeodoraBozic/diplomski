from database.connection import users_col  
from bson import ObjectId


#ovaj sloj zaduzen je samo za crud operacije - za komunikaciju sa bazom 
class UserRepository:
    async def create(self, user_data: dict):
        result = await users_col.insert_one(user_data)
        return str(result.inserted_id)

    async def find_all(self):
        users = await users_col.find().to_list(length=None)
        return users

    async def find_by_id(self, user_id: str):
        return await users_col.find_one({"_id": ObjectId(user_id)})

    async def find_by_email(self, email: str):
        return await users_col.find_one({"email": email})

    async def update(self, user_id: str, update_data: dict):
        await users_col.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        return await self.find_by_id(user_id)

    async def delete(self, user_id: str):
        result = await users_col.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0