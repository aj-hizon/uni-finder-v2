import os
import psutil
import time
import bcrypt as py_bcrypt
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv


from db import db
from recommendation import recommend

# --- Auth Setup ---
security = HTTPBearer()
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
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

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# --- Request Models ---
class SearchRequest(BaseModel):
    answers: dict
    grades: Optional[dict] = None  # ✅ NEW: user’s grades
    school_type: str = "any"
    locations: Optional[List[str]] = None
    max_budget: Optional[float] = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


# --- Optional Authentication ---
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
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    
    user_email = current_user["email"] if current_user else "guest"
    print(user_email)

    # Start timer for reference (optional)
    start_time = time.time()

    # Call recommendation logic
    result = recommend(
        answers=request_data.answers,
        user_grades=request_data.grades,
        school_type=request_data.school_type,
        locations=request_data.locations,
        max_budget=request_data.max_budget,
    )

    elapsed_time = time.time() - start_time
    print(f"⏱️ Time taken: {elapsed_time:.2f} sec")

    # Save history for logged-in users
    if current_user:
        db["user_recommendations"].insert_one(
            {
                "user_email": user_email,
                "answers": request_data.answers,
                "grades": request_data.grades,
                "subjects": (
                    list(request_data.grades.keys()) if request_data.grades else []
                ),
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
            }
        )

    return result


@app.get("/recommendation-history", summary="Get user's recommendation history")
async def get_recommendation_history(current_user: dict = Depends(get_current_user)):
    try:
        print(f"Fetching recommendation history for user: {current_user['email']}")

        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get raw data from MongoDB
        raw_data = list(
            db["user_recommendations"]
            .find(
                {"user_email": current_user["email"]},
                {
                    "_id": 0,
                    "user_email": 1,
                    "answers": 1,
                    "grades": 1,
                    "filters": 1,
                    "results": 1,
                    "created_at": 1,
                },
            )
            .sort("created_at", -1)
        )

        # Convert datetime objects to ISO format strings
        data = []
        for record in raw_data:
            if "created_at" in record:
                record["created_at"] = record["created_at"].isoformat()
            data.append(record)

        print(f"Found {len(data)} recommendations for user: {current_user['email']}")

        if not data:
            return {"message": "No recommendation history found", "data": []}

        return JSONResponse(
            content={
                "message": "Recommendation history retrieved successfully",
                "count": len(data),
                "data": data,
            }
        )

    except Exception as e:
        print(f"Error fetching recommendation history: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch recommendation history: {str(e)}"
        )


@app.get(
    "/programs/from-file", summary="Get program vectors (deprecated or specific use)"
)
async def get_programs_from_file():
    try:
        collection = db["program_vectors"]
        data = list(collection.find({}, {"_id": 0}))
        return JSONResponse(content=data)
    except Exception as e:
        print(f"Error fetching program vectors from file: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching program vectors.",
        )


@app.get("/api/school-strengths", summary="Get school strengths data")
async def get_school_strengths():
    try:
        collection = db["school_strengths"]
        docs = list(collection.find({}, {"_id": 0}))
        return JSONResponse(content={"schools": docs})
    except Exception as e:
        print(f"❌ Error fetching school_strengths: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error while fetching school strengths: {e}",
        )


@app.get("/school-rankings", summary="Get school rankings data")
async def get_school_rankings():
    try:
        collection = db["school_rankings"]
        doc = collection.find_one({}, {"_id": 0})
        return JSONResponse(content=doc if doc else {}, status_code=200)
    except Exception as e:
        print(f"❌ Error fetching school_rankings: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error while fetching school rankings: {e}",
        )


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
        raise HTTPException(
            status_code=500, detail=f"Database error during program search: {e}"
        )


