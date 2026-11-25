"""Minimal persistent continuity control plane.

This service supervises agent heartbeats and coordinates safe session handoffs.
It does not claim to execute repository work until a project execution adapter is configured.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import secrets
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from sqlalchemy import DateTime, Integer, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("continuity")


class Settings(BaseSettings):
    database_url: str = ""
    continuity_api_token: str = ""
    supervisor_interval_seconds: int = 300
    context_checkpoint_percent: int = 75
    context_hard_limit_percent: int = 80
    approval_policy: str = "critical"
    autonomy_mode: str = "autonomous"
    blackveil_provider: str = "openai"
    blackveil_model: str = ""
    blackveil_openai_api_key: str = ""
    blackveil_agent_webhook_url: str = ""
    blackveil_agent_webhook_token: str = ""
    the_hidden_truth_provider: str = "webhook"
    the_hidden_truth_model: str = ""
    the_hidden_truth_openai_api_key: str = ""
    the_hidden_truth_agent_webhook_url: str = ""
    the_hidden_truth_agent_webhook_token: str = ""
    blackveil_repository: str = "HexDrifter0/BLACKVEIL"
    the_hidden_truth_repository: str = "HexDrifter0/the-archivits-files"

    class Config:
        env_file = ".env"
        extra = "ignore"


cfg = Settings()


class Base(DeclarativeBase):
    pass


class ProjectState(Base):
    __tablename__ = "continuity_project_state"
    project: Mapped[str] = mapped_column(String(40), primary_key=True)
    repository: Mapped[str] = mapped_column(String(200))
    provider: Mapped[str] = mapped_column(String(40))
    active_session_id: Mapped[str] = mapped_column(String(120), default="")
    status: Mapped[str] = mapped_column(String(40), default="awaiting_agent")
    context_percent: Mapped[int] = mapped_column(Integer, default=0)
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    checkpoint_json: Mapped[str] = mapped_column(Text, default="{}")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AuditEvent(Base):
    __tablename__ = "continuity_audit_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project: Mapped[str] = mapped_column(String(40), index=True)
    event_type: Mapped[str] = mapped_column(String(60))
    detail_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class HeartbeatIn(BaseModel):
    session_id: str = Field(min_length=1, max_length=120)
    status: str = Field(default="working", max_length=40)
    context_percent: int = Field(ge=0, le=100)
    branch: str = Field(default="", max_length=200)
    commit_sha: str = Field(default="", max_length=80)
    completed: list[str] = Field(default_factory=list)
    pending_task: str = ""
    acceptance_criteria: list[str] = Field(default_factory=list)
    changed_files: list[str] = Field(default_factory=list)
    test_results: list[str] = Field(default_factory=list)
    provider_session_ref: str = ""
    next_safe_action: str = ""


class HandoffAck(BaseModel):
    accepted: bool
    successor_session_id: str = ""
    detail: str = ""


def require_config() -> None:
    if not cfg.database_url.startswith(("postgresql://", "postgres://", "postgresql+psycopg://")):
        raise RuntimeError("DATABASE_URL must point to persistent PostgreSQL.")
    if len(cfg.continuity_api_token) < 32:
        raise RuntimeError("CONTINUITY_API_TOKEN must contain at least 32 characters.")
    if cfg.supervisor_interval_seconds != 300:
        raise RuntimeError("Supervisor interval is fixed at 300 seconds.")
    if not (1 <= cfg.context_checkpoint_percent < cfg.context_hard_limit_percent <= 100):
        raise RuntimeError("Context thresholds must satisfy checkpoint < hard limit <= 100.")
    if cfg.approval_policy != "critical" or cfg.autonomy_mode != "autonomous":
        raise RuntimeError("Configured policy does not match the approved operating mode.")


engine = None
SessionLocal = None
app = FastAPI(title="Autonomous Continuity Control Plane", version="0.1.0")
supervisor_task: asyncio.Task | None = None


def auth(authorization: str | None = Header(default=None)) -> None:
    expected = f"Bearer {cfg.continuity_api_token}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


def project_config(project: str) -> dict[str, str]:
    if project == "BLACKVEIL":
        return {
            "repository": cfg.blackveil_repository,
            "provider": cfg.blackveil_provider,
            "model": cfg.blackveil_model,
            "api_key": cfg.blackveil_openai_api_key,
            "webhook_url": cfg.blackveil_agent_webhook_url,
            "webhook_token": cfg.blackveil_agent_webhook_token,
        }
    if project == "THE_HIDDEN_TRUTH":
        return {
            "repository": cfg.the_hidden_truth_repository,
            "provider": cfg.the_hidden_truth_provider,
            "model": cfg.the_hidden_truth_model,
            "api_key": cfg.the_hidden_truth_openai_api_key,
            "webhook_url": cfg.the_hidden_truth_agent_webhook_url,
            "webhook_token": cfg.the_hidden_truth_agent_webhook_token,
        }
    raise HTTPException(status_code=404, detail="Unknown project")


def record(db, project: str, event_type: str, detail: dict[str, Any]) -> None:
    db.add(AuditEvent(project=project, event_type=event_type, detail_json=json.dumps(detail, ensure_ascii=False)))
    db.commit()


async def dispatch_handoff(project: str, state: ProjectState, checkpoint: dict[str, Any]) -> HandoffAck:
    """Ask the configured execution agent to open a successor session.

    Provider adapters must acknowledge a unique successor session. No acknowledgement
    means the predecessor remains authoritative and work is not duplicated.
    """
    pc = project_config(project)
    # Hybrid mode: OpenAI compacts the checkpoint for BLACKVEIL; the project's
    # authenticated execution gateway creates the actual successor worker session.
    if pc["provider"] == "openai":
        if not pc["api_key"] or not pc["model"]:
            return HandoffAck(accepted=False, detail="OpenAI model/key not configured; handoff queued.")
        async with httpx.AsyncClient(timeout=45) as client:
            compact = await client.post(
                "https://api.openai.com/v1/responses",
                headers={"Authorization": f"Bearer {pc['api_key']}", "Content-Type": "application/json"},
                json={
                    "model": pc["model"],
                    "instructions": (
                        "Create a lossless operational handoff summary for a software engineering agent. "
                        "Preserve repository, branch, commit, completed work, pending task, acceptance criteria, "
                        "changed files, test evidence, blockers and next safe action. Never invent progress. "
                        "Return concise structured Markdown."
                    ),
                    "input": json.dumps(checkpoint, ensure_ascii=False),
                },
            )
            compact.raise_for_status()
            compact_data = compact.json()
            checkpoint["handoff_context"] = compact_data.get("output_text", "")
            checkpoint["openai_response_id"] = compact_data.get("id", "")
    if not pc["webhook_url"] or not pc["webhook_token"]:
        return HandoffAck(accepted=False, detail="Project execution webhook not configured; handoff queued.")
    idem = hashlib.sha256(f"{project}:{state.active_session_id}:{json.dumps(checkpoint, sort_keys=True)}".encode()).hexdigest()
    payload = {
        "event": "continuity.handoff",
        "project": project,
        "repository": pc["repository"],
        "previous_session_id": state.active_session_id,
        "checkpoint": checkpoint,
        "policy": {"autonomy": "autonomous", "approval": "critical"},
        "idempotency_key": idem,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            pc["webhook_url"],
            json=payload,
            headers={"Authorization": f"Bearer {pc['webhook_token']}", "Idempotency-Key": idem},
        )
        response.raise_for_status()
        return HandoffAck.model_validate(response.json())


async def dispatch_continue(project: str, state: ProjectState) -> None:
    """Send the five-minute continuation nudge to the project's execution agent."""
    pc = project_config(project)
    if not pc["webhook_url"] or not pc["webhook_token"]:
        return
    tick = int(datetime.now(timezone.utc).timestamp() // cfg.supervisor_interval_seconds)
    idem = hashlib.sha256(f"{project}:{state.active_session_id}:continue:{tick}".encode()).hexdigest()
    payload = {
        "event": "continuity.supervisor_tick",
        "project": project,
        "repository": pc["repository"],
        "session_id": state.active_session_id,
        "instruction": "Continue the current authorized work from the latest checkpoint. "
                       "Do not repeat completed tasks. Update the heartbeat and report context usage. "
                       "Pause for approval on critical or irreversible actions.",
        "policy": {"autonomy": "autonomous", "approval": "critical"},
        "idempotency_key": idem,
    }
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            pc["webhook_url"],
            json=payload,
            headers={"Authorization": f"Bearer {pc['webhook_token']}", "Idempotency-Key": idem},
        )
        response.raise_for_status()
    record(SessionLocal(), project, "continuation_dispatched", {"session_id": state.active_session_id, "tick": tick})


