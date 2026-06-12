import os
import uuid
from typing import List

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from instructions import build_instructions
from scoring import generate_feedback

REALTIME_MODEL = "gpt-realtime-2"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets"

app = FastAPI(title="Voice Interview Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict = {}


class InterviewConfig(BaseModel):
    candidate_name: str
    company_name: str
    job_role: str
    interview_duration_minutes: int = 15


class FeedbackPayload(BaseModel):
    transcript: List[dict] = []


@app.get("/")
def root():
    return {
        "service": "Voice Interview Agent API",
        "status": "ok",
        "frontend": "http://localhost:5173",
    }


@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/interview")
def create_interview(config: InterviewConfig):
    sid = str(uuid.uuid4())
    sessions[sid] = {
        "id": sid,
        "config": config.model_dump(),
        "instructions": build_instructions(
            candidate_name=config.candidate_name,
            company_name=config.company_name,
            job_role=config.job_role,
            interview_duration_minutes=config.interview_duration_minutes,
        ),
        "summary": None,
        "messages": [],
        "ended": False,
    }
    return {"session_id": sid}


@app.get("/api/interview/{session_id}/token")
async def get_token(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set on server")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                CLIENT_SECRETS_URL,
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"session": {"type": "realtime", "model": REALTIME_MODEL}},
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {e}")

    if r.status_code >= 400:
        raise HTTPException(status_code=r.status_code, detail=f"OpenAI error: {r.text}")

    data = r.json()
    # The ephemeral secret may come back flat as {"value": "ek_..."} or nested.
    value = data.get("value") or data.get("client_secret", {}).get("value")
    if not value:
        raise HTTPException(status_code=502, detail=f"No client secret in OpenAI response: {data}")

    return {
        "value": value,
        "model": REALTIME_MODEL,
        "instructions": session["instructions"],
        "duration_minutes": session["config"]["interview_duration_minutes"],
    }


@app.post("/api/interview/{session_id}/feedback")
async def post_feedback(session_id: str, payload: FeedbackPayload):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = payload.transcript or []
    summary = await generate_feedback(messages, session["config"])

    session["messages"] = messages
    session["summary"] = summary
    session["ended"] = True

    return {
        "session_id": session_id,
        "summary": summary,
        "messages": messages,
    }


@app.get("/api/interview/{session_id}/feedback")
def get_feedback(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    cfg = session["config"]
    return {
        "session_id": session_id,
        "candidate_name": cfg["candidate_name"],
        "job_role": cfg["job_role"],
        "company_name": cfg["company_name"],
        "summary": session["summary"],
        "messages": session["messages"],
        "ended": session["ended"],
    }


@app.get("/api/interviews")
def list_interviews():
    result = []
    for s in sessions.values():
        cfg = s["config"]
        result.append({
            "session_id": s["id"],
            "candidate_name": cfg["candidate_name"],
            "job_role": cfg["job_role"],
            "company_name": cfg["company_name"],
            "ended": s["ended"],
            "has_feedback": s["summary"] is not None,
            "summary": s["summary"],
        })
    return result
