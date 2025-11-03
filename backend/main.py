from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

from routers import auth, users

# Učitaj .env
load_dotenv()

# FastAPI app
app = FastAPI(title="Diplomski Backend")

# --- CORS Middleware ---
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # ko sme da pristupi
    allow_credentials=True,
    allow_methods=["*"],            # dozvoli sve metode (GET, POST, PUT, DELETE...)
    allow_headers=["*"],            # dozvoli sve headere
)

# --- Mongo konekcija ---
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "diplomski_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client[MONGO_DB]

# --- Routes ---
@app.get("/")
async def root():
    return {"message": "Dobrodošao na diplomski backend 🚀"}

app.include_router(users.router)
app.include_router(auth.router)

@app.get("/health") 
async def health_check():
    try:
        await db.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}
    
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

