import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "diplomski_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[MONGO_DB]

# Kolekcije
users_col = db["users"]
organisations_col = db["organisations"]
events_col = db["events"]
applications_col = db["applications"]
reviews_col = db["reviews"]
notifications_col =db["notifications"]