async def supervise_once() -> None:
    if SessionLocal is None:
        return
    for project in ("BLACKVEIL", "THE_HIDDEN_TRUTH"):
        db = SessionLocal()
        try:
            state = db.get(ProjectState, project)
            if state is None:
                pc = project_config(project)
                state = ProjectState(project=project, repository=pc["repository"], provider=pc["provider"])
                db.add(state)
                db.commit()
                record(db, project, "initialized_waiting_for_agent", {"provider": pc["provider"]})
                continue
            if state.status in ("approval_required", "blocked"):
                continue
            if state.context_percent >= cfg.context_checkpoint_percent and state.active_session_id:
                checkpoint = json.loads(state.checkpoint_json or "{}")
                checkpoint["captured_at"] = datetime.now(timezone.utc).isoformat()
                checkpoint["context_percent_at_capture"] = state.context_percent
                state.status = "handoff_pending"
                state.checkpoint_json = json.dumps(checkpoint, ensure_ascii=False)
                db.commit()
                record(db, project, "checkpoint_created", checkpoint)
                try:
                    ack = await dispatch_handoff(project, state, checkpoint)
                    if ack.accepted and ack.successor_session_id:
                        old = state.active_session_id
                        state.active_session_id = ack.successor_session_id
                        state.context_percent = 0
                        state.status = "working"
                        db.commit()
                        record(db, project, "session_handoff_completed", {
                            "previous_session_id": old,
                            "successor_session_id": ack.successor_session_id,
                        })
                    else:
                        state.status = "handoff_pending"
                        db.commit()
                        record(db, project, "handoff_waiting_for_provider", {"detail": ack.detail})
                except Exception as exc:
                    state.status = "handoff_pending"
                    db.commit()
                    record(db, project, "handoff_failed", {"error": type(exc).__name__})
            elif state.last_heartbeat is None:
                record(db, project, "awaiting_agent_heartbeat", {})
            else:
                age = (datetime.now(timezone.utc) - state.last_heartbeat).total_seconds()
                if age > 900:
                    state.status = "stale_heartbeat"
                    db.commit()
                    record(db, project, "stale_heartbeat", {"age_seconds": int(age)})
                elif state.status == "working":
                    try:
                        await dispatch_continue(project, state)
                    except Exception as exc:
                        record(db, project, "continuation_dispatch_failed", {"error": type(exc).__name__})
        finally:
            db.close()


