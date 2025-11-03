from repositories.user_repository import UserRepository
from models.user_models import UserIn, UserUpdate
from fastapi import HTTPException, status
import datetime


#ovaj sloj koristi vise repozitorijuma i kombinuje njihove rezultate kako bi generisao svoj
#sadrzi: validaciju podataka, pravila i uslove, BACA EXCEPTION-E
repo = UserRepository()

class UserService:
    async def create_user(self, user_in: UserIn):
        existing = await repo.find_by_email(user_in.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_data = user_in.model_dump()
        user_data["created_at"] = datetime.datetime.utcnow()
        user_data["role"] = "user"

        inserted_id = await repo.create(user_data)
        return {"id": inserted_id, **user_data}

    async def get_users(self):
        return await repo.find_all()

    async def get_user(self, user_id: str):
        user = await repo.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    async def update_user(self, user_id: str, data: UserUpdate):
        updated = await repo.update(user_id, data.model_dump(exclude_none=True))
        return updated

    async def delete_user(self, user_id: str):
        deleted = await repo.delete(user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="User not found")
        return {"status": "deleted"}
