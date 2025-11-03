from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from bson import ObjectId

from database.connection import users_col
from models.user_models import UserIn, UserDB, UserPublic
from auth.auth_utils import hash_password, verify_password
from auth.jwt_handler import create_access_token, EXPIRE_MINUTES
from auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


# --- Registracija ---
@router.post("/register", response_model=UserPublic)
async def register(user: UserIn):
    if await users_col.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email već postoji")
    
    if await users_col.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Korisnički username je zauzet! Pokušajte ponovo")

    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["role"] = "user"

    result = await users_col.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)

    # šaljemo nazad UserPublic (bez passworda)
    return UserPublic(**user_dict)


# --- Login ---
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_col.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Neispravni kredencijali")

    token = create_access_token(
        {"sub": str(user["_id"]), "role": user.get("role", "user")},
        expires_delta=timedelta(minutes=EXPIRE_MINUTES),
    )

    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)):
    # ručno konvertujemo _id → string
    current_user["_id"] = str(current_user["_id"])
    # i napravimo public model bez passworda
    return UserPublic(**current_user)