@app.post("/register", summary="Register a new user")
async def register_user(request: RegisterRequest):
    try:
        email = request.email
        password = request.password
        full_name = request.full_name

        if not email or not password or not full_name:
            raise HTTPException(status_code=400, detail="All fields are required")

        # Check if user already exists
        existing_user = db["users"].find_one({"email": email, "deleted_at": None})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash password
        salt = py_bcrypt.gensalt()
        encoded_password = password.encode("utf-8")[:72]
        hashed_password = py_bcrypt.hashpw(encoded_password, salt)

        # Create user document
        user = {
            "email": email,
            "full_name": full_name,
            "password": hashed_password.decode("utf-8"),
            "created_at": datetime.utcnow(),
            "deleted_at": None,
            "last_login": None,
        }

        print("User inserted:", user)

        db["users"].insert_one(user)

        # Generate access token
        access_token = create_access_token(data={"sub": email})

        # Log registration
        db["user_logs"].insert_one(
            {"email": email, "action": "register", "timestamp": datetime.utcnow()}
        )

        return {"access_token": access_token, "token_type": "bearer", "email": email}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@app.post("/login", summary="Login user and get token")
async def login_user(credentials: dict):
    try:
        email = credentials.get("email")
        password = credentials.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")

        user = db["users"].find_one({"email": email, "deleted_at": None})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Verify password using bcrypt
        if not py_bcrypt.checkpw(
            password.encode("utf-8"), user["password"].encode("utf-8")
        ):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Update last login
        db["users"].update_one(
            {"email": email}, {"$set": {"last_login": datetime.utcnow()}}
        )

        # Log the login
        db["user_logs"].insert_one(
            {"email": email, "action": "login", "timestamp": datetime.utcnow()}
        )

        access_token = create_access_token(data={"sub": email})
        return {"access_token": access_token, "token_type": "bearer", "email": email}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


@app.delete(
    "/delete-account",
    summary="Delete the logged-in user account and past recommendations",
)
async def delete_account(current_user: dict = Depends(get_current_user)):
    try:
        db["users"].update_one(
            {"_id": current_user["_id"]}, {"$set": {"deleted_at": datetime.utcnow()}}
        )

        result = db["user_recommendations"].delete_many(
            {"user_email": current_user["email"]}
        )

        return {
            "message": "Account deleted successfully.",
            "deleted_recommendations": result.deleted_count,
        }

    except Exception as e:
        print(f"Error deleting account: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete account")


@app.post("/logout", summary="Log the user out")
async def logout_user(request: Request, current_user: dict = Depends(get_current_user)):
    try:
        # Get client IP and user agent for security logging
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "Unknown")

        # Log the logout attempt
        db["user_logs"].insert_one(
            {
                "email": current_user["email"],
                "action": "logout",
                "timestamp": datetime.utcnow(),
                "ip_address": client_ip,
                "user_agent": user_agent,
                "status": "success",
            }
        )

        # Optional: Invalidate token here if you implement token blacklisting

        return JSONResponse(
            status_code=200, content={"message": "Logged out successfully"}
        )

    except Exception as e:
        # Log the error
        db["user_logs"].insert_one(
            {
                "email": current_user["email"],
                "action": "logout",
                "timestamp": datetime.utcnow(),
                "status": "failed",
                "error": str(e),
            }
        )
        raise HTTPException(status_code=500, detail="Logout failed. Please try again.")


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


@app.delete("/clear-history", summary="Clear all login/logout history for current user")
async def clear_history(current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]
        result = db["user_logs"].delete_many({"email": email})
        return {"message": f"Successfully cleared {result.deleted_count} log(s)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {e}")


# --- Previous Results Endpoints ---

from fastapi.responses import JSONResponse


from fastapi.responses import JSONResponse
from fastapi import status, HTTPException


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


@app.delete("/clear-results", summary="Clear all previous recommendation results")
async def clear_results(current_user: dict = Depends(get_current_user)):
    """
    Deletes all recommendation results for the logged-in user.
    """
    try:
        result = db["user_recommendations"].delete_many(
            {"user_email": current_user["email"]}
        )
        return {"message": f"Deleted {result.deleted_count} previous results"}
    except Exception as e:
        print(f"Error clearing results: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear previous results")
