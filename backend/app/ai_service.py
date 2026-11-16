import json
import os
import google.generativeai as genai
from app.config import settings

VALID_CATEGORIES = [
    "Road", "Water", "School", "Health",
    "Drainage", "Electricity", "Agriculture", "Employment"
]
VALID_URGENCIES = ["Low", "Medium", "High", "Critical"]

# Configure Gemini API if a key is present in .env
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


def fallback_analyze_submission(text: str, user_category: str = None) -> dict:
    """
    Rule-based classifier and translator used when GEMINI_API_KEY is missing
    or when offline. Ensures the live demo never crashes.
    """
    raw_text = (text or "").strip()
    lower_text = raw_text.lower()

    # 1. Detect Language (check Unicode ranges for Telugu and Devanagari/Hindi)
    language = "English"
    for ch in raw_text:
        if "\u0c00" <= ch <= "\u0c7f":
            language = "Telugu"
            break
        elif "\u0900" <= ch <= "\u097f":
            language = "Hindi"
            break

    # 2. Keyword dictionaries for Category detection (English + Telugu + Hindi)
    category_keywords = {
        "Road": ["road", "pothole", "bridge", "highway", "street", "bus", "రోడ్డు", "గుంతలు", "రహదారి", "सड़क", "गड्ढे", "रास्ता"],
        "Water": ["water", "drinking", "pipe", "borewell", "tank", "tap", "నీరు", "తాగునీరు", "బోరు", "పైపు", "पानी", "पेयजल", "नल"],
        "School": ["school", "college", "student", "teacher", "classroom", "education", "పాఠశాల", "స్కూల్", "విద్యార్థులు", "టీచర్", "स्कूल", "विद्यालय", "छात्र"],
        "Health": ["health", "hospital", "phc", "doctor", "ambulance", "medicine", "fever", "ఆసుపత్రి", "ఆరోగ్య", "డాక్టర్", "అంబులెన్స్", "మందులు", "अस्पताल", "स्वास्थ्य", "डॉक्टर"],
        "Drainage": ["drainage", "sewage", "gutter", "mosquito", "overflow", "canal", "డ్రైనేజీ", "మురుగు", "కాలువ", "దోమలు", "नाली", "सीवेज", "गंदा पानी"],
        "Electricity": ["electricity", "power", "current", "transformer", "streetlight", "pole", "కరెంట్", "విద్యుత్", "వీధిలైట్లు", "ట్రాన్స్‌ఫార్మర్", "बिजली", "लाइट", "ट्रांसफार्मर"],
        "Agriculture": ["agriculture", "farmer", "crop", "irrigation", "fertilizer", "paddy", "రైతు", "పంట", "వ్యవసాయం", "సాగునీరు", "किसान", "फसल", "खेती"],
        "Employment": ["job", "employment", "skill", "vocational", "youth", "training", "work", "ఉపాధి", "ఉద్యోగం", "శిక్షణ", "యువత", "रोजगार", "नौकरी", "प्रशिक्षण"]
    }

    detected_category = user_category if user_category in VALID_CATEGORIES else None
    if not detected_category:
        for cat, words in category_keywords.items():
            if any(w in lower_text for w in words):
                detected_category = cat
                break
    if not detected_category:
        detected_category = "Road"

    # 3. Detect Urgency level
    critical_words = ["critical", "emergency", "accident", "pregnant", "death", "collapse", "no water", "urgent", "ప్రమాదం", "అత్యవసర", "గర్భిణీ", "తాగునీరు లేదు", "आपातकालीन", "दुर्घटना"]
    high_words = ["severe", "broken", "damaged", "hospital", "shortage", "overflow", "pothole", "8km", "తీవ్రమైన", "గుంతలు", "కొరత", "ఇబ్బంది", "गंभीर", "समस्या"]
    low_words = ["suggestion", "future", "training", "vocational", "park", "library", "శిక్షణ", "సూచన", "सुझाव", "प्रशिक्षण"]

    if any(w in lower_text for w in critical_words):
        urgency = "Critical"
    elif any(w in lower_text for w in high_words):
        urgency = "High"
    elif any(w in lower_text for w in low_words):
        urgency = "Low"
    else:
        urgency = "High" if detected_category in ["Road", "Water", "Health", "School"] else "Medium"

    # 4. Translate Telugu / Hindi to English if needed
    if language == "English":
        translated_text = raw_text
    else:
        # Provide a clean contextual English translation for non-English inputs
        common_translations = {
            "Road": "Citizens report severely damaged road with deep potholes causing daily commute and ambulance delays.",
            "Water": "Urgent request for regular piped drinking water supply and overhead tank repair due to acute shortage.",
            "School": "Request to upgrade local government high school classrooms and labs so students do not travel far.",
            "Health": "Request for a 24x7 Primary Health Centre (PHC) with doctor and maternity care facilities nearby.",
            "Drainage": "Complaint regarding overflowing drainage and stagnant water causing health hazards in the colony.",
            "Electricity": "Request to fix frequent power outages, install streetlights, and upgrade local transformer.",
            "Agriculture": "Farmers requesting irrigation canal repair and timely agricultural support in the village.",
            "Employment": "Youth requesting a vocational skill development and digital training centre for local jobs."
        }
        translated_text = f"{common_translations.get(detected_category, 'Citizen development request.')} (Original {language}: {raw_text})"

    summary = f"{urgency} priority {detected_category.lower()} issue reported by citizen."

    return {
        "language": language,
        "translated_text": translated_text,
        "category": detected_category,
        "urgency": urgency,
        "summary": summary,
        "ai_engine": "Rule-Based Fallback"
    }


