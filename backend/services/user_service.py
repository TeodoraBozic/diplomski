import bcrypt
from bson import ObjectId
from repositories.user_repository import UserRepository
from models.user_models import UserIn, UserUpdate
from fastapi import HTTPException, status
import datetime


#ovaj sloj koristi vise repozitorijuma i kombinuje njihove rezultate kako bi generisao svoj
#sadrzi: validaciju podataka, pravila i uslove, BACA EXCEPTION-E
repo = UserRepository()

class UserService:
    
    
    # async def create_user(self, user_in: UserIn):
    #     existing = await repo.find_by_email(user_in.email)
    #     if existing:
    #         raise HTTPException(status_code=400, detail="Email already registered")

    #     user_data = user_in.model_dump()
    #     user_data["created_at"] = datetime.datetime.utcnow()
    #     user_data["role"] = "user"

    #     inserted_id = await repo.create(user_data)
    #     return {"id": inserted_id, **user_data}

    async def get_users(self):
        return await repo.find_all()

    async def get_user(self, user_id: str):
        user = await repo.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found with this id")
        return user
    

    async def update_user(self, current_user, update_data: dict):
            # Ako nema podataka za ažuriranje
            if not update_data:
                raise HTTPException(status_code=400, detail="Nema podataka za ažuriranje")
            

            # Ako se menja password — hešuj ga
            if "password" in update_data and update_data["password"]:
                update_data["password"] = bcrypt.hashpw(
                    update_data["password"].encode(), bcrypt.gensalt()
                ).decode()
                
            if "username" in update_data:
                existing = await repo.find_by_username(update_data["username"])
                if existing and str(existing["_id"]) != str(current_user.id):
                    raise HTTPException(400, "Korisničko ime je zauzeto")

            result = await repo.update(ObjectId(current_user.id), update_data)

            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Korisnik nije pronađen")

            updated_user = await repo.find_by_id(current_user.id)
            return updated_user
        
        
        
    async def get_user_by_username(self, username: str):
        user = await repo.find_by_username(username)
        if not user:
            raise HTTPException(status_code=404, detail="User not found with this username")
        return user
    

    async def delete_user(self, user_id: str):
        deleted = await repo.delete(user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="User not found")
        return {"status": "deleted"}


    async def get_by_username1(self, username: str):
        user = await repo.find_by_username1(username)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user