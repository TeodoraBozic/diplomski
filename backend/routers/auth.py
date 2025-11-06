import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from bson import ObjectId

from database.connection import users_col, organisations_col
from models.organisation_models import OrganisationIn, OrganisationLogin, OrganisationRole
from models.user_models import UserIn, UserDB, UserPublic, Role
from auth.auth_utils import hash_password, verify_password
from auth.jwt_handler import create_access_token, EXPIRE_MINUTES
from auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


# --- Registracija korisnika ---
@router.post("/register", response_model=UserPublic)
async def register(user: UserIn):
    # Provera jedinstvenih polja
    if await users_col.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email već postoji.")
    
    if await users_col.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Korisnički username je zauzet! Pokušajte ponovo.")

    # Priprema i hash lozinke
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["role"] = Role.user.value  # koristi Enum vrednost "user"

    result = await users_col.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)

    # Vraćamo UserPublic (bez passworda)
    return UserPublic(**user_dict)


# --- Login korisnika ---
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_col.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Neispravni kredencijali")

    # Token uključuje rolu iz baze (user ili admin)
    token = create_access_token(
        {"sub": str(user["_id"]), "role": user.get("role", Role.user.value)},
        expires_delta=timedelta(minutes=EXPIRE_MINUTES),
    )

    return {"access_token": token, "token_type": "bearer"}


# --- Dohvatanje trenutnog korisnika ---
@router.get("/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user["_id"] = str(current_user["_id"])
    return UserPublic(**current_user)


# --- Login organizacije ---
@router.post("/org/login")
async def login_org(org_login: OrganisationLogin):
    org = await organisations_col.find_one({"email": org_login.email})
    if not org:
        raise HTTPException(status_code=401, detail="Neispravni podaci")

    stored_pw = org["password"]
    if isinstance(stored_pw, str):
        stored_pw = stored_pw.encode()

    is_valid = bcrypt.checkpw(org_login.password.encode(), stored_pw)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Neispravni podaci")

    if org["status"] != "approved":
        raise HTTPException(status_code=403, detail="Organizacija nije odobrena od strane administratora")

    # Token za organizaciju sadrži rolu iz OrganisationRole enuma
    token = create_access_token(
        data={
            "sub": org["email"],
            "role": OrganisationRole.organisation.value  # "organisation"
        },
        expires_delta=timedelta(minutes=EXPIRE_MINUTES),
    )

    return {"access_token": token, "token_type": "bearer"}
