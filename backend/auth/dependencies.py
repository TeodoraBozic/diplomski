from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from jose import JWTError, jwt

from database.connection import users_col
from models.user_models import Role, UserDB
from auth.jwt_handler import ALGORITHM, SECRET_KEY, decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

oauth2_org_scheme = OAuth2PasswordBearer(tokenUrl="auth/organisations/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserDB:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise credentials_exception

    # Konvertuj ObjectId u string
    user["_id"] = str(user["_id"])
    return UserDB(**user)


#ovo pravimo da proverimo da li je korisnik admin = trebace nam za odredjene endpointe
async def admin_required(current_user: UserDB = Depends(get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(
            403,
            detail="Samo admin ima pristup ovoj akciji."
        )
    return current_user


async def get_current_org(token: str = Depends(oauth2_org_scheme)):
    payload = decode_access_token(token)
    if payload.get("role") != "organisation":
        raise HTTPException(
            403,
            detail="Samo organizacije imaju pristup ovoj ruti."
        )
    return payload