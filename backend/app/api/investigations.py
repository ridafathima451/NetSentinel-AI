import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.investigation import Investigation, InvestigationNote
from app.models.alert import Alert
from app.schemas.investigation import (
    InvestigationResponse,
    InvestigationCreate,
    InvestigationUpdate,
    NoteCreate,
    NoteResponse,
)
from app.ml.correlation import CorrelationEngine

router = APIRouter(prefix="/investigations", tags=["Incident Investigation"])

@router.get("", response_model=list[InvestigationResponse])
def list_investigations(status: str | None = None, db: Session = Depends(get_db)):
    """Lists incident investigations."""
    query = db.query(Investigation)
    if status and status.upper() != "ALL":
        query = query.filter(Investigation.status == status.upper())

    investigations = query.order_by(Investigation.updated_at.desc()).all()
    results = []
    for inv in investigations:
        results.append(
            InvestigationResponse(
                id=inv.id,
                title=inv.title,
                summary=inv.summary,
                status=inv.status,
                priority=inv.priority,
                correlation_reason=inv.correlation_reason,
                target_entity=inv.target_entity,
                alert_count=len(inv.alerts),
                created_at=inv.created_at,
                updated_at=inv.updated_at,
                notes=[NoteResponse(
                    id=n.id,
                    investigation_id=n.investigation_id,
                    author=n.author,
                    content=n.content,
                    note_type=n.note_type,
                    created_at=n.created_at,
                ) for n in inv.notes],
                alerts=inv.alerts,
            )
        )
    return results

@router.post("", response_model=InvestigationResponse)
def create_investigation(payload: InvestigationCreate, db: Session = Depends(get_db)):
    """Creates a new incident investigation and links selected alerts."""
    inv_id = str(uuid.uuid4())
    alerts = []
    if payload.alert_ids:
        alerts = db.query(Alert).filter(Alert.id.in_(payload.alert_ids)).all()

    inv = Investigation(
        id=inv_id,
        title=payload.title,
        summary=payload.summary,
        status="OPEN",
        priority=payload.priority.upper(),
        target_entity=alerts[0].source_ip if alerts else None,
        alerts=alerts,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    return InvestigationResponse(
        id=inv.id,
        title=inv.title,
        summary=inv.summary,
        status=inv.status,
        priority=inv.priority,
        correlation_reason=inv.correlation_reason,
        target_entity=inv.target_entity,
        alert_count=len(inv.alerts),
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        notes=[],
        alerts=inv.alerts,
    )

@router.post("/auto-correlate")
def auto_correlate_alerts(db: Session = Depends(get_db)):
    """Triggers the rule-based correlation engine to synthesize incidents from unassigned alerts."""
    recent_alerts = db.query(Alert).order_by(Alert.anomaly_score.desc()).limit(150).all()
    incidents = CorrelationEngine.correlate_alerts(recent_alerts)

    created_count = 0
    for inc_data in incidents:
        # Check if identical investigation title exists
        existing = db.query(Investigation).filter(Investigation.title == inc_data["title"]).first()
        if not existing:
            inv = Investigation(
                id=str(uuid.uuid4()),
                title=inc_data["title"],
                summary=inc_data["summary"],
                status="OPEN",
                priority=inc_data["priority"],
                correlation_reason=inc_data["correlation_reason"],
                target_entity=inc_data["target_entity"],
                alerts=inc_data["alerts"][:20],
            )
            db.add(inv)
            db.commit()
            db.refresh(inv)

            note = InvestigationNote(
                id=str(uuid.uuid4()),
                investigation_id=inv.id,
                author="NetSentinel Correlation Engine",
                content=f"Correlated {len(inc_data['alerts'])} alerts. Reason: {inc_data['correlation_reason']}",
                note_type="SYSTEM",
            )
            db.add(note)
            db.commit()
            created_count += 1

    return {"message": f"Correlation complete. Created {created_count} new incident investigations."}

@router.get("/{investigation_id}", response_model=InvestigationResponse)
def get_investigation(investigation_id: str, db: Session = Depends(get_db)):
    """Retrieves full investigation workspace details with timeline of evidence and notes."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    return InvestigationResponse(
        id=inv.id,
        title=inv.title,
        summary=inv.summary,
        status=inv.status,
        priority=inv.priority,
        correlation_reason=inv.correlation_reason,
        target_entity=inv.target_entity,
        alert_count=len(inv.alerts),
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        notes=[NoteResponse(
            id=n.id,
            investigation_id=n.investigation_id,
            author=n.author,
            content=n.content,
            note_type=n.note_type,
            created_at=n.created_at,
        ) for n in inv.notes],
        alerts=inv.alerts,
    )

@router.patch("/{investigation_id}", response_model=InvestigationResponse)
def update_investigation(investigation_id: str, payload: InvestigationUpdate, db: Session = Depends(get_db)):
    """Updates status (OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE) and priority."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    if payload.title:
        inv.title = payload.title
    if payload.summary is not None:
        inv.summary = payload.summary
    if payload.status:
        inv.status = payload.status.upper()
    if payload.priority:
        inv.priority = payload.priority.upper()

    db.commit()
    db.refresh(inv)
    return get_investigation(investigation_id, db)

@router.post("/{investigation_id}/notes", response_model=NoteResponse)
def add_note(investigation_id: str, payload: NoteCreate, db: Session = Depends(get_db)):
    """Appends an analyst finding or hypothesis note to the investigation timeline."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    note = InvestigationNote(
        id=str(uuid.uuid4()),
        investigation_id=inv.id,
        author=payload.author,
        content=payload.content,
        note_type="USER",
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return NoteResponse(
        id=note.id,
        investigation_id=note.investigation_id,
        author=note.author,
        content=note.content,
        note_type=note.note_type,
        created_at=note.created_at,
    )