async def supervisor_loop() -> None:
    while True:
        try:
            await supervise_once()
        except Exception:
            log.exception("Supervisor iteration failed")
        await asyncio.sleep(cfg.supervisor_interval_seconds)


@app.on_event("startup")
async def startup() -> None:
    global engine, SessionLocal, supervisor_task
    require_config()
    url = cfg.database_url.replace("postgres://", "postgresql+psycopg://", 1)
    url = url.replace("postgresql://", "postgresql+psycopg://", 1) if url.startswith("postgresql://") else url
    engine = create_engine(url, pool_pre_ping=True, pool_size=3, max_overflow=2)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    supervisor_task = asyncio.create_task(supervisor_loop())


@app.on_event("shutdown")
async def shutdown() -> None:
    global supervisor_task
    if supervisor_task:
        supervisor_task.cancel()
        try:
            await supervisor_task
        except asyncio.CancelledError:
            pass
    if engine:
        engine.dispose()


@app.get("/health")
async def health():
    return {"status": "ok", "supervisor_interval_seconds": cfg.supervisor_interval_seconds,
            "checkpoint_percent": cfg.context_checkpoint_percent,
            "hard_limit_percent": cfg.context_hard_limit_percent,
            "autonomy": cfg.autonomy_mode, "approval": cfg.approval_policy}


@app.get("/v1/status", dependencies=[Depends(auth)])
async def status():
    db = SessionLocal()
    try:
        rows = db.scalars(select(ProjectState)).all()
        return {"projects": [{
            "project": x.project, "repository": x.repository, "provider": x.provider,
            "session_id": x.active_session_id, "status": x.status,
            "context_percent": x.context_percent,
            "last_heartbeat": x.last_heartbeat.isoformat() if x.last_heartbeat else None,
        } for x in rows]}
    finally:
        db.close()


@app.post("/v1/projects/{project}/heartbeat", dependencies=[Depends(auth)])
async def heartbeat(project: str, payload: HeartbeatIn):
    pc = project_config(project)
    db = SessionLocal()
    try:
        state = db.get(ProjectState, project)
        if state is None:
            state = ProjectState(project=project, repository=pc["repository"], provider=pc["provider"])
            db.add(state)
        state.active_session_id = payload.session_id
        # 75% starts a checkpoint; 80% is a hard stop until handoff succeeds.
        state.status = "handoff_pending" if payload.context_percent >= cfg.context_checkpoint_percent else payload.status
        state.context_percent = payload.context_percent
        state.last_heartbeat = datetime.now(timezone.utc)
        state.updated_at = datetime.now(timezone.utc)
        state.checkpoint_json = json.dumps(payload.model_dump(), ensure_ascii=False)
        db.commit()
        record(db, project, "heartbeat_received", {
            "session_id": payload.session_id, "context_percent": payload.context_percent,
            "branch": payload.branch, "commit_sha": payload.commit_sha,
        })
        action = "pause_and_wait_for_handoff" if payload.context_percent >= cfg.context_hard_limit_percent else (
            "checkpoint_due" if payload.context_percent >= cfg.context_checkpoint_percent else "continue"
        )
        return {"accepted": True, "action": action,
                "checkpoint_at_percent": cfg.context_checkpoint_percent,
                "hard_limit_percent": cfg.context_hard_limit_percent}
    finally:
        db.close()
