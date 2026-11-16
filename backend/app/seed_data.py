import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Citizen, Submission, ProposedProject
from app.ranking import recalculate_rankings
from app.config import VILLAGE_DATA

def seed_initial_data(db: Session):
    """
    Populates the SQLite database with demo citizens, multilingual submissions,
    proposed MPLADS projects, and triggers the AI ranking engine.
    Runs automatically on startup if the database is empty.
    """
    existing_count = db.query(Submission).count()
    if existing_count > 0:
        return

    print("[Seed] Populating Visakhapatnam Constituency demo data...")

    # 1. Create sample verified citizens across our 4 demo villages
    demo_citizens = [
        Citizen(phone="9848011111", name="Rama Rao Pentakota", village="Anandapuram", mandal="Anandapuram Mandal", pincode="530052", is_verified=True),
        Citizen(phone="9848022222", name="Lakshmi Devi Korada", village="Anandapuram", mandal="Anandapuram Mandal", pincode="530052", is_verified=True),
        Citizen(phone="9848033333", name="Srinivasulu Botsa", village="Madhurawada", mandal="Chinagadili Mandal", pincode="530048", is_verified=True),
        Citizen(phone="9848044444", name="Appanna Mylapalli", village="Bheemili", mandal="Bheemunipatnam Mandal", pincode="531163", is_verified=True),
        Citizen(phone="9848055555", name="Venkatesh Galla", village="Pendurthi", mandal="Pendurthi Mandal", pincode="531173", is_verified=True),
    ]
    db.add_all(demo_citizens)
    db.commit()

    # 2. Create official ProposedProject records for budget comparison on MP Dashboard
    proposed_projects = [
        ProposedProject(
            title="Anandapuram Main Link Road Widening & Blacktop Repair",
            category="Road",
            village="Anandapuram",
            estimated_cost="₹2.40 Cr",
            population_impact=9500,
            is_in_development_plan=True
        ),
        ProposedProject(
            title="Anandapuram Overhead Tank & Piped Drinking Water Supply",
            category="Water",
            village="Anandapuram",
            estimated_cost="₹1.65 Cr",
            population_impact=9500,
            is_in_development_plan=True
        ),
        ProposedProject(
            title="Madhurawada ZP High School Upgrade & Junior College Labs",
            category="School",
            village="Madhurawada",
            estimated_cost="₹1.20 Cr",
            population_impact=14500,
            is_in_development_plan=True
        ),
        ProposedProject(
            title="Bheemili 24x7 Primary Health Centre (PHC) & Maternity Wing",
            category="Health",
            village="Bheemili",
            estimated_cost="₹1.90 Cr",
            population_impact=8200,
            is_in_development_plan=False
        ),
        ProposedProject(
            title="Pendurthi Underground Stormwater Drainage & Canal Desilting",
            category="Drainage",
            village="Pendurthi",
            estimated_cost="₹1.10 Cr",
            population_impact=11000,
            is_in_development_plan=True
        ),
        ProposedProject(
            title="Pendurthi Youth Vocational & Digital Skill Training Centre",
            category="Employment",
            village="Pendurthi",
            estimated_cost="₹0.75 Cr",
            population_impact=11000,
            is_in_development_plan=False
        ),
    ]
    db.add_all(proposed_projects)
    db.commit()

    # 3. Seed realistic multilingual submissions matching exact Step 4E cluster volumes
    cluster_specs = [
        {
            "village": "Anandapuram",
            "category": "Road",
            "count": 120,
            "urgency": "Critical",
            "samples": [
                (
                    "Telugu",
                    "ఆనందపురం మెయిన్ రోడ్డు పూర్తిగా గుంతలమయంగా మారింది. రాత్రిపూట గర్భిణీ స్త్రీలను ఆసుపత్రికి తీసుకెళ్లడానికి అంబులెన్స్ కూడా రావడం లేదు. వెంటనే తారు రోడ్డు వేయగలరు.",
                    "Anandapuram main road is completely filled with deep potholes. Even ambulances cannot reach at night to transport pregnant women to the hospital. Please lay a blacktop road immediately.",
                    "Critical pothole damage on 4km Anandapuram main link road blocking ambulances."
                ),
                (
                    "English",
                    "The 4km road stretch from Anandapuram junction to the interior panchayat has washed away. Farmers cannot transport vegetables to Vizag rythu bazaar.",
                    "The 4km road stretch from Anandapuram junction to the interior panchayat has washed away. Farmers cannot transport vegetables to Vizag rythu bazaar.",
                    "Washed-out 4km road halting farm transport in Anandapuram."
                ),
                (
                    "Hindi",
                    "आनंदपुरम मुख्य सड़क पर बड़े-बड़े गड्ढे हैं, जिससे रोज दुपहिया वाहन दुर्घटनाग्रस्त हो रहे हैं। कृपया तुरंत सड़क की मरम्मत करवाएं।",
                    "There are huge potholes on the Anandapuram main road causing daily two-wheeler accidents. Please repair the road immediately.",
                    "Severe road potholes causing daily two-wheeler accidents in Anandapuram."
                ),
            ]
        },
        {
            "village": "Anandapuram",
            "category": "Water",
            "count": 80,
            "urgency": "High",
            "samples": [
                (
                    "Telugu",
                    "ఆనందపురం ఎస్సీ కాలనీ మరియు మెయిన్ వార్డులో గత రెండు నెలలుగా తాగునీటి సరఫరా సక్రమంగా లేదు. బోర్లు ఎండిపోయాయి, కొత్త ఓవర్ హెడ్ ట్యాంక్ నిర్మించండి.",
                    "Drinking water supply has been irregular for the past two months in Anandapuram wards. Borewells have dried up; please construct a new overhead water tank.",
                    "Acute drinking water shortage and dried borewells across 6 wards in Anandapuram."
                ),
                (
                    "English",
                    "Women in Anandapuram are walking over 1.5 km every morning to fetch drinking water because the old pipeline is leaking and pressure is too low.",
                    "Women in Anandapuram are walking over 1.5 km every morning to fetch drinking water because the old pipeline is leaking and pressure is too low.",
                    "Pipeline leakage and low water pressure forcing women to walk 1.5 km daily."
                ),
            ]
        },
        {
            "village": "Madhurawada",
            "category": "School",
            "count": 60,
            "urgency": "High",
            "samples": [
                (
                    "Telugu",
                    "మధురవాడ హైస్కూల్‌లో 1200 మంది విద్యార్థులు ఉన్నారు కానీ సరిపడా తరగతి గదులు, సైన్స్ ల్యాబ్ లేవు. పై చదువుల కోసం 8 కి.మీ దూరం ప్రయాణించాల్సి వస్తోంది.",
                    "There are 1200 students in Madhurawada High School but insufficient classrooms and science labs. Students must travel 8km daily for higher classes.",
                    "1200 students affected at Madhurawada school; 8km travel required for senior classes."
                ),
                (
                    "English",
                    "Requesting immediate upgrade of Madhurawada ZP High School with additional classrooms, digital library, and girls' washrooms for 1,200 enrolled students.",
                    "Requesting immediate upgrade of Madhurawada ZP High School with additional classrooms, digital library, and girls' washrooms for 1,200 enrolled students.",
                    "Classroom, lab, and sanitation upgrade needed for 1,200 students in Madhurawada."
                ),
            ]
        },
        {
            "village": "Bheemili",
            "category": "Health",
            "count": 45,
            "urgency": "High",
            "samples": [
                (
                    "Telugu",
                    "భీమిలి తీరప్రాంత గ్రామాలలో 5 కి.మీ పరిధిలో 24 గంటలు పనిచేసే ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) లేదు. అత్యవసర వైద్యం కోసం విశాఖపట్నం కె.జి.హెచ్ కి పరుగెత్తాల్సి వస్తోంది.",
                    "There is no 24x7 Primary Health Centre (PHC) within 5km for Bheemili coastal villages. Families must rush all the way to Vizag KGH for emergencies.",
                    "No 24x7 PHC within 5km in Bheemili; urgent maternity and emergency care needed."
                ),
                (
                    "English",
                    "Fishing community families in Bheemili urgently need a 24x7 PHC with a resident doctor, snakebite anti-venom, and maternity beds within the mandal.",
                    "Fishing community families in Bheemili urgently need a 24x7 PHC with a resident doctor, snakebite anti-venom, and maternity beds within the mandal.",
                    "Coastal fishing families requesting 24x7 PHC and maternity wing in Bheemili."
                ),
            ]
        },
        {
            "village": "Pendurthi",
            "category": "Drainage",
            "count": 30,
            "urgency": "Medium",
            "samples": [
                (
                    "Telugu",
                    "పెందుర్తి లోతట్టు కాలనీలలో డ్రైనేజీ కాలువలు పూడిపోయి వర్షం పడితే ఇళ్లలోకి మురుగునీరు వస్తోంది. దోమల వల్ల డెంగ్యూ జ్వరాలు వస్తున్నాయి.",
                    "Drainage canals in Pendurthi low-lying colonies are silted up, causing sewage water to enter homes during rain and spreading dengue fever.",
                    "Silted drainage canals causing waterlogging and mosquito fevers in Pendurthi."
                ),
                (
                    "English",
                    "Need underground stormwater drainage and concrete side-drains near Pendurthi railway feeder road to prevent monsoon flooding.",
                    "Need underground stormwater drainage and concrete side-drains near Pendurthi railway feeder road to prevent monsoon flooding.",
                    "Stormwater drainage construction needed near Pendurthi feeder road."
                ),
            ]
        },
        {
            "village": "Pendurthi",
            "category": "Employment",
            "count": 25,
            "urgency": "Low",
            "samples": [
                (
                    "Telugu",
                    "పెందుర్తి యువతకు స్థానిక పరిశ్రమలలో ఉద్యోగాలు లభించేలా వృత్తి నైపుణ్య శిక్షణ కేంద్రం (Vocational Training Centre) ఏర్పాటు చేయాలని కోరుతున్నాము.",
                    "We request establishing a Vocational Training Centre in Pendurthi so local youth can gain technical skills for nearby industrial jobs.",
                    "Youth requesting a Vocational & Digital Skill Training Centre in Pendurthi."
                ),
                (
                    "English",
                    "Setting up a skill development and computer training centre in Pendurthi will help 500+ rural graduates find employment in Vizag IT & Pharma hubs.",
                    "Setting up a skill development and computer training centre in Pendurthi will help 500+ rural graduates find employment in Vizag IT & Pharma hubs.",
                    "Proposal for youth vocational skill centre in Pendurthi."
                ),
            ]
        }
    ]

    sources = ["Web Portal", "WhatsApp Bot", "Voice Note"]
    all_submissions = []

    for spec in cluster_specs:
        v_name = spec["village"]
        base_lat = VILLAGE_DATA[v_name]["lat"]
        base_lng = VILLAGE_DATA[v_name]["lng"]

        for i in range(spec["count"]):
            lang, orig_text, trans_text, summary = spec["samples"][i % len(spec["samples"])]
            # Add slight GPS jitter so map markers spread naturally around the village
            jitter_lat = base_lat + random.uniform(-0.008, 0.008)
            jitter_lng = base_lng + random.uniform(-0.008, 0.008)

            sub = Submission(
                citizen_id=(i % 5) + 1,
                original_text=orig_text,
                translated_text=trans_text,
                summary=summary,
                language=lang,
                category=spec["category"],
                urgency=spec["urgency"],
                village=v_name,
                lat=round(jitter_lat, 5),
                lng=round(jitter_lng, 5),
                photo_path=None,
                audio_path=None,
                source=sources[i % len(sources)],
                status="Pending",
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 120))
            )
            all_submissions.append(sub)

    db.add_all(all_submissions)
    db.commit()

    # 4. Run clustering and ranking engine on the seeded submissions
    clusters = recalculate_rankings(db)
    print(f"[Seed] Inserted {len(all_submissions)} submissions and ranked {len(clusters)} priority clusters.")