from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from models.organisation_models import OrganisationDB
from models.user_models import UserDB
from repositories.applications_repository import ApplicationRepository
from models.application_models import ApplicationIn, ApplicationDB, ApplicationUpdate, ApplicationStatus
from repositories.events_repository import EventRepository
from database.connection import applications_col
class ApplicationService:
    def __init__(self):
        self.repo = ApplicationRepository()
        self.event_repo = EventRepository()
        
        

    # korisnik se prijavljuje = radi!! i snapchot radi za sad mi ima smisla
    async def apply(self, application: ApplicationIn, current_user: UserDB):
        event = await self.event_repo.find_by_id(str(application.event_id))
        if not event:
            raise HTTPException(status_code=404, detail="Događaj nije pronađen.")

        user_id = str(current_user.id)
        event_id = str(application.event_id)

        # 2️⃣ Proveri da li je već aplicirao
        existing = await self.repo.find_by_user_and_event(user_id, event_id)
        if existing:
            raise HTTPException(status_code=400, detail="Već ste se prijavili na ovaj događaj.")

       
        user_snapshot = {
            "first_name": current_user.first_name,
            "email": current_user.email,
            "username": current_user.username,
        }

        # 4️⃣ Priprema podataka za čuvanje u bazi
        app_data = application.model_dump()
        app_data.update({
            "user_id": ObjectId(user_id),
            "status": ApplicationStatus.pending,
            "created_at": datetime.utcnow(),
            "user_info": user_snapshot
        })

        inserted_id = await self.repo.create(app_data)

        return {
            "message": "Prijava uspešno poslata.",
            "application_id": inserted_id,
            "status": ApplicationStatus.pending
        }
        
        
        
    async def get_user_applications(self, user_id: str):
        return await self.repo.find_by_user(user_id)

    async def get_event_applications(self, event_id: str):
        return await self.repo.find_by_event(event_id)

    async def update_status(self, app_id: str, update: ApplicationUpdate, current_org: OrganisationDB):
       #organizacija menja status prijave!! 

        #pronalazimo prijavu
        application = await applications_col.find_one({"_id": ObjectId(app_id)})
        if not application:
            raise HTTPException(status_code=404, detail="Prijava nije pronađena.")

        #pronalazimo event
        event = await self.event_repo.find_by_id(str(application["event_id"]))
        if not event:
            raise HTTPException(status_code=404, detail="Događaj nije pronađen.")

        #BITNO! organizacija moze samo svoje evente da kontrolise
        if str(event["organisation_id"]) != str(current_org.id):
            raise HTTPException(status_code=403, detail="Nemate dozvolu da menjate ovu prijavu.")

        #azuriranje
        update_data = update.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.utcnow()

        await self.repo.update_status(app_id, update_data)

        return {"message": "Status prijave je uspešno ažuriran."}