import os
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.hash import bcrypt
from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Header
from db import db
from recommendation import recommend
from typing import Optional
from bson import ObjectId
from typing import List
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from fastapi import FastAPI, HTTPException, Body
from fastapi import UploadFile, File
import shutil
import os
from sentence_transformers import SentenceTransformer

# Load 768-dimension sentence transformer
embedding_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")



# --- Auth Setup ---
security = HTTPBearer()
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key_here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

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


# --- App Setup ---
app = FastAPI(
    title="UniFinder API",
    description="API for UniFinder, providing program recommendations and data.",
    version="1.0.0",
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

admin_token_blacklist = set()

# Dummy function to decode and verify admin JWT
def decode_admin_token(token: str):
    # Replace with your actual JWT decode logic
    try:
        # Example: decode and verify token
        payload = {"sub": "admin@example.com"}  # Dummy payload
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    
def create_admin_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "exp": expire,
        "admin": True
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("admin") != True:
            raise HTTPException(status_code=403, detail="Admin access required")

        email = payload.get("sub")
        admin = db["admin_users"].find_one({"email": email})

        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")

        return admin

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid admin token")





def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# --- Request Models ---
class SearchRequest(BaseModel):
    answers: dict
    grades: Optional[dict] = None  # ✅ NEW: user’s grades
    school_type: str = "any"
    locations: Optional[List[str]] = None
    max_budget: Optional[float] = None


# --- Optional Authentication ---
async def get_current_user_optional(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        return None
    try:
        token = token.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return {"email": payload.get("sub")}
    except JWTError:
        return None


# --- Routes ---
@app.get("/programs/all", summary="Get all programs")
async def get_all_programs():
    try:
        data = list(db["all_programs"].find({}, {"_id": 0}))
        return JSONResponse(content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching all programs: {e}")


@app.post("/search", summary="Get program recommendations")
async def search(
    request_data: SearchRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    user_email = current_user["email"] if current_user else "guest"
    print(f"📥 Received search request from {user_email}")

    # 🧠 Use grades from request (or possibly user profile in future)
    user_grades = request_data.grades

    # Call recommendation logic
    result = recommend(
        answers=request_data.answers,
        user_grades=user_grades,
        school_type=request_data.school_type,
        locations=request_data.locations,
        max_budget=request_data.max_budget,
    )

    # ✅ Save history for logged-in users (including grades + subjects)
    if current_user:
        db["user_recommendations"].insert_one({
            "user_email": user_email,
            "answers": request_data.answers,
            "grades": request_data.grades,              # ✅ save grades dictionary
            "subjects": list(request_data.grades.keys()) if request_data.grades else [],  # ✅ extract subjects
            "filters": {
                "school_type": request_data.school_type,
                "locations": request_data.locations,
                "max_budget": request_data.max_budget,
            },
            "result_type": result.get("type"),
            "results": result.get("results", []),
            "weak_matches": result.get("weak_matches", []),
            "matched_category": result.get("matched_category"),
            "top_schools_for_category": result.get("top_schools_for_category", []),
            "created_at": datetime.utcnow(),
        })

    return result



@app.get("/recommendation-history")
async def get_recommendation_history(current_user: dict = Depends(get_current_user)):
    data = list(
        db["user_recommendations"].find({"user_email": current_user["email"]}, {"_id": 0})
        .sort("created_at", -1)
    )
    return data



@app.get("/programs/from-file", summary="Get program vectors (deprecated or specific use)")
async def get_programs_from_file():
    try:
        collection = db["program_vectors"]
        data = list(collection.find({}, {"_id": 0}))
        return JSONResponse(content=data)
    except Exception as e:
        print(f"Error fetching program vectors from file: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching program vectors.")


@app.get("/api/school-strengths", summary="Get school strengths data")
async def get_school_strengths():
    try:
        collection = db["school_strengths"]
        docs = list(collection.find({}, {"_id": 0}))
        return JSONResponse(content={"schools": docs})
    except Exception as e:
        print(f"❌ Error fetching school_strengths: {e}")
        raise HTTPException(status_code=500, detail=f"Database error while fetching school strengths: {e}")




@app.get("/school-rankings", summary="Get school rankings data")
async def get_school_rankings():
    try:
        collection = db["school_rankings"]
        doc = collection.find_one({}, {"_id": 0})
        return JSONResponse(content=doc if doc else {}, status_code=200)
    except Exception as e:
        print(f"❌ Error fetching school_rankings: {e}")
        raise HTTPException(status_code=500, detail=f"Database error while fetching school rankings: {e}")


@app.get("/programs/search", summary="Search programs by name, location, or category")
async def search_programs(
    name: Optional[str] = Query(None, max_length=100),
    location: Optional[str] = Query(None, max_length=100),
    category: Optional[str] = Query(None, max_length=100),
):
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}

    try:
        data = list(db["all_programs"].find(query, {"_id": 0}))
        return JSONResponse(content=data)
    except Exception as e:
        print(f"Error searching programs: {e}")
        raise HTTPException(status_code=500, detail=f"Database error during program search: {e}")
    
    
@app.post("/register", summary="Register a new user")
async def register_user(user: dict):
    email = user.get("email")
    password = user.get("password")
    full_name = user.get("full_name")

    # Validate input
    if not all([email, password, full_name]):
        raise HTTPException(status_code=400, detail="All fields are required.")

    # Check if email already exists
    existing = db["users"].find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Hash only the first 72 bytes (bcrypt limitation)
    hashed_pw = bcrypt.hash(password[:72])

    # Insert new user
    db["users"].insert_one({
        "email": email,
        "password": hashed_pw,
        "full_name": full_name,
        "created_at": datetime.utcnow(),
        "deleted_at": None
    })

    return {"message": "Registration successful!"}


@app.post("/login", summary="Login user and get token")
async def login_user(credentials: dict):
    email = credentials.get("email")
    password = credentials.get("password")

    user = db["users"].find_one({"email": email})
    if not user or not bcrypt.verify(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # ✅ Log the login event
    db["user_logs"].insert_one({
        "email": user["email"],
        "action": "login",
        "timestamp": datetime.utcnow()
    })

    access_token = create_access_token(data={"sub": user["email"]})
    return {
        "access_token": access_token,
        "user": {
            "email": user["email"],
            "full_name": user["full_name"]
        }
    }

    
@app.delete("/delete-account", summary="Delete the logged-in user account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$set": {"deleted_at": datetime.utcnow()}}
    )
    return {"message": "Account deleted successfully."}


@app.post("/logout", summary="Log the user out")
async def logout_user(current_user: dict = Depends(get_current_user)):
    db["user_logs"].insert_one({
        "email": current_user["email"],
        "action": "logout",
        "timestamp": datetime.utcnow()
    })
    return {"message": "Logged out successfully."}


@app.get("/history-log", summary="Get user's account info and activity history")
async def get_history_log(current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]

        # Fetch account info
        user_data = db["users"].find_one(
            {"email": email, "deleted_at": None},
            {"_id": 0, "email": 1, "full_name": 1, "created_at": 1}
        )

        # Fetch user logs (login/logout)
        logs = list(
            db["user_logs"]
            .find({"email": email}, {"_id": 0, "action": 1, "timestamp": 1})
            .sort("timestamp", -1)
        )

        return {
            "user": user_data,
            "logs": logs
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history log: {e}")


@app.delete("/clear-history", summary="Clear all login/logout history for current user")
async def clear_history(current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]
        result = db["user_logs"].delete_many({"email": email})
        return {"message": f"Successfully cleared {result.deleted_count} log(s)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {e}")
    
    
    
# ✅ GET - fetch all saved results for logged-in user
@app.get("/previous-results")
async def get_previous_results(current_user=Depends(get_current_user)):
    results = list(
        db["user_recommendations"].find(
            {"user_email": current_user["email"]},
            {"_id": 0}
        )
    )
    return results


# ✅ DELETE - clear all saved results for logged-in user
@app.delete("/clear-results")
async def clear_results(current_user=Depends(get_current_user)):
    db["user_recommendations"].delete_many({"user_email": current_user["email"]})
    return {"message": "Results cleared"}


    
# -----------------------------
# ADMIN LOGIN
# -----------------------------
@app.post("/admin/login")
async def admin_login(credentials: dict):
    email = credentials.get("email")
    password = credentials.get("password")

    admin = db["admin_users"].find_one({"email": email})
    if not admin or not bcrypt.verify(password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    access_token = create_admin_token({"sub": admin["email"]})

    return {
        "access_token": access_token,
        "admin": {
            "email": admin["email"],
            "full_name": admin["full_name"]
        }
    }


# -----------------------------
# ADMIN LOGOUT
# -----------------------------
@app.post("/admin/logout")
async def admin_logout(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]

    try:
        decode_admin_token(token)
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    admin_token_blacklist.add(token)

    return {"message": "Admin logged out successfully"}


# -----------------------------
# HELPER FUNCTIONS
# -----------------------------
def serialize_doc(doc):
    doc = dict(doc)
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc



def generate_vector(text: str):
    if not text:
        return []
    return embedding_model.encode(text).tolist()  # ALWAYS 768 dims


# ---------------------------------------
# GET all programs (without vectors)
# ---------------------------------------
@app.get("/admin/program_vectors")
async def get_all_program_vectors():
    programs = list(db["program_vectors"].find({}, {"vector": 0}))
    return [serialize_doc(p) for p in programs]

# ---------------------------------------
# GET recent programs
# ---------------------------------------
@app.get("/admin/program_vectors/recent")
async def get_recent_programs():
    programs = list(
        db["program_vectors"]
        .find({}, {"vector": 0})
        .sort("updated_at", -1)
        .limit(5)
    )
    return [serialize_doc(p) for p in programs]


# ---------------------------------------
# GET program by ID
# ---------------------------------------
@app.get("/admin/program_vectors/{program_id}")
async def get_program(program_id: str):
    try:
        oid = ObjectId(program_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid program ID")

    program = db["program_vectors"].find_one({"_id": oid}, {"vector": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    return serialize_doc(program)



# ---------------------------------------
# CREATE program (auto-embed)
# ---------------------------------------
@app.post("/admin/program_vectors")
async def create_program(program: dict):
    description = program.get("description", "")

    # 768-dim vector
    program["vector"] = generate_vector(description)

    program["created_at"] = datetime.utcnow()
    program["updated_at"] = datetime.utcnow()

    result = db["program_vectors"].insert_one(program)
    program["id"] = str(result.inserted_id)

    # Remove raw ObjectId for JSON safety
    if "_id" in program:
        del program["_id"]

    return program

# ---------------------------------------
# UPDATE program (auto-embed if changed)
# ---------------------------------------
@app.put("/admin/program_vectors/{program_id}")
async def update_program(program_id: str, updates: dict):
    try:
        oid = ObjectId(program_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid program ID")

    existing = db["program_vectors"].find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Program not found")

    new_description = updates.get("description")

    if new_description and new_description != existing.get("description"):
        updates["vector"] = generate_vector(new_description)

    updates["updated_at"] = datetime.utcnow()

    db["program_vectors"].update_one({"_id": oid}, {"$set": updates})

    updated = db["program_vectors"].find_one({"_id": oid})
    return serialize_doc(updated)


# ---------------------------------------
# DELETE program
# ---------------------------------------
@app.delete("/admin/program_vectors/{program_id}")
async def delete_program(program_id: str):
    try:
        oid = ObjectId(program_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid program ID")

    result = db["program_vectors"].delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")

    return {"status": "success"}

LOGO_FOLDER = "../frontend/public/logos"  # adjust path to your frontend folder

@app.post("/admin/upload_logo")
async def upload_logo(file: UploadFile = File(...)):
    file_location = os.path.join(LOGO_FOLDER, file.filename)
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": file.filename, "url": f"/logos/{file.filename}"}


