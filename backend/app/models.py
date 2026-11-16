from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from app.database import Base

class Citizen(Base):
    """Stores citizen profile and phone verification status."""
    __tablename__ = "citizens"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    village = Column(String(100), nullable=False)
    mandal = Column(String(100), default="Visakhapatnam Rural")
    pincode = Column(String(10), default="530001")
    is_verified = Column(Boolean, default=False)


class Submission(Base):
    """Stores every grievance or development request sent via Web, Voice, or WhatsApp."""
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("citizens.id"), nullable=True)
    original_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=False)
    summary = Column(String(300), default="")
    language = Column(String(50), default="English")  # Telugu, Hindi, English
    category = Column(String(50), index=True, nullable=False)  # Road, Water, School, Health, etc.
    urgency = Column(String(20), default="Medium")  # Low, Medium, High, Critical
    village = Column(String(100), index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    photo_path = Column(String(255), nullable=True)
    audio_path = Column(String(255), nullable=True)
    source = Column(String(30), default="Web Portal")  # Web Portal, Voice Note, WhatsApp Bot
    status = Column(String(30), default="Pending")  # Pending, Approved, In-Progress, Completed
    created_at = Column(DateTime, default=datetime.utcnow)


class ProjectCluster(Base):
    """Stores grouped and AI-ranked priority works per (village + category)."""
    __tablename__ = "project_clusters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), index=True, nullable=False)
    village = Column(String(100), index=True, nullable=False)
    total_requests = Column(Integer, default=0)
    avg_urgency = Column(Float, default=50.0)
    population = Column(Integer, default=5000)
    infrastructure_gap_score = Column(Float, default=50.0)
    priority_score = Column(Float, default=0.0)
    rank = Column(Integer, index=True, default=999)
    reason = Column(Text, nullable=False)
    status = Column(String(30), default="Pending")  # Pending, Approved, In-Progress, Completed
    lat = Column(Float, default=17.85)
    lng = Column(Float, default=83.35)


class ProposedProject(Base):
    """Stores official constituency development projects & estimated costs."""
    __tablename__ = "proposed_projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    village = Column(String(100), nullable=False)
    estimated_cost = Column(String(50), nullable=False)  # e.g., "₹1.85 Cr"
    population_impact = Column(Integer, default=5000)
    is_in_development_plan = Column(Boolean, default=True)


class OTP(Base):
    """Stores mock OTP codes for citizen phone verification."""
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)