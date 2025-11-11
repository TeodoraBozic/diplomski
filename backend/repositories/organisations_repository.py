from bson import ObjectId
from database.connection import organisations_col, events_col
from bson.errors import InvalidId


class OrganisationRepository:
    
    async def find_pending(self):
        orgs = await organisations_col.find({"status": "pending"}).to_list(length=None)
        
        for org in orgs:
            org["_id"] = str(org["_id"])

        return orgs
        

    async def update_status(self, org_id: str, new_status: str):
        result = await organisations_col.update_one(
            {"_id": ObjectId(org_id)},
            {"$set": {"status": new_status}}
        )
        return result.modified_count

    async def create_organisation(self, org_data: dict):
        result = await organisations_col.insert_one(org_data)
        return str(result.inserted_id)

    async def find_by_email(self, email: str):
        org = await organisations_col.find_one({"email": email})
        if org:
            org["_id"] = str(org["_id"])
        return org

    
    #ovo je za prikaz korisnicima
    async def find_organisations(self):
        orgs  = await organisations_col.find({"status": "approved"}).to_list(length=None)
        
        for org in orgs:
            org["_id"]= str(org["_id"])
            
        return orgs
    
    #svi eventi jedne organizacije
    async def find_organisations_events(self, organisation_id: str):
        events = await events_col.find({"organisation_id": ObjectId(organisation_id)}).to_list(length=None)
        for e in events:
            e["_id"] = str(e["_id"])
            e["organisation_id"] = str(e["organisation_id"])
        return events
    
    
    async def find_many_by_ids(self, ids: list):
        if not ids:
            return []

        # ✅ filtriraj samo validne ObjectId stringove
        valid_ids = [ObjectId(i) for i in ids if ObjectId.is_valid(i)]
        if not valid_ids:
            return []

        orgs = await organisations_col.find({"_id": {"$in": valid_ids}}).to_list(length=None)

        for o in orgs:
            o["_id"] = str(o["_id"])
        return orgs

        
    async def find_by_id(self, organisation_id: str):
        try:
            org = await organisations_col.find_one({"_id": ObjectId(organisation_id)})
        except InvalidId:
            return None
        if org:
            org["_id"] = str(org["_id"])
        return org
        
    async def find_by_username(self, username: str):
            cursor = organisations_col.find(
        {"username": {"$regex": username, "$options": "i"}} )
            orgs = await cursor.to_list(length=None)
            for org in orgs:
                org["_id"] = str(org["_id"])
            return orgs
  
        



