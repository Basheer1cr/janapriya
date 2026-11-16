from sqlalchemy.orm import Session
from app.models import Submission, ProjectCluster
from app.config import VILLAGE_DATA

URGENCY_WEIGHTS = {
    "Low": 25.0,
    "Medium": 50.0,
    "High": 75.0,
    "Critical": 100.0
}

CATEGORY_TELUGU = {
    "Road": "రోడ్డు నిర్మాణం",
    "Water": "తాగునీటి సరఫరా",
    "School": "పాఠశాల ఆధునీకరణ",
    "Health": "ప్రాథమిక ఆరోగ్య కేంద్రం (PHC)",
    "Drainage": "డ్రైనేజీ వ్యవస్థ",
    "Electricity": "విద్యుత్ సదుపాయం",
    "Agriculture": "వ్యవసాయ మద్దతు",
    "Employment": "ఉపాధి శిక్షణ కేంద్రం"
}


def recalculate_rankings(db: Session):
    """
    Groups real citizen submissions by (village, category), computes the
    priority score, updates ProjectCluster rows, and assigns ranks 1, 2, 3...
    """
    # Preserve existing status (Approved / In-Progress / Completed)
    existing_clusters = db.query(ProjectCluster).all()
    existing_status_map = {
        (c.village, c.category): c.status for c in existing_clusters
    }

    # Clear old cluster rows first
    db.query(ProjectCluster).delete()
    db.commit()

    submissions = db.query(Submission).all()
    if not submissions:
        return []

    # Group real user submissions by (village, category)
    grouped = {}
    for sub in submissions:
        key = (sub.village, sub.category)
        grouped.setdefault(key, []).append(sub)

    computed_clusters = []

    for (village, category), sub_list in grouped.items():
        total_requests = len(sub_list)

        v_info = VILLAGE_DATA.get(village, {
            "population": 6000,
            "lat": 17.85,
            "lng": 83.35,
            "gaps": {}
        })
        population = v_info.get("population", 6000)

        gaps_dict = v_info.get("gaps", {})
        cat_gap = gaps_dict.get(category) or gaps_dict.get("default") or {
            "score": 65.0,
            "title": f"{village} {category} Development Project",
            "reason_en": f"infrastructure need reported in {village}",
            "reason_te": f"{village} గ్రామంలో మౌలిక సదుపాయాల అవసరం"
        }

        gap_score = float(cat_gap["score"])

        # Use latest user submission summary to make the cluster reason reflect real input
        latest_sub = sub_list[-1]
        latest_summary = latest_sub.summary or latest_sub.translated_text

        urgency_values = [URGENCY_WEIGHTS.get(s.urgency, 50.0) for s in sub_list]
        avg_urgency = sum(urgency_values) / len(urgency_values)

        demand_score = min((total_requests / 100.0) * 100.0, 100.0)
        population_score = min((population / 10000.0) * 100.0, 100.0)
        urgency_score = avg_urgency

        priority_score = (
            (demand_score * 0.40) +
            (population_score * 0.25) +
            (gap_score * 0.20) +
            (urgency_score * 0.15)
        )

        avg_lat = sum(s.lat for s in sub_list) / total_requests
        avg_lng = sum(s.lng for s in sub_list) / total_requests

        computed_clusters.append({
            "title": f"{village} - {category} Development Works",
            "category": category,
            "village": village,
            "total_requests": total_requests,
            "avg_urgency": round(avg_urgency, 1),
            "population": population,
            "infrastructure_gap_score": gap_score,
            "priority_score": round(priority_score, 2),
            "latest_summary": latest_summary,
            "reason_te": cat_gap["reason_te"],
            "status": existing_status_map.get((village, category), "Pending"),
            "lat": round(avg_lat, 5),
            "lng": round(avg_lng, 5)
        })

    # Sort by priority_score DESC
    computed_clusters.sort(
        key=lambda x: (x["priority_score"], x["total_requests"]),
        reverse=True
    )

    db_objects = []
    for idx, item in enumerate(computed_clusters, start=1):
        te_cat = CATEGORY_TELUGU.get(item["category"], item["category"])
        req_word = "citizen" if item["total_requests"] == 1 else "citizens"

        bilingual_reason = (
            f"Why this is #{idx}: {item['total_requests']} {req_word} requested, "
            f"{item['population']:,} village population, Latest report: \"{item['latest_summary']}\" | "
            f"తెలుగు (కారణం #{idx}): {item['total_requests']} పౌరుల విజ్ఞప్తి ({te_cat}), "
            f"{item['population']:,} జనాభా, {item['reason_te']}."
        )

        cluster_obj = ProjectCluster(
            title=item["title"],
            category=item["category"],
            village=item["village"],
            total_requests=item["total_requests"],
            avg_urgency=item["avg_urgency"],
            population=item["population"],
            infrastructure_gap_score=item["infrastructure_gap_score"],
            priority_score=item["priority_score"],
            rank=idx,
            reason=bilingual_reason,
            status=item["status"],
            lat=item["lat"],
            lng=item["lng"]
        )
        db_objects.append(cluster_obj)

    db.add_all(db_objects)
    db.commit()
    return db_objects