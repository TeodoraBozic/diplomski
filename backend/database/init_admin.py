import bcrypt
from database.connection import users_col
from models.user_models import Role
import asyncio


#napravila sam skriptu koja kreira admina ukoliko admin ne postoji!
async def init_admin():
    existing_admin = await users_col.find_one({"role": Role.admin})
    if existing_admin:
        print("Admin već postoji.")
        return

    password_hash = bcrypt.hashpw("Admin123!".encode(), bcrypt.gensalt()).decode()
    admin_data = {
        "username": "admin",
        "email": "admin@gmail.com",
        "password": password_hash,
        "title": "System Administrator",
        "location": "Beograd",
        "age": 30,
        "about": "Admin nalog za verifikaciju organizacija.",
        "skills": [],
        "experience": "",
        "role": Role.admin,
    }

    await users_col.insert_one(admin_data)
    print("Kreiran admin nalog: admin@gmail.com / Admin123!")

if __name__ == "__main__":
    asyncio.run(init_admin())
