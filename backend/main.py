import os
import time
from datetime import datetime, timedelta
from typing import List, Optional

import bcrypt as py_bcrypt
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    HTTPException,
    Query,
    Depends,
    Request,
    Header,
    UploadFile,
    File,
    Body,
    Path,
    APIRouter,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import shutil

from db import db
from recommendation import recommend
from sentence_transformers import SentenceTransformer

# -----------------------------
# CONFIGURATION
# -----------------------------
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

embedding_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")
LOGO_FOLDER = "../frontend/public/logos"

admin_token_blacklist = set()

# -----------------------------
# APP INIT
# -----------------------------
app = FastAPI(
    title="UniFinder API",
    description="API for UniFinder, providing program recommendations and data.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# UTILS
# -----------------------------
def serialize_doc(doc, remove_sensitive=True):
    doc = dict(doc)
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    if remove_sensitive and "password" in doc:
        doc.pop("password")
    return doc


def generate_vector(text: str):
    if not text:
        return []
    return embedding_model.encode(text).tolist()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_admin_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "admin": True})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_collection_by_type(program_type: str = "all_programs"):
    return (
        db["program_vectors"]
        if program_type == "program_vectors"
        else db["all_programs"]
    )


def log_activity(event: str, details: str, user: str = "System"):
    db["activities"].insert_one(
        {
            "event": event,
            "details": details,
            "user": user,
            "timestamp": datetime.utcnow(),
        }
    )


