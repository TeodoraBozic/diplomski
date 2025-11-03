from fastapi import APIRouter
from services.user_service import UserService
from models.user_models import UserIn, UserPublic, UserUpdate
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])
service = UserService()

@router.post("/", response_model=UserPublic)
async def create_user(user_in: UserIn):
    return await service.create_user(user_in)

@router.get("/", response_model=List[UserPublic])
async def get_users():
    return await service.get_users()

@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: str):
    return await service.get_user(user_id)

@router.put("/{user_id}", response_model=UserPublic)
async def update_user(user_id: str, user_update: UserUpdate):
    return await service.update_user(user_id, user_update)

@router.delete("/{user_id}")
async def delete_user(user_id: str):
    return await service.delete_user(user_id)
