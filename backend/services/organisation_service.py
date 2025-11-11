import datetime
import bcrypt
from models.organisation_models import OrganisationIn, OrganisationStatus
from repositories.organisations_repository import OrganisationRepository
from fastapi import HTTPException

repo = OrganisationRepository()

class OrganisationService:
    async def approve_organisation(self, org_id: str):
        modified = await repo.update_status(org_id, "approved")
        if not modified:
            raise HTTPException(404, detail="Organizacija nije pronađena")
        return {"message": "Organizacija je uspešno odobrena."}

    async def reject_organisation(self, org_id: str):
        modified = await repo.update_status(org_id, "rejected")
        if not modified:
            raise HTTPException(404, detail="Organizacija nije pronađena")
        return {"message": "Organizacija je odbijena."}

    async def list_pending(self):
        return await repo.find_pending()

#organizacija salje zahtev za registraciju sa svojim podacima organisationIn
    async def register_organisation(self, org_in: OrganisationIn):
       #provera da li postoji org sa tim emailom
        existing = await repo.find_by_email(org_in.email)
        if existing:
            raise HTTPException(status_code=400, detail="Organizacija sa ovim emailom već postoji.")

        #hesiranje passworda
        hashed_pw = bcrypt.hashpw(org_in.password.encode(), bcrypt.gensalt()).decode()

        #mora model dump zbog cuvanja u bazi
        org_data = org_in.model_dump()
        org_data["password"] = hashed_pw
        org_data["status"] = OrganisationStatus.pending #inicijalno je na cekanju - pending 
        org_data["created_at"] = datetime.datetime.utcnow()
        org_data["updated_at"] = None

        # 4️⃣ Čuvanje u bazu
        org_id = await repo.create_organisation(org_data)

        # 5️⃣ Povratna poruka
        return {
            "message": "Zahtev za registraciju organizacije je uspešno poslat i čeka odobrenje admina.",
            "id": org_id
        }
        
    async def find_organisations(self):
        return await repo.find_organisations()


    async def get_organisation_by_id(self, org_id: str):
        org = await repo.find_by_id(org_id)
        if not org:
            raise ValueError("Organizacija nije pronađena")
        return org

    async def get_organisation_by_username(self, username: str):
        org = await repo.find_by_username(username)
        if not org:
            raise ValueError("Organizacija sa tim username-om nije pronađena niti sličnim")
        return org
    
    async def get_current_organisation(self, org_email: str):
        org = await repo.find_by_email(org_email)
        if not org:
            raise ValueError("Organizacija nije pronađena")
        return org
    
    
    