# -----------------------------
# AUTHENTICATION
# -----------------------------
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db["users"].find_one({"email": email, "deleted_at": None})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user_optional(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        return None
    try:
        token = token.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"email": payload.get("sub")}
    except JWTError:
        return None


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token in admin_token_blacklist:
        raise HTTPException(status_code=401, detail="Token blacklisted")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not payload.get("admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        email = payload.get("sub")
        admin = db["admin_users"].find_one({"email": email})
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        return admin
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid admin token")


# -----------------------------
# MIDDLEWARE
# -----------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response


# -----------------------------
# PUBLIC ROUTES
# -----------------------------
@app.get("/programs/all", summary="Get all programs")
async def get_all_programs():
    programs = list(db["all_programs"].find({}, {"_id": 0}))
    return JSONResponse(content=programs)


@app.get("/history-log", summary="Get user's account info and activity history")
async def get_history_log(current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]

        # Fetch account info
        user_data = db["users"].find_one(
            {"email": email, "deleted_at": None},
            {"_id": 0, "email": 1, "full_name": 1, "created_at": 1},
        )

        # Fetch user logs (login/logout)
        logs = list(
            db["user_logs"]
            .find({"email": email}, {"_id": 0, "action": 1, "timestamp": 1})
            .sort("timestamp", -1)
        )

        return {"user": user_data, "logs": logs}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history log: {e}")


@app.get("/previous-results", summary="Get previous recommendation results")
async def get_previous_results(
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """
    Returns the list of previous recommendation results for a user.
    Guests receive an empty list.
    """
    try:
        # 🧩 Handle guest users safely
        if not current_user:
            return JSONResponse(status_code=status.HTTP_200_OK, content={"results": []})

        # 🧠 Fetch results for the logged-in user
        results = list(
            db["user_recommendations"]
            .find({"user_email": current_user["email"]}, {"_id": 0})
            .sort("created_at", -1)
        )

        print(results)

        # 🕒 Convert datetime objects to ISO strings
        for r in results:
            if "created_at" in r:
                r["created_at"] = r["created_at"].isoformat()

        # ✅ Always return JSON
        return JSONResponse(
            status_code=status.HTTP_200_OK, content={"results": results}
        )

    except Exception as e:
        print(f"❌ Error fetching previous results: {e}")
        # Return valid JSON on server errors too
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Failed to fetch previous results"},
        )


@app.get("/api/school-strengths", summary="Get school strengths data")
async def get_school_strengths():
    try:
        collection = db["school_strengths"]
        docs = list(collection.find({}, {"_id": 0}))
        return JSONResponse(content={"schools": docs})
    except Exception as e:
        print(f"Error fetching school_strengths: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error while fetching school strengths: {e}",
        )


@app.post("/search", summary="Get program recommendations")
async def search(
    request_data: dict,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    user_email = current_user["email"] if current_user else "guest"
    start_time = time.time()

    result = recommend(
        answers=request_data.get("answers", {}),
        user_grades=request_data.get("grades"),
        school_type=request_data.get("school_type", "any"),
        locations=request_data.get("locations"),
        max_budget=request_data.get("max_budget"),
    )

    elapsed_time = time.time() - start_time
    print(f"⏱️ Time taken: {elapsed_time:.2f} sec")

    if current_user:
        db["user_recommendations"].insert_one(
            {
                "user_email": user_email,
                "answers": request_data.get("answers"),
                "grades": request_data.get("grades"),
                "filters": {
                    "school_type": request_data.get("school_type", "any"),
                    "locations": request_data.get("locations"),
                    "max_budget": request_data.get("max_budget"),
                },
                "result_type": result.get("type"),
                "results": result.get("results", []),
                "weak_matches": result.get("weak_matches", []),
                "matched_category": result.get("matched_category"),
                "top_schools_for_category": result.get("top_schools_for_category", []),
                "created_at": datetime.utcnow(),
            }
        )
        log_activity("Search", f"User {user_email} performed a search", user_email)

    return result


@app.post("/register", summary="Register a new user")
async def register_user(request: dict):
    email = request.get("email")
    password = request.get("password")
    full_name = request.get("full_name")
    if not email or not password or not full_name:
        raise HTTPException(status_code=400, detail="All fields are required")

    existing_user = db["users"].find_one({"email": email, "deleted_at": None})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = py_bcrypt.hashpw(password.encode("utf-8")[:72], py_bcrypt.gensalt())
    user = {
        "email": email,
        "full_name": full_name,
        "password": hashed.decode("utf-8"),
        "created_at": datetime.utcnow(),
        "deleted_at": None,
        "last_login": None,
    }
    db["users"].insert_one(user)

    access_token = create_access_token({"sub": email})
    log_activity("User Registration", f"User {email} registered", email)

    return {"access_token": access_token, "token_type": "bearer", "email": email}


@app.post("/login", summary="Login user and get token")
async def login_user(credentials: dict):
    email = credentials.get("email")
    password = credentials.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    user = db["users"].find_one({"email": email, "deleted_at": None})
    if not user or not py_bcrypt.checkpw(
        password.encode("utf-8"), user["password"].encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    db["users"].update_one(
        {"email": email}, {"$set": {"last_login": datetime.utcnow()}}
    )
    log_activity("User Login", f"User {email} logged in", email)

    access_token = create_access_token({"sub": email})

    # Return the user (serialized without password) so frontend can save it
    user_safe = serialize_doc(user, remove_sensitive=True)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_safe,
        "email": email,
    }


@app.delete("/delete-account", summary="Delete logged-in user account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    db["users"].update_one(
        {"_id": current_user["_id"]}, {"$set": {"deleted_at": datetime.utcnow()}}
    )
    result = db["user_recommendations"].delete_many(
        {"user_email": current_user["email"]}
    )
    log_activity(
        "User Deleted",
        f"User {current_user['email']} deleted their account",
        current_user["email"],
    )
    return {
        "message": "Account deleted",
        "deleted_recommendations": result.deleted_count,
    }


@app.post("/logout", summary="Log out user")
async def logout_user(request: Request, current_user: dict = Depends(get_current_user)):
    log_activity(
        "User Logout", f"User {current_user['email']} logged out", current_user["email"]
    )
    return {"message": "Logged out successfully"}


# -----------------------------
# ADMIN ROUTES
# -----------------------------
@app.post("/admin/login")
async def admin_login(credentials: dict):
    email = credentials.get("email")
    password = credentials.get("password")
    admin = db["admin_users"].find_one({"email": email})
    if not admin or not pwd_context.verify(password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    log_activity("Admin Login", f"Admin {email} logged in", email)
    token = create_admin_token({"sub": email, "admin": True})
    return {
        "access_token": token,
        "admin": {"email": email, "full_name": admin["full_name"]},
    }


@app.post("/admin/logout")
async def admin_logout(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    admin_token_blacklist.add(token)
    log_activity("Admin Logout", f"Admin token blacklisted", "System")
    return {"message": "Admin logged out successfully"}


@app.get("/admin/users")
async def admin_get_users(current_admin: dict = Depends(get_current_admin)):
    users = list(db["users"].find({"deleted_at": None}))
    return [serialize_doc(u) for u in users]


@app.delete("/admin/users/{user_id}")
async def admin_delete_user(
    user_id: str = Path(...), current_admin: dict = Depends(get_current_admin)
):
    try:
        oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    user = db["users"].find_one({"_id": oid, "deleted_at": None})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db["users"].update_one({"_id": oid}, {"$set": {"deleted_at": datetime.utcnow()}})
    deleted_recs = db["user_recommendations"].delete_many({"user_email": user["email"]})
    log_activity(
        "User Deleted", f"Admin deleted user {user['email']}", current_admin["email"]
    )
    return {
        "status": "success",
        "deleted_user_id": user_id,
        "deleted_recommendations_count": deleted_recs.deleted_count,
    }


@app.get("/admin/activities")
async def get_activities(
    limit: Optional[int] = None, current_admin: dict = Depends(get_current_admin)
):
    query = db["activities"].find().sort("timestamp", -1)

    if limit is not None:
        query = query.limit(limit)

    activities = list(query)
    print("Fetched activities:", activities, flush=True)

    return [serialize_doc(a, remove_sensitive=False) for a in activities]


# -----------------------------
# ADMIN PROGRAM CRUD
# -----------------------------
@app.get("/admin/{program_type}")
async def admin_get_programs(
    program_type: str, current_admin: dict = Depends(get_current_admin)
):
    collection = get_collection_by_type(program_type)
    return [serialize_doc(p) for p in collection.find()]


@app.post("/admin/{program_type}")
async def admin_create_program(
    program_type: str,
    program: dict = Body(...),
    current_admin: dict = Depends(get_current_admin),
):
    collection = get_collection_by_type(program_type)
    if program_type == "program_vectors" and "description" in program:
        program["vector"] = generate_vector(program["description"])
    program["created_at"] = program["updated_at"] = datetime.utcnow()
    result = collection.insert_one(program)
    program["id"] = str(result.inserted_id)
    program.pop("_id", None)
    log_activity(
        "Program Created",
        f"Program '{program.get('name')}' added",
        current_admin["email"],
    )
    return program


@app.put("/admin/{program_type}/{program_id}")
async def admin_update_program(
    program_type: str,
    program_id: str,
    updates: dict = Body(...),
    current_admin: dict = Depends(get_current_admin),
):
    collection = get_collection_by_type(program_type)
    try:
        oid = ObjectId(program_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid program ID")
    existing = collection.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Program not found")
    if updates.get("description") and updates["description"] != existing.get(
        "description"
    ):
        updates["vector"] = generate_vector(updates["description"])
    updates["updated_at"] = datetime.utcnow()
    collection.update_one({"_id": oid}, {"$set": updates})
    updated = serialize_doc(collection.find_one({"_id": oid}))
    log_activity(
        "Program Updated",
        f"Program '{updated.get('name')}' updated",
        current_admin["email"],
    )
    return updated


@app.delete("/admin/{program_type}/{program_id}")
async def admin_delete_program(
    program_type: str, program_id: str, current_admin: dict = Depends(get_current_admin)
):
    collection = get_collection_by_type(program_type)
    try:
        oid = ObjectId(program_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid program ID")
    program = collection.find_one({"_id": oid})
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    collection.delete_one({"_id": oid})
    log_activity(
        "Program Deleted",
        f"Program '{program.get('name')}' deleted",
        current_admin["email"],
    )
    return {"status": "success"}
