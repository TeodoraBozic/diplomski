from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class NotificationIn(BaseModel):
    organisation_id: str
    message: str


class NotificationDB(NotificationIn):
    id: str = Field(..., alias="_id")
    created_at: datetime
    is_read: bool
