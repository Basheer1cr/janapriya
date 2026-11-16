import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Janapriya - People's Priorities Platform"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "janapriya-vizag-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for demo convenience
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

settings = Settings()

# Ensure uploads directory exists for citizen photos and voice recordings
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Demographic and Infrastructure Gap Data for Visakhapatnam Constituency Villages
VILLAGE_DATA = {
    "Anandapuram": {
        "mandal": "Anandapuram Mandal",
        "pincode": "530052",
        "population": 9500,
        "lat": 17.8962,
        "lng": 83.3746,
        "gaps": {
            "Road": {
                "score": 92.0,
                "title": "Anandapuram Main Link Road Widening & Blacktop Repair",
                "reason_en": "no all-weather road for 4km, heavy potholes halting ambulances and farm transport",
                "reason_te": "4 కి.మీ మేర సరైన తారు రోడ్డు లేదు, అంబులెన్స్ మరియు రైతు వాహనాలకు తీవ్ర అంతరాయం"
            },
            "Water": {
                "score": 85.0,
                "title": "Anandapuram Overhead Tank & Piped Drinking Water Supply",
                "reason_en": "groundwater depleted, acute summer drinking water shortage across 6 wards",
                "reason_te": "భూగర్భ జలాలు అడుగంటాయి, 6 వార్డులలో తీవ్ర తాగునీటి కొరత"
            },
            "default": {
                "score": 65.0,
                "title": "Anandapuram Rural Infrastructure Works",
                "reason_en": "growing rural hub requiring civic facility expansion",
                "reason_te": "పెరుగుతున్న జనాభాకు అనుగుణంగా మౌలిక సదుపాయాల అవసరం"
            }
        }
    },
    "Madhurawada": {
        "mandal": "Chinagadili Mandal",
        "pincode": "530048",
        "population": 14500,
        "lat": 17.8211,
        "lng": 83.3561,
        "gaps": {
            "School": {
                "score": 88.0,
                "title": "Madhurawada ZP High School Upgrade & Junior College Labs",
                "reason_en": "1200 students affected, 8km daily travel to nearest higher secondary school",
                "reason_te": "1200 మంది విద్యార్థులపై ప్రభావం, పై చదువుల కోసం 8 కి.మీ ప్రయాణించాల్సిన పరిస్థితి"
            },
            "default": {
                "score": 70.0,
                "title": "Madhurawada Civic Development Works",
                "reason_en": "rapidly urbanizing zone with high population density",
                "reason_te": "వేగంగా అభివృద్ధి చెందుతున్న ప్రాంతం, అధిక జనసాంద్రత"
            }
        }
    },
    "Bheemili": {
        "mandal": "Bheemunipatnam Mandal",
        "pincode": "531163",
        "population": 8200,
        "lat": 17.8904,
        "lng": 83.4521,
        "gaps": {
            "Health": {
                "score": 90.0,
                "title": "Bheemili 24x7 Primary Health Centre (PHC) & Maternity Wing",
                "reason_en": "no nearby 24x7 PHC within 5km for coastal fishing families and pregnant women",
                "reason_te": "5 కి.మీ పరిధిలో 24x7 ప్రాథమిక ఆరోగ్య కేంద్రం లేదు, మత్స్యకార కుటుంబాలకు ఇబ్బంది"
            },
            "default": {
                "score": 68.0,
                "title": "Bheemili Coastal Infrastructure Improvement",
                "reason_en": "coastal settlement needing resilient public utilities",
                "reason_te": "తీరప్రాంత గ్రామాలకు మెరుగైన ప్రభుత్వ సదుపాయాల అవసరం"
            }
        }
    },
    "Pendurthi": {
        "mandal": "Pendurthi Mandal",
        "pincode": "531173",
        "population": 11000,
        "lat": 17.8139,
        "lng": 83.2089,
        "gaps": {
            "Drainage": {
                "score": 78.0,
                "title": "Pendurthi Underground Stormwater Drainage & Canal Desilting",
                "reason_en": "monsoon waterlogging in low-lying colonies causing mosquito-borne fevers",
                "reason_te": "వర్షాకాలంలో లోతట్టు కాలనీలలో మురుగునీటి నిల్వ, వ్యాధుల ప్రబలే ప్రమాదం"
            },
            "Employment": {
                "score": 52.0,
                "title": "Pendurthi Youth Vocational & Digital Skill Training Centre",
                "reason_en": "local youth seeking job-oriented technical training near industrial corridor",
                "reason_te": "స్థానిక యువతకు ఉపాధి కల్పించే వృత్తి నైపుణ్య శిక్షణ కేంద్రం అవసరం"
            },
            "default": {
                "score": 60.0,
                "title": "Pendurthi Community Infrastructure Works",
                "reason_en": "suburban junction needing upgraded public amenities",
                "reason_te": "పెందుర్తి పరిసర ప్రాంతాలలో మౌలిక వసతుల అభివృద్ధి"
            }
        }
    }
}