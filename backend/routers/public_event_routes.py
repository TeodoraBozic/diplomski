from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models.event_models import EventPublic
from services import event_service
from services.event_service import EventService

router = APIRouter(prefix="/public/events", tags=["Public - Events"])
service = EventService()


@router.get("/all", response_model=List[EventPublic])
async def get_all_events():
    return await service.get_all_events()


@router.get("/by-title/{title}", response_model=EventPublic)
async def get_event_by_title(title: str):
    try:
        return await service.get_event_by_title(title)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/filter", response_model=List[EventPublic])
async def filter_events(
    category: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    location: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    return await service.filter_events(category, tags, location, date_from, date_to)


@router.get("/by-org/{username}", response_model=List[EventPublic])
async def get_events_by_organisation(username: str):
    try:
        return await service.get_events_by_organisation_username(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/location/{city}", response_model=List[EventPublic])
async def get_events_by_location(city: str):
    return await service.get_events_by_location(city)


@router.get("/this-month", response_model=List[EventPublic])
async def get_events_this_month():
    return await service.get_events_this_month()


@router.get("/this-week", response_model=List[EventPublic])
async def get_events_this_week():
    return await service.get_events_this_week()


#radi = proveriti da li po id-ju treba 
@router.get("/organisation/{organisation_id}/history", response_model=List[EventPublic])
async def get_public_org_history(organisation_id: str):
    return await service.get_public_past_events(organisation_id)

#radi
@router.get("/upcoming",response_model=List[EventPublic] ,summary="upcoming events = sortirano")
async def get_upcoming_events():
    return await service.get_upcoming_events()


@router.get("/categories", summary="Lista svih kategorija događaja")
async def get_all_categories():
    return await service.get_all_categories()



@router.get("/{event_id}", response_model=EventPublic)
async def get_event_by_id(event_id: str):
    try:
        return await service.get_event_by_id(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    
    
