import os
import uuid
from bson import ObjectId
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from database.connection import db
from auth.dependencies import get_current_user, get_current_org

router = APIRouter(prefix="/upload", tags=["Uploads"])

UPLOAD_DIR = "uploads"
USER_DIR = os.path.join(UPLOAD_DIR, "users")
ORG_DIR = os.path.join(UPLOAD_DIR, "orgs")

os.makedirs(USER_DIR, exist_ok=True)
os.makedirs(ORG_DIR, exist_ok=True)

MAX_FILE_SIZE_MB = 5
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg"}

EVENT_DIR = os.path.join(UPLOAD_DIR, "events")
os.makedirs(EVENT_DIR, exist_ok=True)


# =====================================
# 📸 Upload slika SAMO za current user
# =====================================
@router.post("/user/me")
async def upload_my_image(
    request: Request,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Dozvoljeni su samo JPEG i PNG fajlovi")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Fajl je prevelik (maksimalno {MAX_FILE_SIZE_MB}MB)")

    user_id = str(current_user.id)

    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(USER_DIR, f"{user_id}{file_ext}")

    with open(file_path, "wb") as f:
        f.write(content)

    base_url = str(request.base_url).rstrip("/")
    url = f"{base_url}/uploads/users/{user_id}{file_ext}"

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile_image": url}}
    )

    return JSONResponse(content={"url": url, "message": "Tvoja slika je uspešno uploadovana"})


# ===========================================
# 🏢 Upload logo SAMO za current organisation
# ===========================================
@router.post("/org/me")
async def upload_my_org_logo(
    request: Request,
    file: UploadFile = File(...),
    current_org=Depends(get_current_org)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Dozvoljeni su samo JPEG i PNG fajlovi")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Fajl je prevelik (maksimalno {MAX_FILE_SIZE_MB}MB)")

    org_id = str(current_org["_id"])

    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(ORG_DIR, f"{org_id}{file_ext}")

    with open(file_path, "wb") as f:
        f.write(content)

    base_url = str(request.base_url).rstrip("/")
    url = f"{base_url}/uploads/orgs/{org_id}{file_ext}"

    await db["organisations"].update_one(
        {"_id": ObjectId(org_id)},
        {"$set": {"logo": url}}
    )

    return JSONResponse(content={"url": url, "message": "Logo tvoje organizacije je uspešno uploadovan"})



@router.post("/event-image")
async def upload_event_image(
    request: Request,
    file: UploadFile = File(...),
    current_org = Depends(get_current_org)   # samo organizacije mogu da uploaduju
):
    # Validacija tipa fajla
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Dozvoljeni su samo JPEG i PNG fajlovi")

    # Validacija veličine
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Fajl je prevelik (maksimalno {MAX_FILE_SIZE_MB}MB)")

    # Generisanje imena fajla
    ext = os.path.splitext(file.filename)[1]
    filename = f"event_{uuid.uuid4()}{ext}"
    file_path = os.path.join(EVENT_DIR, filename)

    # Snimanje fajla
    with open(file_path, "wb") as f:
        f.write(content)

    # Formiranje apsolutnog URL-a
    base_url = str(request.base_url).rstrip("/")
    url = f"{base_url}/uploads/events/{filename}"

    return {"url": url, "message": "Slika događaja uspešno uploadovana"}