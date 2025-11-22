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

    #find po USERNAME-u
    async def find_by_username(self, username: str):
        return await users_col.find_one({"username": username})

    async def find_by_email(self, email: str):
        return await users_col.find_one({"email": email})
    
    
    #treba nam za update user = to svakako svaki user moze samo sebe da update-uje
    #OBAVEZNO VRACANJE REZULTATA
    async def find_by_id(self, user_id: str):
        user = await users_col.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
        return user

    async def update(self, user_id: str, update_data: dict):
        result = await users_col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result  # <- bitno: servis proverava matched_count
    
    
    async def delete(self, user_id: str):
        result = await users_col.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    
    async def find_by_username1(self, username: str):
        user = await users_col.find_one({"username": username})
        if user:
            user["_id"] = str(user["_id"])
        return user