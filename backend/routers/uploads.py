import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from database.connection import db  # 👈 konekcija na MongoDB

router = APIRouter(prefix="/upload", tags=["Uploads"])

UPLOAD_DIR = "uploads"
USER_DIR = os.path.join(UPLOAD_DIR, "users")
ORG_DIR = os.path.join(UPLOAD_DIR, "orgs")

os.makedirs(USER_DIR, exist_ok=True)
os.makedirs(ORG_DIR, exist_ok=True)


@router.post("/user/{user_id}")
async def upload_user_image(user_id: str, file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Fajl mora biti slika")

    # ime fajla = user_id + ekstenzija
    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(USER_DIR, f"{user_id}{file_ext}")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    url = f"/uploads/users/{user_id}{file_ext}"

    # update u bazi
    await db["users"].update_one(
        {"_id": user_id},
        {"$set": {"profile_image": url}}
    )

    return {"url": url}


@router.post("/org/{org_id}")
async def upload_org_logo(org_id: str, file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Fajl mora biti slika")

    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(ORG_DIR, f"{org_id}{file_ext}")

    with open(file_path, "wb") as f:
        f.write(await file.read())

    url = f"/uploads/orgs/{org_id}{file_ext}"

    # update u bazi
    await db["organisations"].update_one(
        {"_id": org_id},
        {"$set": {"logo": url}}
    )

    return {"url": url}
