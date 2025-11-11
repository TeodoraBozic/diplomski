import datetime
from typing import Annotated, Optional
from enum import Enum

from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from .user_models import PyObjectId


#status apliciranja
class ApplicationStatus(str, Enum):
    pending = "pending"      # korisnik se prijavio, čeka odluku organizatora
    accepted = "accepted"    # organizator prihvatio
    rejected = "rejected"    # organizator odbio
    cancelled = "cancelled"  # korisnik povukao prijavu


#kreiranje prijave
class ApplicationIn(BaseModel):
    event_id: PyObjectId  # na koji event se prijavljuje

    motivation: Annotated[str, Field(min_length=10, max_length=500)]  # mini motivaciono pismo
    phone: Annotated[str, Field(min_length=6, max_length=20)]         # kontakt telefon
    extra_notes: Optional[str] = None                                 # dodatne napomene (opciono)


#javni prikaz prijave za organizatora
class ApplicationPublic(BaseModel):
    id: Annotated[PyObjectId, Field(alias="_id")]
    event_id: str
    user_id: str
    motivation: str
    phone: str
    extra_notes: Optional[str] = None
    status: ApplicationStatus
    created_at: datetime.datetime


#cuvanje apliciranja u bazi
class ApplicationDB(ApplicationIn):
    id: Annotated[PyObjectId, Field(alias="_id")]
    status: ApplicationStatus = ApplicationStatus.pending
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: Optional[datetime.datetime] = None
    user_id: PyObjectId   # ko se prijavljuje
    
    
    user_info: dict  # {"name": "...", "email": "...", "username": "..."}
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


#organizator upravlja statusom prijave
class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None  # accepted / rejected
    extra_notes: Optional[str] = None           # organizator može da doda komentar
