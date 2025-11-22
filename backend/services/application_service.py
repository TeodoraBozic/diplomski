from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from models.organisation_models import OrganisationDB
from models.user_models import UserDB
from repositories.applications_repository import ApplicationRepository
from models.application_models import ApplicationIn, ApplicationUpdate, ApplicationStatus
from repositories.events_repository import EventRepository
from database.connection import applications_col
from repositories.organisations_repository import OrganisationRepository
from services.notification_service import NotificationService

from mongo_cleaner import clean_doc   # ✅ DODATO


class ApplicationService:
    def __init__(self):
        self.repo = ApplicationRepository()
        self.event_repo = EventRepository()
        self.org_repo = OrganisationRepository()
        self.notif_service = NotificationService()

    # -------------------------------------------------------
    # 1. USER APPLY
    # -------------------------------------------------------
    async def apply(self, application: ApplicationIn, current_user: UserDB):

        event = await self.event_repo.find_by_id(str(application.event_id))
        if not event:
            raise HTTPException(status_code=404, detail="Događaj nije pronađen.")

        user_id = ObjectId(current_user.id)
        event_id = ObjectId(application.event_id)

        existing = await self.repo.find_by_user_and_event(user_id, event_id)
        if existing:
            raise HTTPException(status_code=400, detail="Već ste se prijavili na ovaj događaj.")

        user_snapshot = {
            "id": user_id,
            "first_name": current_user.first_name,
            "email": current_user.email,
            "username": current_user.username,
        }

        app_data = application.model_dump()
        app_data.update({
            "user_id": user_id,
            "event_id": event_id,
            "status": ApplicationStatus.pending,
            "created_at": datetime.utcnow(),
            "user_info": user_snapshot
        })

        inserted_id = await self.repo.create(app_data)

        await self.notif_service.notify_org(
            organisation_id=str(event["organisation_id"]),
            message=f"New volunteer applied for your event: {event['title']}"
        )

        return clean_doc({
            "message": "Prijava uspešno poslata.",
            "application_id": inserted_id,
            "status": ApplicationStatus.pending
        })

    # -------------------------------------------------------
    # 2. USER — MY APPLICATIONS
    # -------------------------------------------------------
    async def get_my_applications(self, user_id: str):

        applications = await self.repo.find_by_user(user_id)
        if not applications:
            return []

        for app in applications:
            if isinstance(app["event_id"], ObjectId):
                app["event_id"] = str(app["event_id"])

        event_ids = [app["event_id"] for app in applications]
        events = await self.event_repo.find_by_ids(event_ids)

        event_map = {str(e["_id"]): e for e in events}

        for app in applications:
            event = event_map.get(app["event_id"])
            if event:
                app["event_title"] = event["title"]
                org = await self.org_repo.find_by_id(str(event["organisation_id"]))
                app["organisation_name"] = org["name"] if org else "Nepoznata organizacija"
            else:
                app["event_title"] = "Nepoznat događaj"
                app["organisation_name"] = "Nepoznata organizacija"

        return clean_doc(applications)

    # -------------------------------------------------------
    # 3. ORG — APPLICATIONS FOR SINGLE EVENT
    # -------------------------------------------------------
    async def get_event_applications(self, event_id: str, organisation_id: str):

        event = await self.event_repo.find_by_id(event_id)
        if not event or str(event["organisation_id"]) != organisation_id:
            raise HTTPException(status_code=403, detail="Event ne pripada organizaciji")

        org = await self.org_repo.find_by_id(event["organisation_id"])
        applications = await self.repo.find_by_event(event_id)
        applications = [a for a in applications if a["status"] != "cancelled"]

        for app in applications:
            if isinstance(app["event_id"], ObjectId):
                app["event_id"] = str(app["event_id"])

            app["event_title"] = event["title"]
            app["organisation_name"] = org["name"] if org else "Nepoznata organizacija"

        return clean_doc(applications)

    # -------------------------------------------------------
    # 4. ORG — ALL APPLICATIONS FOR ALL EVENTS
    # -------------------------------------------------------
    async def get_all_applications_for_org(self, organisation_id: str):

        events = await self.event_repo.find_by_organisation(organisation_id)
        if not events:
            return []

        event_map = {str(e["_id"]): e["title"] for e in events}
        event_ids = list(event_map.keys())

        applications = await self.repo.find_by_multiple_events(event_ids)
        applications = [a for a in applications if a["status"] != "cancelled"]

        for app in applications:
            if isinstance(app["event_id"], ObjectId):
                app["event_id"] = str(app["event_id"])

        org = await self.org_repo.find_by_id(organisation_id)
        org_name = org["name"] if org else "Nepoznata organizacija"

        for app in applications:
            app["event_title"] = event_map.get(app["event_id"], "Nepoznat događaj")
            app["organisation_name"] = org_name

        return clean_doc(applications)

    # -------------------------------------------------------
    # 5. UPDATE STATUS
    # -------------------------------------------------------
    async def update_status(self, app_id: str, update: ApplicationUpdate, current_org: OrganisationDB):

        application = await applications_col.find_one({"_id": ObjectId(app_id)})
        if not application:
            raise HTTPException(status_code=404, detail="Prijava nije pronađena.")

        event = await self.event_repo.find_by_id(str(application["event_id"]))
        if not event:
            raise HTTPException(status_code=404, detail="Događaj nije pronađen.")

        if str(event["organisation_id"]) != str(current_org["_id"]):
            raise HTTPException(status_code=403, detail="Nemate dozvolu da menjate ovu prijavu.")

        update_data = update.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.utcnow()

        await self.repo.update_status(app_id, update_data)
        return clean_doc({"message": "Status prijave je uspešno ažuriran."})

    # -------------------------------------------------------
    # 6. CANCEL APPLICATION
    # -------------------------------------------------------
    async def cancel_application(self, app_id: str, current_user):

        application = await self.repo.find_by_id(app_id)
        if not application:
            raise HTTPException(status_code=404, detail="Prijava nije pronađena.")

        if str(application["user_id"]) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Nije dozvoljeno povući tuđu prijavu.")

        if application["status"] in ["accepted", "rejected"]:
            raise HTTPException(status_code=400, detail="Ne možete povući prijavu koja je već obrađena.")

        update_data = {
            "status": "cancelled",
            "updated_at": datetime.utcnow()
        }

        await self.repo.update_status(app_id, update_data)
        return clean_doc({"message": "Prijava je uspešno povučena."})

    # -------------------------------------------------------
    # 7. BACKDOOR GET APPLICATIONS FOR EVENT
    # -------------------------------------------------------
    async def get_applications_for_event(self, event_id: str):
        applications = await self.repo.find_appls_by_event(event_id)
        return clean_doc(applications)
