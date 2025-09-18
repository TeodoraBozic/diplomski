import datetime
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, ConfigDict, GetCoreSchemaHandler
from typing import Annotated, List, Optional
from bson import ObjectId
from pydantic_core import core_schema



#ova klasa nam omogucava da objectid (koji mongo koristi) koristimo kao string 
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler: GetCoreSchemaHandler):
        # Kada Pydantic validira ObjectId, koristi ovaj schema
        return core_schema.no_info_after_validator_function(
            cls.validate, core_schema.str_schema()
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)  # konvertuj u string
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")

class Role(str, Enum):
    user = "user"
    admin = "admin"
    

class UserIn(BaseModel):  
    username: Annotated[str, Field(min_length=3, max_length=30)]
    email:EmailStr #na frontu neka bude validacija
    password: Annotated[str, Field(min_length=6, max_length=30)] #ovo ce u bazi da bude hesirano
    title: str #student, diplomirani pravnik, ucenik
    location: str #Nis, Beograd...
    age: Annotated[int, Field(ge=16)] 
    about: Annotated[str, Field(max_length=160)] #neki kratak opis, twitter ima 160 karaktera maks pa zato tako
    #u applicaton neka ide broj telefona
    skills: List[str] = Field(default_factory=list) #neki skillovi
    experience: Optional[Annotated[str, Field(max_length=300)]] = None #personalizovani deo kao u cv, a u application ce da bude timeline expirience
    #ako application bude accepted/completed 
    
class UserPublic(BaseModel):
    username: str
    title: Optional[str] = None
    location: Optional[str] = None
    age: Optional[int] = None
    about: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience: Optional[str] = None
    profile_image: Optional[str] = None
     
    
class UserLogin(BaseModel):
    email: str
    password: str
    
    

class UserDB(UserIn):
    id: Annotated[PyObjectId, Field(alias="_id")]
    role: Role = Role.user
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: Optional[datetime.datetime] = None
    profile_image: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=30)
    title: Optional[str] = None
    location: Optional[str] = None
    age: Optional[int] = Field(None, ge=16)
    about: Optional[str] = Field(None, max_length=160)
    skills: Optional[List[str]] = None
    experience: Optional[str] = Field(None, max_length=300)