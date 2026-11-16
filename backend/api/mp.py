from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ProjectCluster, Submission, ProposedProject, Citizen
from app.schemas import MPLoginRequest, StatusUpdateRequest
from app.auth import verify_mp_credentials, create_access_token
from app.ranking import recalculate_rankings

router = APIRouter(prefix="/api/mp", tags=["MP Dashboard"])

@router.post("/login")
def mp_login(payload: MPLoginRequest):
    """
    Authenticates MP / Admin login.
    Demo credentials: mp@vizag.gov.in / admin123
    """
    if not verify_mp_credentials(payload.email, payload.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials. Use mp@vizag.gov.in / admin123 for demo."
        )

    token = create_access_token({"sub": payload.email, "role": "mp"})
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "mp_profile": {
            "name": "Hon. Member of Parliament",
            "constituency": "Visakhapatnam Parliamentary Constituency, AP",
            "email": payload.email
        }
    }


@router.get("/priorities")
def get_ranked_priorities(
    village: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns top ranked ProjectClusters with optional village and category filters,
    along with summary KPI counts for the MP Dashboard header.
    """
    # Ensure rankings exist
    if db.query(ProjectCluster).count() == 0:
        recalculate_rankings(db)

    query = db.query(ProjectCluster)
    if village and village != "All":
        query = query.filter(ProjectCluster.village == village)
    if category and category != "All":
        query = query.filter(ProjectCluster.category == category)

    clusters = query.order_by(ProjectCluster.rank.asc()).limit(10).all()

    # Compute overall constituency statistics
    total_submissions = db.query(Submission).count()
    total_clusters = db.query(ProjectCluster).count()
    critical_count = db.query(Submission).filter(Submission.urgency == "Critical").count()
    approved_clusters = db.query(ProjectCluster).filter(
        ProjectCluster.status.in_(["Approved", "In-Progress", "Completed"])
    ).count()

    # Fetch proposed projects to attach estimated cost to each cluster card
    proposed_map = {
        (p.village, p.category): p
        for p in db.query(ProposedProject).all()
    }

    enriched_clusters = []
    for c in clusters:
        prop = proposed_map.get((c.village, c.category))
        enriched_clusters.append({
            "id": c.id,
            "rank": c.rank,
            "title": c.title,
            "category": c.category,
            "village": c.village,
            "total_requests": c.total_requests,
            "avg_urgency": c.avg_urgency,
            "population": c.population,
            "infrastructure_gap_score": c.infrastructure_gap_score,
            "priority_score": c.priority_score,
            "reason": c.reason,
            "status": c.status,
            "lat": c.lat,
            "lng": c.lng,
            "estimated_cost": prop.estimated_cost if prop else "₹1.25 Cr",
            "is_in_development_plan": prop.is_in_development_plan if prop else False
        })

    return {
        "stats": {
            "total_submissions": total_submissions,
            "total_clusters": total_clusters,
            "critical_requests": critical_count,
            "actioned_projects": approved_clusters
        },
        "priorities": enriched_clusters
    }


@router.get("/cluster/{cluster_id}/proofs")
def get_cluster_proofs(cluster_id: int, db: Session = Depends(get_db)):
    """
    When the MP clicks a Priority Card, returns 3+ sample citizen submissions
    ( prioritize ones with uploaded photos or diverse languages ) + map locations.
    """
    cluster = db.query(ProjectCluster).filter(ProjectCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Project cluster not found")

    # Fetch submissions belonging to this village + category, newest first
    matching_subs = (
        db.query(Submission)
        .filter(
            Submission.village == cluster.village,
            Submission.category == cluster.category
        )
        .order_by(Submission.photo_path.isnot(None).desc(), Submission.id.desc())
        .limit(5)
        .all()
    )

    proof_list = []
    for s in matching_subs:
        citizen = db.query(Citizen).filter(Citizen.id == s.citizen_id).first()
        proof_list.append({
            "id": s.id,
            "citizen_name": citizen.name if citizen else "Verified Citizen",
            "citizen_phone": citizen.phone[:6] + "XXXX" if citizen and citizen.phone else "9848XXXXXX",
            "original_text": s.original_text,
            "translated_text": s.translated_text,
            "summary": s.summary,
            "language": s.language,
            "urgency": s.urgency,
            "lat": s.lat,
            "lng": s.lng,
            "photo_path": s.photo_path,
            "audio_path": s.audio_path,
            "source": s.source,
            "created_at": s.created_at
        })

    return {
        "cluster": cluster,
        "sample_proofs": proof_list[:3],  # Top 3 citizen proofs as requested in Step 4D
        "all_recent_proofs": proof_list
    }


@router.patch("/cluster/{cluster_id}/status")
def update_cluster_status(
    cluster_id: int,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Allows the MP to mark a priority cluster as:
    'Approved', 'In-Progress', or 'Completed'.
    """
    valid_statuses = ["Pending", "Approved", "In-Progress", "Completed"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    cluster = db.query(ProjectCluster).filter(ProjectCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    cluster.status = payload.status

    # Also update underlying submissions for this cluster
    db.query(Submission).filter(
        Submission.village == cluster.village,
        Submission.category == cluster.category
    ).update({"status": payload.status})

    db.commit()
    db.refresh(cluster)

    return {
        "success": True,
        "message": f"Project #{cluster.rank} ({cluster.title}) marked as {cluster.status}",
        "cluster": cluster
    }