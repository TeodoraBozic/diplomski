from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.event_models import EventPublic
from models.organisation_models import OrganisationIn, OrganisationPublic
from services import statistics_service
from services.organisation_service import OrganisationService
from services.review_service import ReviewService

router = APIRouter(prefix="/public/organisations", tags=["Public - Organisations"])
service = OrganisationService()

statistics_service = statistics_service.StatisticsService()

@router.post("/register", response_model=dict)
async def register_organisation(org_in: OrganisationIn):
    """🌍 Registruje novu organizaciju."""
    return await service.register_organisation(org_in)

@router.get("/", response_model=List[OrganisationPublic])
async def find_organisations():
    """🌍 Vraća sve odobrene organizacije."""
    return await service.find_organisations()

@router.get("/{org_id}", response_model=OrganisationPublic)
async def get_organisation_by_id(org_id: str):
    """🔍 Vraća organizaciju po ID-ju."""
    try:
        return await service.get_organisation_by_id(org_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/by-username/{username}", response_model=List[OrganisationPublic])
async def get_organisation_by_username(username: str):
    """🔍 Vraća organizaciju po username-u."""
    try:
        return await service.get_organisation_by_username(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))



@router.get("statiiiiistika/{organisation_id}/stats", summary="Javna statistika organizacije")
async def get_org_stats(organisation_id: str):
    stats = await statistics_service.get_organisation_stats(organisation_id)
    return stats


@router.get("/org/{org_id}/received", tags=["Reviews"])
async def public_get_reviews_received_by_org(
    org_id: str,
    service: ReviewService = Depends()
):
    return await service.get_reviews_received_by_org(org_id)


@router.get("/org/{org_id}/reviews", tags=["Reviews"])
async def public_reviews_for_org(org_id: str, service: ReviewService = Depends()):
    return await service.get_public_reviews_for_org(org_id)

@router.get("/org/{org_id}/avg-rating", tags=["Reviews"])
async def public_org_avg_rating(org_id: str, service: ReviewService = Depends()):
    return await service.get_org_avg_rating(org_id)




