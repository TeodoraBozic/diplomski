from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from fastapi.openapi.utils import get_openapi

from routers import auth, events, organisations, users

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
app.include_router(organisations.router)
app.include_router(events.router)

@app.get("/health") 
async def health_check():
    try:
        await db.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}
    
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Diplomski API",
        version="1.0.0",
        description="API sa posebnim loginima za korisnike i organizacije",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"]["UserAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "🔐 Login za korisnike (/auth/login)\nUnesite token u formatu: **Bearer eyJ...**"
    }

    openapi_schema["components"]["securitySchemes"]["OrgAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "🏢 Login za organizacije (/auth/org/login)\nUnesite token u formatu: **Bearer eyJ...**"
    }

    # 💡 Poveži rute sa OrgAuth security-jem po imenu taga (npr. Events)
    for path in openapi_schema["paths"].values():
        for method in path.values():
            if "Events" in method.get("tags", []):
                method["security"] = [{"OrgAuth": []}]
            else:
                method["security"] = [{"UserAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
