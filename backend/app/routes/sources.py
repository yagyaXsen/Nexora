from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Source
from app.schemas import SourceCreate, SourceUpdate, SourceRead, PipelineRunRead
from app.routes.deps import verify_admin_key
from app.pipeline.runner import runner

router = APIRouter(prefix="/api/sources", tags=["Sources"])

@router.get("", response_model=List[SourceRead])
def list_sources(db: Session = Depends(get_db)):
    return db.query(Source).order_by(Source.created_at.desc()).all()

@router.post("", response_model=SourceRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_admin_key)])
def create_source(source_in: SourceCreate, db: Session = Depends(get_db)):
    source = Source(
        name=source_in.name,
        type=source_in.type.value,
        url=source_in.url,
        config=source_in.config or {},
        enabled=source_in.enabled,
        schedule=source_in.schedule
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source

@router.patch("/{id}", response_model=SourceRead, dependencies=[Depends(verify_admin_key)])
def update_source(id: int, source_in: SourceUpdate, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == id).first()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source ID {id} not found")

    update_data = source_in.model_dump(exclude_unset=True)
    if "type" in update_data and update_data["type"]:
        update_data["type"] = update_data["type"].value

    for key, value in update_data.items():
        setattr(source, key, value)

    db.commit()
    db.refresh(source)
    return source

@router.post("/{id}/run", response_model=PipelineRunRead, dependencies=[Depends(verify_admin_key)])
def trigger_source_run(id: int, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == id).first()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source ID {id} not found")

    pipeline_run = runner.run_source(db, source)
    return pipeline_run
