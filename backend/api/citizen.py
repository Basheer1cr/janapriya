import os
import time
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Citizen, Submission, ProjectCluster
from app.ai_service import analyze_submission
from app.ranking import recalculate_rankings
from app.config import settings, VILLAGE_DATA

router = APIRouter(prefix="/api/citizen", tags=["Citizen Portal"])


@router.post("/submit")
async def create_citizen_submission(
    name: str = Form("Citizen"),
    phone: str = Form("9848000000"),
    village: str = Form("Anandapuram"),
    category: Optional[str] = Form(None),
    text: str = Form(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    source: str = Form("Web Portal"),
    photo: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Submission text cannot be empty")

    # 1. Ensure citizen exists in DB
    clean_phone = phone.strip()
    citizen = db.query(Citizen).filter(Citizen.phone == clean_phone).first()
    v_meta = VILLAGE_DATA.get(
        village,
        {"mandal": "Visakhapatnam Rural", "pincode": "530052", "lat": 17.85, "lng": 83.35}
    )

    if not citizen:
        citizen = Citizen(
            phone=clean_phone,
            name=name,
            village=village,
            mandal=v_meta["mandal"],
            pincode=v_meta["pincode"],
            is_verified=True
        )
        db.add(citizen)
        db.commit()
        db.refresh(citizen)

    # 2. Save optional photo upload
    saved_photo_url = None
    disk_photo_path = None
    if photo and photo.filename:
        ext = os.path.splitext(photo.filename)[1] or ".jpg"
        safe_filename = f"photo_{int(time.time() * 1000)}{ext}"
        disk_photo_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        with open(disk_photo_path, "wb") as f:
            f.write(await photo.read())
        saved_photo_url = f"/uploads/{safe_filename}"

    # 3. Save optional voice note upload
    saved_audio_url = None
    if audio and audio.filename:
        ext = os.path.splitext(audio.filename)[1] or ".webm"
        safe_audio_name = f"voice_{int(time.time() * 1000)}{ext}"
        disk_audio_path = os.path.join(settings.UPLOAD_DIR, safe_audio_name)
        with open(disk_audio_path, "wb") as f:
            f.write(await audio.read())
        saved_audio_url = f"/uploads/{safe_audio_name}"

    # 4. Run AI Analysis
    ai_result = analyze_submission(
        text=text,
        user_category=category,
        photo_path=disk_photo_path
    )

    # 5. Default GPS coordinates to village center if browser geolocation wasn't provided
    final_lat = lat if lat is not None else v_meta.get("lat", 17.85)
    final_lng = lng if lng is not None else v_meta.get("lng", 83.35)

    # 6. Save Submission to SQLite
    new_sub = Submission(
        citizen_id=citizen.id,
        original_text=text.strip(),
        translated_text=ai_result["translated_text"],
        summary=ai_result["summary"],
        language=ai_result["language"],
        category=ai_result["category"],
        urgency=ai_result["urgency"],
        village=village,
        lat=final_lat,
        lng=final_lng,
        photo_path=saved_photo_url,
        audio_path=saved_audio_url,
        source=source,
        status="Pending"
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    # 7. Recalculate Constituency Clusters & Ranks immediately
    recalculate_rankings(db)

    matching_cluster = (
        db.query(ProjectCluster)
        .filter(
            ProjectCluster.village == village,
            ProjectCluster.category == new_sub.category
        )
        .first()
    )

    return {
        "success": True,
        "message": "Submission analyzed by AI and added to constituency priority cluster!",
        "submission": {
            "id": new_sub.id,
            "original_text": new_sub.original_text,
            "translated_text": new_sub.translated_text,
            "summary": new_sub.summary,
            "language": new_sub.category,
            "category": new_sub.category,
            "urgency": new_sub.urgency,
            "village": new_sub.village,
            "lat": new_sub.lat,
            "lng": new_sub.lng,
            "photo_path": new_sub.photo_path,
            "source": new_sub.source,
            "ai_engine": ai_result.get("ai_engine", "AI")
        },
        "cluster_impact": {
            "cluster_title": matching_cluster.title if matching_cluster else "",
            "current_rank": matching_cluster.rank if matching_cluster else 1,
            "total_requests": matching_cluster.total_requests if matching_cluster else 1,
            "priority_score": matching_cluster.priority_score if matching_cluster else 80.0
        }
    }


@router.get("/recent")
def get_recent_submissions(limit: int = 10, db: Session = Depends(get_db)):
    subs = (
        db.query(Submission)
        .order_by(Submission.id.desc())
        .limit(limit)
        .all()
    )
    return subs