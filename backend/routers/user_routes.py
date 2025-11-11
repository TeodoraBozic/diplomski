from fastapi import APIRouter, Depends, HTTPException
from auth.dependencies import get_current_user
from models.application_models import ApplicationIn
from models.user_models import UserDB
from services import event_service
from services.application_service import ApplicationService

router = APIRouter(
    prefix="/user",
    tags=["User"],
    dependencies=[Depends(get_current_user)]
)

from fastapi import APIRouter, Depends
from auth.dependencies import get_current_user
from services.user_service import UserService
from models.user_models import UserDB, UserUpdate

router = APIRouter(
    prefix="/user",
    tags=["User"],
    dependencies=[Depends(get_current_user)]  # ✅ sve rute zahtevaju UserAuth
)

service = UserService()

eventservice = event_service.EventService()


appservice = ApplicationService()

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


# ✅ Korisnik vidi svoje prijave
@router.get("/me/applications")
async def get_my_applications(current_user=Depends(get_current_user)):
    return await appservice.get_user_applications(current_user["_id"])