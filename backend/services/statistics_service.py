from datetime import datetime

from repositories.applications_repository import ApplicationRepository
from repositories.events_repository import EventRepository
from repositories.organisations_repository import OrganisationRepository

class StatisticsService:
    def __init__(self):
        self.event_repo = EventRepository()
        self.app_repo = ApplicationRepository()
        self.org_repo = OrganisationRepository()

    async def get_organisation_stats(self, organisation_id: str):
        # organisation_id je USTVARI username, pa prvo naći organizaciju
        org = await self.org_repo.find_exact_by_username(organisation_id)
        if not org:
            raise ValueError("Organisation not found")

        org_id = str(org["_id"])
        org_name = org["username"]

        # 1️⃣ svi eventi te organizacije
        events = await self.event_repo.find_by_organisation(org_id)
        event_count = len(events)
        event_ids = [str(e["_id"]) for e in events]

        # ako nema evenata – odmah vrati minimalne statistike
        if not events:
            return {
                "organisation_name": org_name,
                "total_events": 0,
                "total_applications": 0,
                "accepted_volunteers": 0,
                "rejected_or_cancelled": 0,
                "avg_applications_per_event": 0,
                "active_events": 0,
                "last_event": None,
            }

        # 2️⃣ sve prijave za te evente
        apps = await self.app_repo.find_by_multiple_events(event_ids)
        total_apps = len(apps)

        accepted = len([a for a in apps if a["status"] == "accepted"])
        rejected_cancelled = len([a for a in apps if a["status"] in ["rejected", "cancelled"]])

        avg_per_event = total_apps / event_count if event_count > 0 else 0

        # 3️⃣ aktivni i poslednji event
        now = datetime.utcnow()
        active_events = len([e for e in events if e["end_date"] >= now])

        last_event = max(events, key=lambda e: e["created_at"], default=None)
        last_event_info = {
            "title": last_event["title"],
            "start_date": last_event["start_date"],
        } if last_event else None

        return {
            "organisation_name": org_name,
            "total_events": event_count,
            "total_applications": total_apps,
            "accepted_volunteers": accepted,
            "rejected_or_cancelled": rejected_cancelled,
            "avg_applications_per_event": round(avg_per_event, 2),
            "active_events": active_events,
            "last_event": last_event_info,
        }
