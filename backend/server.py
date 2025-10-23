import json
from pymongo import MongoClient

# -------------------------------
# MongoDB connection
# -------------------------------
MONGO_URI = "mongodb+srv://felixxbuan:QodcG7NvTkttyTUB@cluster0.poimocp.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["unifinder"]
collection = db["school_strengths"]  # 👈 Target collection for your new JSON

# -------------------------------
# Load JSON file
# -------------------------------
json_file = "school_strengths.json"

try:
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)
except FileNotFoundError:
    print(f"❌ File '{json_file}' not found.")
    exit()
except json.JSONDecodeError as e:
    print(f"❌ Failed to parse JSON: {e}")
    exit()

# -------------------------------
# Prepare documents for MongoDB
# -------------------------------
documents = []

if isinstance(data, list):
    # JSON is already a list of documents
    for doc in data:
        doc.pop("_id", None)  # remove existing _id to avoid duplication errors
        documents.append(doc)
elif isinstance(data, dict):
    # JSON is a dictionary (e.g., { "School Name": {details...}, ... })
    for name, details in data.items():
        doc = {"name": name}
        doc.update(details)
        documents.append(doc)
else:
    print("❌ Unexpected JSON format.")
    exit()

# -------------------------------
# Insert documents into MongoDB
# -------------------------------
if documents:
    result = collection.insert_many(documents)
    print(f"✅ Inserted {len(result.inserted_ids)} documents into '{collection.name}' collection.")
else:
    print("⚠️ No documents to insert.")
