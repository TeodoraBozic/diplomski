from bson import ObjectId
from database.connection import organisations_col

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
        return await organisations_col.find_one({"email": email})



