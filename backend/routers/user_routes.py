from typing import List
from fastapi import APIRouter, Depends, HTTPException
from auth.dependencies import get_current_user
from models.application_models import ApplicationIn, ApplicationPublic
from models.review_models import ReviewUserToOrgDB, ReviewUserToOrgIn
from models.user_models import UserDB
from services import event_service
from services.application_service import ApplicationService
from services.review_service import ReviewService

router = APIRouter(
    prefix="/user",
    tags=["User"],
    dependencies=[Depends(get_current_user)]
)

from fastapi import APIRouter, Depends
from auth.dependencies import get_current_user
from services.user_service import UserService
from models.user_models import UserDB, UserUpdate


service = UserService()

eventservice = event_service.EventService()

appservice = ApplicationService()

reviewservice = ReviewService()

@router.get("/me", response_model=UserDB)
async def get_me(current_user: UserDB = Depends(get_current_user)):
    """👤 Vraća podatke o trenutno ulogovanom korisniku."""
    return current_user

@router.patch("/me", response_model=UserDB)
async def update_me(update_data: UserUpdate, current_user: UserDB = Depends(get_current_user)):
    update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
    return await service.update_user(current_user, update_dict)

@router.delete("/me", response_model=dict)
async def delete_my_account(current_user: UserDB = Depends(get_current_user)):
    return await service.delete_user(str(current_user.id))



#problem - mora da se vodi racuna o š ž itd
@router.get("/nearby_events", summary="Eventi u istom gradu kao korisnik")
async def get_nearby_events(current_user=Depends(get_current_user)):
    user_city = current_user.location
    return await eventservice.get_nearby_events(user_city)



@router.post("/apply")
async def apply_for_event(application: ApplicationIn, current_user=Depends(get_current_user)):
    try:
        return await appservice.apply(application, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

#radi
@router.get("/mojaapliciranja", response_model=List[ApplicationPublic])
async def get_my_applications(current_user=Depends(get_current_user)):
    try:
        # ✅ koristi .id jer je current_user Pydantic model
        return await appservice.get_my_applications(str(current_user.id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Greška: {str(e)}")
    
    
@router.patch("/applications/{application_id}/cancel")
async def cancel_application(application_id: str, current_user=Depends(get_current_user)):
    """
    👤 Korisnik povlači svoju prijavu (status -> cancelled)
    """
    return await appservice.cancel_application(application_id, current_user)



############ review ############


@router.post("/reviews/user-to-org/{event_id}")
async def create_review_user_to_org(
    event_id: str,
    body: ReviewUserToOrgIn,
    current_user = Depends(get_current_user)
):
    return await reviewservice.create_user_to_org_review(
        event_id=event_id,
        user_id=current_user.id,
        rating=body.rating,
        comment=body.comment
    )