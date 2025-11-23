import json
from pymongo import MongoClient
import os
from datetime import datetime
from passlib.hash import bcrypt

# ---------------------------------------
# CONFIG
# ---------------------------------------
MONGO_URI = "mongodb+srv://felixxbuan:QodcG7NvTkttyTUB@cluster0.poimocp.mongodb.net/"
DATABASE_NAME = "unifinder"
JSON_FILE = "admins.json"   # change if needed

# ---------------------------------------
# CONNECTION
# ---------------------------------------
client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]

if not os.path.exists(JSON_FILE):
    print(f"❌ ERROR: File '{JSON_FILE}' not found.")
    exit()

# ---------------------------------------
# LOAD JSON
# ---------------------------------------
try:
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
except json.JSONDecodeError as e:
    print(f"❌ JSON Parse Error: {e}")
    exit()

# ---------------------------------------
# DETERMINE COLLECTION NAME
# e.g. admins.json → admin_users
# ---------------------------------------
filename = os.path.splitext(os.path.basename(JSON_FILE))[0]

# Special case: uploading admins
if filename == "admins":
    collection_name = "admin_users"
else:
    collection_name = filename

collection = db[collection_name]

print(f"📁 Target collection: {collection_name}")

# ---------------------------------------
# PREPARE DOCUMENTS
# ---------------------------------------
documents = []

def prepare_doc(doc):
    """Ensure document is properly formatted before upload."""
    doc.pop("_id", None)

    # Convert password to bcrypt hash IF not hashed
    if "password" in doc and not doc["password"].startswith("$2b$"):
        doc["password"] = bcrypt.hash(doc["password"][:72])

    # Add timestamps
    if "created_at" not in doc:
        doc["created_at"] = datetime.utcnow()

    return doc

if isinstance(data, list):
    documents = [prepare_doc(d) for d in data]

elif isinstance(data, dict):
    # Convert dictionary-of-dicts into array form
    for key, d in data.items():
        doc = {"name": key}
        doc.update(d)
        documents.append(prepare_doc(doc))

else:
    print("❌ Unsupported JSON format. Must be list or object.")
    exit()

if not documents:
    print("⚠ No documents found in JSON.")
    exit()

# ---------------------------------------
# INSERT INTO MONGO
# ---------------------------------------
try:
    result = collection.insert_many(documents)
    print(f"✅ SUCCESS: Inserted {len(result.inserted_ids)} documents into '{collection_name}'.")
except Exception as e:
    print(f"❌ MongoDB Error: {e}")
