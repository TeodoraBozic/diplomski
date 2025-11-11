from fastapi import APIRouter, HTTPException
from typing import List
from models.user_models import UserPublic
from services.user_service import UserService

router = APIRouter(prefix="/public/users", tags=["Public - Users"])
service = UserService()

@router.get("/", response_model=List[UserPublic])
async def get_users():
    """📜 Vraća sve korisnike (javno)."""
    return await service.get_users()

@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: str):
    """🔍 Vraća korisnika po ID-ju (javno)."""
    return await service.get_user(user_id)

@router.get("/by-username/{username}", response_model=UserPublic)
async def get_user_by_username(username: str):
    """🔍 Vraća korisnika po username-u (javno)."""
    try:
        return await service.get_user_by_username(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
