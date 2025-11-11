import datetime
from typing import Annotated, Optional, List
from enum import Enum

from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from .user_models import PyObjectId  # isti helper kao kod users/orgs



class EventCategory(str, Enum):
    sportski = "sports"
    kulturni = "cultural"
    biznis = "business"
    ekoloski = "eco"
    festival = "festival"
    koncert = "concert"
    edukacija = "education"
    humanitarni = "charity"
    zajednica = "community"
    ostalo = "other"


#create event
class EventIn(BaseModel):
    title: Annotated[str, Field(min_length=3, max_length=200)] #ime dogadjaja, Nis Business Run.. 
    description: Annotated[str, Field(min_length=10, max_length=2000)] #opis dogadjaja
    start_date: datetime.datetime #datum odrzavanja
    end_date: datetime.datetime  
    location: str #lokacija
    category: EventCategory #enum za tip dogadjaja

    # opcione stvari
    max_volunteers: Optional[int] = None
    image: Optional[str] = None
    tags: List[str] = Field(default_factory=list) #ovo je super za kljucne reci, daje neke kljucne info o eventima


#javni prikaz eventa
class EventPublic(BaseModel):
    #id: Annotated[PyObjectId, Field(alias="_id")]
    title: str
    description: str
    start_date: datetime.datetime
    end_date: datetime.datetime
    location: str
    category: EventCategory
    max_volunteers: Optional[int] = None
    image: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    organisation_name: Optional[str] = None


#cuvanje eventa u bazu
class EventDB(EventIn):
    id: Annotated[PyObjectId, Field(alias="_id")]
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: Optional[datetime.datetime] = None
    organisation_id: PyObjectId

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


#update opcioni parametri:(organizator može da menja sadržaj, admin i status) ---
class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None 
    location: Optional[str] = None
    category: Optional[EventCategory] = None
    max_volunteers: Optional[int] = None
    image: Optional[str] = None
    tags: Optional[List[str]] = None
