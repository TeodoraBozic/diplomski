from fastapi import APIRouter, Depends, HTTPException
from typing import List
from auth.dependencies import get_current_org
from models.application_models import ApplicationUpdate
from services.application_service import ApplicationService
from services.event_service import EventService
from services.organisation_service import OrganisationService
from models.event_models import EventIn, EventUpdate, EventPublic
from models.organisation_models import OrganisationPublic

router = APIRouter(
    prefix="/org",
    tags=["Organisation"],
    dependencies=[Depends(get_current_org)]
)

org_service = OrganisationService()
event_service = EventService()
app_service = ApplicationService()


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





@router.get("/events/{event_id}/applications")
async def get_event_applications(event_id: str, current_org=Depends(get_current_org)):
    try:
        return await app_service.get_event_applications(event_id, current_org["_id"])
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ✅ Organizator menja status prijave (accept/reject)
@router.patch("/applications/{application_id}")
async def update_application_status(application_id: str, update: ApplicationUpdate, current_org=Depends(get_current_org)):
    return await app_service.update_status(application_id, update)