from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class OTPSendRequest(BaseModel):
    phone: str
    name: Optional[str] = "Citizen"
    village: Optional[str] = "Anandapuram"

class OTPVerifyRequest(BaseModel):
    phone: str
    otp_code: str
    name: Optional[str] = "Citizen"
    village: Optional[str] = "Anandapuram"

class MPLoginRequest(BaseModel):
    email: str
    password: str

class StatusUpdateRequest(BaseModel):
    status: str  # Pending, Approved, In-Progress, Completed

class SubmissionOut(BaseModel):
    id: int
    citizen_id: Optional[int]
    original_text: str
    translated_text: str
    summary: Optional[str]
    language: str
    category: str
    urgency: str
    village: str
    lat: float
    lng: float
    photo_path: Optional[str]
    audio_path: Optional[str]
    source: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ClusterOut(BaseModel):
    id: int
    title: str
    category: str
    village: str
    total_requests: int
    avg_urgency: float
    population: int
    infrastructure_gap_score: float
    priority_score: float
    rank: int
    reason: str
    status: str
    lat: float
    lng: float

    class Config:
        from_attributes = True