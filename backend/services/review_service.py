# services/review_service.py

import datetime
from bson import ObjectId
from fastapi import HTTPException

from models.review_models import PublicReview
from repositories.organisations_repository import OrganisationRepository
from repositories.review_repository import ReviewRepository
from repositories.events_repository import EventRepository
from repositories.applications_repository import ApplicationRepository
from repositories.user_repository import UserRepository


class ReviewService:

    def __init__(self):
        self.repo = ReviewRepository()
        self.event_repo = EventRepository()
        self.app_repo = ApplicationRepository()
        self.user_repo = UserRepository()
        self.org_repo = OrganisationRepository()


    # ===============================
    # USER → ORG
    # ===============================
    async def create_user_to_org_review(self, event_id, user_id, rating, comment):
        from bson import ObjectId
        import datetime

        # 1️⃣ Konverzija u ObjectId (ispravno i ujednačeno)
        event_oid = ObjectId(event_id)
        user_oid = ObjectId(user_id)

        # 2️⃣ Proveri da li event postoji
        event = await self.event_repo.find_by_id(str(event_oid))
        if not event:
            raise HTTPException(404, "Event ne postoji.")

        # 3️⃣ Proveri da li je event završen
        if event["end_date"] > datetime.datetime.utcnow():
            raise HTTPException(400, "Event još nije završen.")

        # 4️⃣ Proveri da li je user zaista volontirao na eventu
        application = await self.app_repo.find_by_user_and_event(user_oid, event_oid)
        if not application or application["status"] != "accepted":
            raise HTTPException(400, "Ne možeš oceniti — nisi volontirao na ovom eventu.")
        
        existing_review = await self.repo.find_user_to_org_review(user_oid, event_oid)
        if existing_review:
            raise HTTPException(400, "Već ste ocenili organizaciju za ovaj događaj.")

        # 5️⃣ Formiranje review dokumenta
        review_data = {
            "event_id": event_oid,
            "user_id": user_oid,
            "organisation_id": event["organisation_id"],
            "rating": rating,
            "comment": comment,
            "direction": "user_to_org",
            "created_at": datetime.datetime.utcnow()
        }

        # 6️⃣ Sačuvaj review
        inserted_id = await self.repo.create_review(review_data)

        return {
            "message": "Review uspešno dodat.",
            "review_id": str(inserted_id)
        }


        # ===============================
        # ORG → USER
        # ===============================
    async def create_org_to_user_review(self, event_id, user_id, organisation_id, rating, comment):

        event_id = ObjectId(event_id)
        user_id = ObjectId(user_id)
        organisation_id = ObjectId(organisation_id)

        # 1. Event postoji?
        event = await self.event_repo.find_by_id(event_id)
        if not event:
            raise HTTPException(404, "Event ne postoji.")

        # 2. Event mora biti završen
        if event["end_date"] > datetime.datetime.utcnow():
            raise HTTPException(400, "Ne može se oceniti dok event ne završi.")

        # 3. Da li je user bio accepted volonter?
        application = await self.app_repo.find_by_user_and_event(user_id, event_id)
        if not application or application["status"] != "accepted":
            raise HTTPException(400, "User nije bio prihvaćen volonter na ovom eventu.")

        # 4. Da li je već ocenjen?
        exists = await self.repo.find_org_to_user_review(
            user_id=user_id,
            organisation_id=organisation_id,
            event_id=event_id
        )
        if exists:
            raise HTTPException(400, "Već si ocenio ovog korisnika za ovaj event.")

        # 5. Kreiranje review-a
        data = {
            "event_id": event_id,
            "user_id": user_id,
            "organisation_id": organisation_id,
            "rating": rating,
            "comment": comment,
            "direction": "org_to_user",
            "created_at": datetime.datetime.utcnow()
        }

        new_id = await self.repo.create(data)
        return await self.repo.find_by_id(new_id)




