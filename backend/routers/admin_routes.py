from fastapi import APIRouter, Depends
from auth.dependencies import admin_required
from models.user_models import UserDB
from services.organisation_service import OrganisationService
from models.organisation_models import OrganisationPublic
from typing import List

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(admin_required)] #samo adminove funkcije
)

service = OrganisationService()

#funckije su: 

@router.get("/pending", dependencies=[Depends(admin_required)], response_model=List[OrganisationPublic])
async def get_pending_orgs(current_admin: UserDB = Depends(admin_required)):
    return await service.list_pending()


@router.patch("/{org_name}/approve", dependencies=[Depends(admin_required)])
async def approve_org(org_name: str, current_admin: UserDB = Depends(admin_required)):
    return await service.approve_organisation(org_name)


@router.patch("/{org_name}/reject", dependencies=[Depends(admin_required)])
async def reject_org(org_name: str, current_admin: UserDB = Depends(admin_required)):
    return await service.reject_organisation(org_name)
