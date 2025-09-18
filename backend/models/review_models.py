import datetime
from typing import Annotated, Optional
from enum import Enum

from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from .user_models import PyObjectId


#ovo je samo za ocene cisto da imamo
class ReviewRating(int, Enum):
    one = 1
    two = 2
    three = 3
    four = 4
    five = 5


#ko koga ocenjuje? bitno treba nam!
class ReviewDirection(str, Enum):
    org_to_user = "org_to_user"   # organizacija ocenjuje korisnika
    user_to_org = "user_to_org"   # korisnik ocenjuje organizaciju


#create review
class ReviewIn(BaseModel):
    event_id: PyObjectId
    user_id: PyObjectId
    organisation_id: PyObjectId
    direction: ReviewDirection     # ko ocenjuje koga
    rating: ReviewRating
    comment: Optional[str] = Field(None, max_length=500)


# --- Javni prikaz review-a ---
class ReviewPublic(BaseModel):
    id: Annotated[PyObjectId, Field(alias="_id")]
    event_id: str
    user_id: str
    organisation_id: str
    direction: ReviewDirection
    rating: int
    comment: Optional[str] = None
    created_at: datetime.datetime


#cuvanje revieow-a u bazi
class ReviewDB(ReviewIn):
    id: Annotated[PyObjectId, Field(alias="_id")]
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


#update review
class ReviewUpdate(BaseModel):
    rating: Optional[ReviewRating] = None
    comment: Optional[str] = Field(None, max_length=500)
