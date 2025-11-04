from fastapi import APIRouter, Depends, HTTPException
from auth.dependencies import get_current_user
from services import user_service
from services.user_service import UserService
from models.user_models import UserDB, UserIn, UserPublic, UserUpdate
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])
service = UserService()


#prima http zahteve i vraca http odgovore-on poziva servis funkcije
# @router.post("/", response_model=UserPublic)
# async def create_user(user_in: UserIn):
#     return await service.create_user(user_in)

@router.get("/", response_model=List[UserPublic])
async def get_users():
    return await service.get_users()

@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: str):
    return await service.get_user(user_id)

@router.get("getuserbyusername/{username}", response_model=UserPublic)
async def get_user(username: str):
    return await service.get_user_by_username(username)

@router.patch("/me", response_model=UserDB)
async def update_me(
    update_data: UserUpdate,
    current_user: UserDB = Depends(get_current_user)
):
    update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
    return await service.update_user(current_user, update_dict)

@router.delete("/{user_id}")
async def delete_user(user_id: str):
    return await service.delete_user(user_id)
