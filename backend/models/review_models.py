# models/review_models.py

import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from .user_models import PyObjectId


# ---- Rating enum ----
class ReviewRating(int, Enum):
    one = 1
    two = 2
    three = 3
    four = 4
    five = 5


# ===============================
# USER → ORG REVIEW  (input)
# ===============================

class ReviewUserToOrgIn(BaseModel):
    rating: ReviewRating
    comment: Optional[str] = Field(None, max_length=500)


# ===============================
# USER → ORG REVIEW  (DB/public)
# ===============================

class ReviewUserToOrgDB(BaseModel):
    id: PyObjectId = Field(alias="_id")
    event_id: PyObjectId
    user_id: PyObjectId
    organisation_id: PyObjectId
    rating: ReviewRating
    comment: Optional[str]
    created_at: datetime.datetime


# ===============================
# ORG → USER REVIEW (input)
# ===============================

class ReviewOrgToUserIn(BaseModel):
    rating: ReviewRating
    comment: Optional[str] = Field(None, max_length=500)


# ===============================
# ORG → USER REVIEW (DB/public)
# ===============================

class ReviewOrgToUserDB(BaseModel):
    id: PyObjectId = Field(alias="_id")
    event_id: PyObjectId
    user_id: PyObjectId
    organisation_id: PyObjectId
    rating: ReviewRating
    comment: Optional[str]
    created_at: datetime.datetime


class PublicReview(BaseModel):
    event_name: str
    user_name: str
    organisation_name: str
    rating: ReviewRating
    comment: Optional[str]
    #created_at: datetime.datetime
