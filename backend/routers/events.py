import token
from fastapi import APIRouter, HTTPException, Query, Depends
from models.event_models import EventIn, EventUpdate
from services.event_service import EventService
from auth.dependencies import get_current_org  # za autorizaciju organizacija

router = APIRouter(prefix="/events", tags=["Events"])
service = EventService()

# 1️⃣ Kreiranje eventa (samo organizacija)
@router.post(
    "/createevent",
    dependencies=[Depends(get_current_org)],
    responses={401: {"description": "Unauthorized"}}
)
async def create_event(event: EventIn, current_org=Depends(get_current_org)):
    print("🎯 ORGANIZACIJA:", current_org)
    event.organisation_id = str(current_org["_id"])
    try:
        return await service.create_event(event)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 2️⃣ Svi događaji (javna lista)
@router.get("/all")
async def get_all_events():
    return await service.get_all_events()


# 3️⃣ Detalji događaja po ID-u
@router.get("/{event_id}")
async def get_event_by_id(event_id: str):
    try:
        return await service.get_event_by_id(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# 4️⃣ Događaji jedne organizacije (samo za ulogovanu organizaciju)
@router.get("/my")
async def get_my_events(current_org=Depends(get_current_org)):
    org_id = current_org["_id"]
    return await service.get_events_by_organisation(org_id)


# 5️⃣ Search (pretraga po naslovu, tagovima, itd.)
@router.get("/search")
async def search_events(query: str):
    return await service.search_events(query)


# 6️⃣ Filter događaja po kategoriji, lokaciji, tagovima, datumu
@router.get("/filter")
async def filter_events(
    category: str = None,
    tags: list[str] = Query(None),
    location: str = None,
    date_from: str = None,
    date_to: str = None
):
    return await service.filter_events(category, tags, location, date_from, date_to)


# 7️⃣ Ažuriranje eventa (samo organizacija)
@router.patch("/update/{event_id}")
async def update_event(event_id: str, update_data: EventUpdate, current_org=Depends(get_current_org)):
    try:
        return await service.update_event(event_id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# 8️⃣ Brisanje eventa (samo organizacija)
@router.delete("/delete/{event_id}")
async def delete_event(event_id: str, current_org=Depends(get_current_org)):
    try:
        return await service.delete_event(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
