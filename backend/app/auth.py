from datetime import datetime, timedelta
from jose import jwt
from app.config import settings

# Demo MP / Admin credentials for hackathon judges
DEMO_MP_EMAIL = "mp@vizag.gov.in"
DEMO_MP_PASSWORD = "admin123"

def create_access_token(data: dict) -> str:
    """Generates a signed JWT token with an expiration timestamp."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_mp_credentials(email: str, password: str) -> bool:
    """Checks if the provided MP email and password match the demo account."""
    return email.strip().lower() == DEMO_MP_EMAIL and password == DEMO_MP_PASSWORD