import datetime
from typing import Annotated, Optional
from enum import Enum

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from .user_models import PyObjectId  # koristimo isti helper


#admin
class OrganisationStatus(str, Enum):
    pending = "pending"     # tek registrovana, čeka verifikaciju
    approved = "approved"   # admin odobrio
    rejected = "rejected"   # admin odbio


#formalne i neformalne org
class OrganisationType(str, Enum):
    official = "official"   # registrovane NVO, udruženja, klubovi
    informal = "informal"   # studentske grupe, timovi, inicijative


#samo 1 role ima
class OrganisationRole(str, Enum):
    organisation = "organisation"


#klasa za registraciju
class OrganisationIn(BaseModel):
    username: Annotated[
        str,
        Field(
            min_length=3,
            max_length=30,
            pattern=r"^[a-z0-9_-]{3,30}$",
            description="Može sadržati mala slova, brojeve, donju crtu i crticu, bez razmaka."
        )
    ]
    name: Annotated[str, Field(min_length=3, max_length=100)]
    email: EmailStr
    password: Annotated[str, Field(min_length=6, max_length=30)]  # u bazi će biti hash
    description: Annotated[str, Field(max_length=300)]
    location: str
    phone: Optional[str] = None
    website: Optional[str] = None
    org_type: OrganisationType = OrganisationType.official  # default zvanična


#klasa za prikaz organizacije na profilu
class OrganisationPublic(BaseModel):
    username:str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    status: OrganisationStatus = OrganisationStatus.pending
    logo: Optional[str] = None
    org_type: OrganisationType = OrganisationType.official


#login
class OrganisationLogin(BaseModel):
    email: EmailStr
    password: str


#klasa za cuvanje u bazu
class OrganisationDB(OrganisationIn):
    id: Annotated[PyObjectId, Field(alias="_id")]
    role: OrganisationRole = OrganisationRole.organisation
    status: OrganisationStatus = OrganisationStatus.pending
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: Optional[datetime.datetime] = None
    logo: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


#update klasa = sve opciono
class OrganisationUpdate(BaseModel):
    username: Optional[str] = Field(
        None,
        min_length=3,
        max_length=30,
        pattern=r"^[a-z0-9_-]{3,30}$"
    )
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=30)
    description: Optional[str] = Field(None, max_length=300)
    location: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    status: Optional[OrganisationStatus] = None  # menja samo admin
    org_type: Optional[OrganisationType] = None
