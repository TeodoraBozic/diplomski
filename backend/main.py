from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from fastapi.openapi.utils import get_openapi

from routers import (
    auth,
    admin_routes,
    org_routes,
    public_org_routes,
    public_user_routes,
    user_routes,
    public_event_routes,
    
)


# Učitaj .env
load_dotenv()

# FastAPI app
app = FastAPI(title="Diplomski Backend",debug=True)


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


app.include_router(auth.router)
app.include_router(admin_routes.router)
app.include_router(org_routes.router)
app.include_router(user_routes.router)
app.include_router(public_user_routes.router)
app.include_router(public_org_routes.router)
app.include_router(public_event_routes.router)


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

    # 🔐 Definicije tokena
    openapi_schema["components"]["securitySchemes"] = {
        "UserAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "🔐 Login za korisnike (/auth/login)\nUnesite token u formatu: **Bearer eyJ...**",
        },
        "OrgAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "🏢 Login za organizacije (/auth/org/login)\nUnesite token u formatu: **Bearer eyJ...**",
        },
        "AdminAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "👑 Login za admina (/auth/login)\nUnesite token u formatu: **Bearer eyJ...**",
        },
    }

    # 💡 Eksplicitno mapiranje po tagovima
    tag_security_map = {
        "Admin": "AdminAuth",
        "User": "UserAuth",
        "Organisation": "OrgAuth",
        # Public i Auth su javni, pa ih ne stavljamo
    }

    # 🔎 Primeni mapu na svaki path
    for path in openapi_schema["paths"].values():
        for method in path.values():
            tags = method.get("tags", [])
            if not tags:
                continue

            tag = tags[0]  # svaki endpoint ima bar jedan tag
            if tag in tag_security_map:
                method["security"] = [{tag_security_map[tag]: []}]
            elif tag in ["Public", "Auth"]:
                method.pop("security", None)  # javne rute
            else:
                # fallback ako se pojavi novi tag bez pravila
                method["security"] = [{"UserAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