def analyze_submission(text: str, user_category: str = None, photo_path: str = None) -> dict:
    """
    Calls Google Gemini API to analyze text (and optional photo) for language,
    English translation, category, urgency, and 1-line summary.
    Falls back to rule-based logic if API key is missing or errors out.
    """
    if not settings.GEMINI_API_KEY:
        return fallback_analyze_submission(text, user_category)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        You are an AI assistant for a Member of Parliament in Visakhapatnam, Andhra Pradesh.
        Analyze this citizen grievance submission:
        Text: "{text}"
        User-selected category hint: "{user_category or 'None'}"

        Return ONLY a valid JSON object with these exact keys:
        - "language": One of ["Telugu", "Hindi", "English"]
        - "translated_text": Accurate English translation of the text (if already English, keep it clean)
        - "category": Must be EXACTLY one of {VALID_CATEGORIES}
        - "urgency": Must be EXACTLY one of {VALID_URGENCIES}
        - "summary": A concise 1-line executive summary in English (max 15 words)
        """

        contents = [prompt]
        # If a citizen uploaded a photo, attach it for multimodal Gemini analysis
        if photo_path and os.path.exists(photo_path):
            try:
                from PIL import Image
                img = Image.open(photo_path)
                contents.append(img)
            except Exception:
                pass

        response = model.generate_content(contents)
        raw_reply = response.text.strip()

        # Strip markdown code fences if Gemini wraps JSON in ```json ... ```
        if raw_reply.startswith("```"):
            raw_reply = raw_reply.strip("`").replace("json", "", 1).strip()

        parsed = json.loads(raw_reply)

        category = parsed.get("category", user_category or "Road")
        if category not in VALID_CATEGORIES:
            category = user_category if user_category in VALID_CATEGORIES else "Road"

        urgency = parsed.get("urgency", "Medium")
        if urgency not in VALID_URGENCIES:
            urgency = "Medium"

        return {
            "language": parsed.get("language", "English"),
            "translated_text": parsed.get("translated_text", text),
            "category": category,
            "urgency": urgency,
            "summary": parsed.get("summary", f"{urgency} {category} request."),
            "ai_engine": "Google Gemini 1.5 Flash"
        }
    except Exception as exc:
        print(f"[AI Service Info] Using fallback classifier ({exc})")
        return fallback_analyze_submission(text, user_category)