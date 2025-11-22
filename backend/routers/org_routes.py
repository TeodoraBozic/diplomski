from fastapi import APIRouter, Depends, HTTPException, Path
from typing import List
from auth.dependencies import get_current_org
from models.application_models import ApplicationPublic, ApplicationStatus, ApplicationUpdate, OrgDecision
from models.review_models import ReviewOrgToUserDB, ReviewOrgToUserIn
from services.application_service import ApplicationService
from services.event_service import EventService
from services.organisation_service import OrganisationService
from models.event_models import EventIn, EventUpdate, EventPublic
from models.organisation_models import OrganisationPublic, OrganisationUpdate
from services.review_service import ReviewService

router = APIRouter(
    prefix="/org",
    tags=["Organisation"],
    dependencies=[Depends(get_current_org)]
)

org_service = OrganisationService()
event_service = EventService()
app_service = ApplicationService()
reviewservice = ReviewService()


# 🏢 Info o ulogovanoj organizaciji
@router.get("/me", response_model=OrganisationPublic)
async def get_me(current_org=Depends(get_current_org)):
    """🏢 Vraća podatke o ulogovanoj organizaciji."""
    current_org["_id"] = str(current_org["_id"])
    return current_org


# 🏗️ Kreiranje eventa
@router.post("/events/create", response_model=dict)
async def create_event(event: EventIn, current_org=Depends(get_current_org)):
    """🎉 Kreira novi događaj (samo za organizacije)."""
    try:
        return await event_service.create_event(event, str(current_org["_id"]))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 📋 Lista eventova koje je kreirala organizacija
@router.get("/events/my", response_model=List[EventPublic])
async def get_my_events(current_org=Depends(get_current_org)):
    """📋 Vraća sve događaje ulogovane organizacije."""
    org_id = str(current_org["_id"])
    return await event_service.get_events_by_organisation(org_id)


# ✏️ Ažuriranje eventa
@router.patch("/events/update/{event_id}", response_model=dict)
async def update_event(event_id: str, update_data: EventUpdate):
    """✏️ Ažurira događaj (samo organizacija koja ga je kreirala)."""
    try:
        return await event_service.update_event(event_id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))



@router.get("/OrganisationEventsApplication/{event_id}/applications", response_model=List[ApplicationPublic])
async def get_event_applications_for_event(
    event_id: str,
    current_org=Depends(get_current_org)
):
    try:
        applications = await app_service.get_event_applications(
            event_id=event_id,
            organisation_id=str(current_org["_id"])
        )
        return applications

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Greška: {str(e)}")


# 🗑️ Brisanje eventa
@router.delete("/events/delete/{event_id}", response_model=dict)
async def delete_event(event_id: str):
    """🗑️ Briše događaj (samo organizacija koja ga je kreirala)."""
    try:
        return await event_service.delete_event(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{event_id}")
async def delete_event(event_id: str, current_org=Depends(get_current_org)):
    return await event_service.delete_event(event_id, current_org["_id"])

@router.get("/history", summary="Istorija eventova ulogovane organizacije")
async def get_my_event_history(current_org=Depends(get_current_org)):
    return await event_service.get_past_events_for_org(current_org["_id"])





@router.patch("/applications/{application_id}/status/{status}")
async def update_application_status_path(
    application_id: str,
    status: OrgDecision = Path(..., description="accepted ili rejected"),
    update: ApplicationUpdate = None,  # samo napomena, bez statusa
    current_org=Depends(get_current_org)
):
    """
    🏢 Organizacija menja status prijave direktno kroz URL.
    Primer: /org/applications/{application_id}/status/accepted
    """
    update_data = {
        "status": status,
        "extra_notes": update.extra_notes if update else None
    }

    # direktan poziv servisa
    return await app_service.update_status(application_id, ApplicationUpdate(**update_data), current_org)


#radi
@router.get("/GetAllAppl/all", response_model = List[ApplicationPublic])
async def get_all_applications_for_org(current_org=Depends(get_current_org)):
    try:
        return await app_service.get_all_applications_for_org(str(current_org["_id"]))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Greška: {str(e)}")
    
    
    #eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdHVkZW50c2thLmluaWNpamF0aXZhQGV4YW1wbGUuY29tIiwicm9sZSI6Im9yZ2FuaXNhdGlvbiIsImV4cCI6MTc2MjkxMTcwN30.z5qsuOxIXUWIfJ1npclHTGayrGQA-NoAEpbEbNaJYsI
    
    
@router.post("/org/{event_id}/rate-user/{user_id}")
async def org_rates_user(
    event_id: str,
    user_id: str,
    data: ReviewOrgToUserIn,
    current_org=Depends(get_current_org),
    service: ReviewService = Depends()
):
    result = await service.create_org_to_user_review(
        event_id=event_id,
        user_id=user_id,
        organisation_id=str(current_org["_id"]),
        rating=data.rating,
        comment=data.comment
    )
    return result


@router.put("/me")
async def update_my_organisation(update: OrganisationUpdate, current_org = Depends(get_current_org)):
    data = update.model_dump(exclude_unset=True)
    return await org_service.update_organisation(current_org, data)


@router.get("/event/{event_id}")
async def get_event_applications(
    event_id: str,
    current_org = Depends(get_current_org),
    service: ApplicationService = Depends()
):
    # organizacija sme da vidi samo svoje evente → opciono možeš dodati proveru
    return await service.get_applications_for_event(event_id)