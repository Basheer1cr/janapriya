from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Citizen, OTP
from app.schemas import OTPSendRequest, OTPVerifyRequest
from app.auth import create_access_token
from app.config import VILLAGE_DATA

router = APIRouter(prefix="/api/otp", tags=["Mock OTP Auth"])

@router.post("/send")
def send_mock_otp(payload: OTPSendRequest, db: Session = Depends(get_db)):
    """
    Always generates mock OTP '123456' for the hackathon demo, saves it to the
    database, and ensures a Citizen record exists for this phone number.
    """
    clean_phone = payload.phone.strip()
    if not clean_phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

    # Save mock OTP 123456 to OTP table
    otp_entry = OTP(
        phone=clean_phone,
        otp_code="123456",
        expires_at=datetime.utcnow() + timedelta(minutes=30)
    )
    db.add(otp_entry)

    # Create or update Citizen profile
    citizen = db.query(Citizen).filter(Citizen.phone == clean_phone).first()
    v_meta = VILLAGE_DATA.get(payload.village, {"mandal": "Visakhapatnam Rural", "pincode": "530052"})

    if not citizen:
        citizen = Citizen(
            phone=clean_phone,
            name=payload.name or "Citizen",
            village=payload.village or "Anandapuram",
            mandal=v_meta["mandal"],
            pincode=v_meta["pincode"],
            is_verified=False
        )
        db.add(citizen)
    else:
        if payload.name:
            citizen.name = payload.name
        if payload.village:
            citizen.village = payload.village

    db.commit()
    return {
        "success": True,
        "message": "OTP is 123456",
        "otp": "123456",
        "phone": clean_phone
    }


@router.post("/verify")
def verify_mock_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Verifies if OTP equals '123456'. If valid, marks the citizen as verified
    in the database and returns a signed JWT token.
    """
    clean_phone = payload.phone.strip()
    if payload.otp_code.strip() != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP. Use 123456 for demo.")

    citizen = db.query(Citizen).filter(Citizen.phone == clean_phone).first()
    v_meta = VILLAGE_DATA.get(payload.village, {"mandal": "Visakhapatnam Rural", "pincode": "530052"})

    if not citizen:
        citizen = Citizen(
            phone=clean_phone,
            name=payload.name or "Verified Citizen",
            village=payload.village or "Anandapuram",
            mandal=v_meta["mandal"],
            pincode=v_meta["pincode"],
            is_verified=True
        )
        db.add(citizen)
    else:
        citizen.is_verified = True
        if payload.name:
            citizen.name = payload.name
        if payload.village:
            citizen.village = payload.village

    db.commit()
    db.refresh(citizen)

    token = create_access_token({
        "sub": citizen.phone,
        "role": "citizen",
        "citizen_id": citizen.id
    })

    return {
        "success": True,
        "message": "Citizen phone verified successfully!",
        "access_token": token,
        "token_type": "bearer",
        "citizen": {
            "id": citizen.id,
            "name": citizen.name,
            "phone": citizen.phone,
            "village": citizen.village,
            "is_verified": citizen.is_verified
        }
    }