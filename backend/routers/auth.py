from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from bson import ObjectId

from database import users_col
from models import UserIn, UserDB
from auth.auth_utils import hash_password, verify_password
from auth.jwt_handler import create_access_token, EXPIRE_MINUTES
from auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


# Registracija
@router.post("/register", response_model=UserDB)
async def register(user: UserIn):
    existing = await users_col.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email već postoji")

    user_dict = user.dict()
    user_dict["password"] = hash_password(user.password)

    result = await users_col.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    return UserDB(**user_dict)


# Login
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


# Trenutni korisnik
@router.get("/me", response_model=UserDB)
async def get_me(current_user: UserDB = Depends(get_current_user)):
    return current_user
