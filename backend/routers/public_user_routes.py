from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.user_models import UserPublic
from services.review_service import ReviewService
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


@router.get("/org/{org_id}/given", tags=["Reviews"])
async def public_get_reviews_given_by_org(
    org_id: str,
    service: ReviewService = Depends()
):
    return await service.get_reviews_given_by_org(org_id)

@router.get("/user/{user_id}/reviews", tags=["Reviews"])
async def public_reviews_for_user(user_id: str, service: ReviewService = Depends()):
    return await service.get_public_reviews_for_user(user_id)


@router.get("/user/{user_id}/avg-rating", tags=["Reviews"])
async def public_user_avg_rating(user_id: str, service: ReviewService = Depends()):
    return await service.get_user_avg_rating(user_id)
