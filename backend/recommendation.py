from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import numpy as np
from collections import Counter

from db import db  # shared DB connection

# Load NLP model
model = SentenceTransformer("all-mpnet-base-v2")

# Load databases
program_data = list(db["program_vectors"].find({}, {"_id": 0}))
rankings_doc = db["school_rankings"].find_one({}, {"_id": 0})
grade_profiles = list(db["grade_profiles"].find({}, {"_id": 0}))

# Extract ranking data
rankings_data = rankings_doc["programs"] if rankings_doc and "programs" in rankings_doc else {}

# CONFIG
THRESHOLD = 0.4
CATEGORY_WEIGHT = 0.3
GRADE_WEIGHT = 0.3  # weight of grade similarity in final score


# 🧩 SUBJECT MAPPING (for SHS and variants)
SUBJECT_MAPPING = {
    "general mathematics": "mathematics",
    "math": "mathematics",
    "pre-calculus": "mathematics",
    "basic calculus": "mathematics",
    "probability and statistics": "mathematics",
    "stat": "mathematics",
    "probability": "mathematics",

    "earth science": "science",
    "physical science": "science",
    "biology": "science",
    "chemistry": "science",
    "physics": "science",
    "science": "science",

    "oral communication": "english",
    "reading and writing": "english",
    "english for academic and professional purposes": "english",
    "english": "english",

    "komunikasyon at pananaliksik": "filipino",
    "pagbasa at pagsusuri": "filipino",
    "filipino sa piling larangan": "filipino",
    "filipino": "filipino",

    "personal development": "social studies",
    "understanding culture society and politics": "social studies",
    "ucsp": "social studies",
    "world religions": "social studies",
    "philosophy": "social studies",
    "social studies": "social studies",
}


def normalize_subject_name(name: str) -> str:
    """Normalize subject name to lowercase and mapped equivalent."""
    s = name.strip().lower()
    return SUBJECT_MAPPING.get(s, s)


def get_school_rating(school_name, category):
    ranked_list = rankings_data.get(category, [])
    for school in ranked_list:
        if school_name.lower() in school["school"].lower():
            return school["rating"]
    return None


def get_grade_profile(category):
    """Fetch expected grade profile for a given category."""
    for g in grade_profiles:
        if g["category"].lower() == category.lower():
            return g.get("profile") or g.get("subjects") or {}
    return {}


def compute_grade_similarity(user_grades, category_profile):
    """Compare user grades vs. typical profile for a category."""
    # Normalize subject names before comparison
    normalized_user_grades = {normalize_subject_name(k): v for k, v in user_grades.items()}
    normalized_profile = {normalize_subject_name(k): v for k, v in category_profile.items()}

    subjects = list(set(normalized_user_grades.keys()) & set(normalized_profile.keys()))
    if not subjects:
        return 0.0

    user_vector = np.array([normalized_user_grades[s] for s in subjects])
    profile_vector = np.array([normalized_profile[s] for s in subjects])

    return cosine_similarity([user_vector], [profile_vector])[0][0]


def recommend(answers: dict, user_grades: dict = None, school_type: str = None,
              locations: list[str] = None, max_budget: float = None):

    print("\n📊 Starting Program Matching Breakdown")

    # Step 1: NLP Vectorization of answers
    vectors = {}
    for key in ["academics", "fields", "activities", "goals", "environment"]:
        items = answers.get(key, [])
        custom = answers.get("custom", {}).get(key, "")
        merged = items + ([custom] if custom.strip() else [])
        text = " ".join(merged)
        if text.strip():
            vec = model.encode(text)
        else:
            vec = np.zeros(model.get_sentence_embedding_dimension())
        vectors[key] = vec

    valid_vectors = [v for v in vectors.values() if np.linalg.norm(v) > 0]
    if not valid_vectors:
        return {
            "type": "fallback",
            "message": "No valid input provided. Please answer at least one question.",
            "results": [],
            "weak_matches": []
        }

    combined_vector = np.mean(valid_vectors, axis=0).reshape(1, -1)

    # Step 2: Evaluate all programs
    candidate_programs = []
    for entry in program_data:
        try:
            entry_type = entry.get("school_type", "").lower()
            if school_type and school_type.lower() != "any" and entry_type != school_type.lower():
                continue

            if locations:
                entry_location = entry.get("location", "").lower()
                if all(loc.lower() not in entry_location for loc in locations):
                    continue

            if max_budget is not None:
                tuition = entry.get("tuition_per_semester")
                if tuition is not None and isinstance(tuition, (int, float)) and tuition > max_budget:
                    continue

            # Interest similarity
            program_vector = np.array(entry["vector"]).reshape(1, -1)
            interest_score = cosine_similarity(program_vector, combined_vector)[0][0]

            # Grade similarity
            category = entry.get("category", "")
            profile = get_grade_profile(category)
            grade_score = compute_grade_similarity(user_grades or {}, profile) if user_grades else 0.0

            # School rating
            school_rating = get_school_rating(entry.get("school", ""), category) or 0

            # Combine all scores
            final_score = (0.7 * interest_score) + (GRADE_WEIGHT * grade_score) + (CATEGORY_WEIGHT * school_rating)

            result_item = {
                "school": entry.get("school"),
                "program": entry.get("name"),
                "description": entry.get("description"),
                "similarity_score": interest_score,
                "grade_similarity": grade_score,
                "final_score": final_score,
                "tuition_per_semester": entry.get("tuition_per_semester"),
                "tuition_annual": entry.get("tuition_annual"),
                "tuition_notes": entry.get("tuition_notes"),
                "admission_requirements": entry.get("admission_requirements"),
                "grade_requirements": entry.get("grade_requirements"),
                "school_requirements": entry.get("school_requirements"),
                "school_website": entry.get("school_website"),
                "school_type": entry.get("school_type"),
                "location": entry.get("location"),
                "school_logo": entry.get("school_logo"),
                "board_passing_rate": entry.get("board_passing_rate"),
                "national_passing_rate": entry.get("national_passing_rate"),
                "uni_rank": entry.get("uni_rank"),
                "category": category,
                "school_rank": school_rating,
            }

            candidate_programs.append(result_item)

        except Exception as e:
            print(f"⚠️ Skipping invalid entry: {e}")
            continue

    # Step 3: Separate matches
    strong_matches = [p for p in candidate_programs if p["similarity_score"] >= THRESHOLD]
    weak_matches = [p for p in candidate_programs if p["similarity_score"] < THRESHOLD]

    # Step 4: Identify top category
    categories = [p["category"] for p in strong_matches if p["category"]]
    top_category = Counter(categories).most_common(1)[0][0] if categories else None

    # Step 5: Sort by combined score
    final_strong = sorted(strong_matches, key=lambda x: x["final_score"], reverse=True)
    final_weak = sorted(weak_matches, key=lambda x: x["final_score"], reverse=True)

    # Step 6: Top ranked schools
    top_ranked_schools = rankings_data.get(top_category, [])[:5] if top_category else []

    # Step 7: Fallback
    if not final_strong:
        fallback_results = final_weak[:6]
        fallback_weak = final_weak[6:12] if len(final_weak) > 6 else []
        return {
            "type": "fallback",
            "message": "We couldn't find a strong match based on your interests and grades. Here are some alternatives.",
            "results": fallback_results,
            "weak_matches": fallback_weak,
            "matched_category": top_category,
            "top_schools_for_category": top_ranked_schools
        }

    return {
        "type": "exact",
        "results": final_strong[:10],
        "weak_matches": final_weak[:10],
        "matched_category": top_category,
        "top_schools_for_category": top_ranked_schools
    }