#org to user
    async def create_org_to_user_review(self, event_id, user_id, organisation_id, rating, comment):

        event_oid = ObjectId(event_id)
        user_oid = ObjectId(user_id)
        org_oid = ObjectId(organisation_id)

        # 1️⃣ Proveri da event postoji
        event = await self.event_repo.find_by_id(str(event_oid))
        if not event:
            raise HTTPException(404, "Event ne postoji.")

        # 2️⃣ Proveri da je event završen
        if event["end_date"] > datetime.datetime.utcnow():
            raise HTTPException(400, "Event još nije završen.")

        # 3️⃣ Proveri da li je user bio accepted volonter na eventu
        application = await self.app_repo.find_by_user_and_event(user_oid, event_oid)
        if not application or application["status"] != "accepted":
            raise HTTPException(400, "Korisnik nije bio prihvaćen volonter na ovom eventu.")

        # 4️⃣ Da li je organizacija već ocenila ovog user-a za ovaj event?
        exists = await self.repo.find_org_to_user_review(
            user_id=user_oid,
            organisation_id=org_oid,
            event_id=event_oid
        )
        if exists:
            raise HTTPException(400, "Već ste ocenili ovog korisnika za ovaj događaj.")

        # 5️⃣ Formiranje review-a
        review_data = {
            "event_id": event_oid,
            "user_id": user_oid,
            "organisation_id": org_oid,
            "rating": rating,
            "comment": comment,
            "direction": "org_to_user",
            "created_at": datetime.datetime.utcnow()
        }

        new_id = await self.repo.create_review(review_data)

        return {
            "message": "Review uspešno dodat.",
            "review_id": str(new_id)
        }
        



    async def get_reviews_received_by_org(self, org_id: str):
        org_oid = ObjectId(org_id)

        reviews = await self.repo.find_many({
            "organisation_id": org_oid,
            "direction": "user_to_org"
        })

        # 🔥 KONVERZIJA ObjectId → string
        return [await self.to_public_review(r) for r in reviews]
    
    
    async def get_reviews_given_by_org(self, org_id: str):
        org_oid = ObjectId(org_id)

        # Uzmi sve review-e koje je org dao userima
        reviews = await self.repo.find_many({
            "organisation_id": org_oid,
            "direction": "org_to_user"
        })

        # Konverzija ObjectId → string (bez ovoga FE puca)
        return [await self.to_public_review(r) for r in reviews]


    def serialize_mongo_doc(self, doc):
        doc["_id"] = str(doc["_id"])
        doc["event_id"] = str(doc["event_id"])
        doc["user_id"] = str(doc["user_id"])
        doc["organisation_id"] = str(doc["organisation_id"])
        return doc


    async def to_public_review(self, review):
    # Event
        event = await self.event_repo.find_by_id(str(review["event_id"]))
        event_name = event["title"] if event else "Unknown event"

        # User
        user = await self.user_repo.find_by_id(str(review["user_id"]))
        if user:
            user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        else:
            user_name = "Unknown user"

        # Organisation
        org = await self.org_repo.find_by_id(str(review["organisation_id"]))
        org_name = org["name"] if org else "Unknown organisation"

        return PublicReview(
            event_name=event_name,
            user_name=user_name,
            organisation_name=org_name,
            rating=review["rating"],
            comment=review.get("comment"),
            #created_at=review["created_at"]
        )

    async def get_public_reviews_for_org(self, org_id: str):
        org_oid = ObjectId(org_id)

        reviews = await self.repo.find_many({
            "organisation_id": org_oid,
            "direction": "user_to_org"
        })

        return [await self.to_public_review(r) for r in reviews]
    
    async def get_public_reviews_for_user(self, user_id: str):
        user_oid = ObjectId(user_id)

        reviews = await self.repo.find_many({
            "user_id": user_oid,
            "direction": "org_to_user"
        })

        return [await self.to_public_review(r) for r in reviews]



    async def get_user_avg_rating(self, user_id: str):
        user_oid = ObjectId(user_id)

        pipeline = [
            {"$match": {"user_id": user_oid, "direction": "org_to_user"}},
            {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
        ]

        result = await self.repo.aggregate(pipeline)

        return {"avg_rating": round(result[0]["avg_rating"], 2)} if result else {"avg_rating": None}
    
    
    async def get_org_avg_rating(self, org_id: str):
        pipeline = [
            {"$match": {
                "organisation_id": ObjectId(org_id),
                "direction": "user_to_org"
            }},
            {"$group": {
                "_id": None,
                "avg_rating": {"$avg": "$rating"}
            }}
        ]

        result = await self.repo.aggregate(pipeline)

        return {"avg_rating": round(result[0]["avg_rating"], 2)} if result else {"avg_rating": None}

    
    
