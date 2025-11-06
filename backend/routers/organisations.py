from typing import List
from fastapi import APIRouter, Depends
from models.organisation_models import OrganisationIn, OrganisationPublic
from services.organisation_service import OrganisationService
from auth.dependencies import admin_required
from models.user_models import UserDB

router = APIRouter(prefix="/organisations", tags=["Organisations"])
service = OrganisationService()


@router.post("/register")
async def register_organisation(org_in: OrganisationIn):
    return await service.register_organisation(org_in)

@router.get("/pending", dependencies=[Depends(admin_required)], response_model=List[OrganisationPublic])
async def get_pending_orgs(current_admin: UserDB = Depends(admin_required)):
    return await service.list_pending()


@router.patch("/{org_id}/approve", dependencies=[Depends(admin_required)])
async def approve_org(org_id: str, current_admin: UserDB = Depends(admin_required)):
    return await service.approve_organisation(org_id)


@router.patch("/{org_id}/reject", dependencies=[Depends(admin_required)])
async def reject_org(org_id: str, current_admin: UserDB = Depends(admin_required)):
    return await service.reject_organisation(org_id)

@router.get("/findorganisations", response_model=List[OrganisationPublic])
async def findorganisations():
    return await service.find_organisations()