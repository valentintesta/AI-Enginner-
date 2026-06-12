import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from agent import app as workflow

api = FastAPI(title="DealScout API")

api.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    company_name: Optional[str] = ""
    company_url: Optional[str] = ""
    pitch_text: Optional[str] = ""


@api.get("/health")
async def health():
    return {"status": "ok"}


@api.post("/analyze")
async def analyze(request: AnalysisRequest):
    if not request.company_name and not request.company_url and not request.pitch_text:
        raise HTTPException(status_code=400, detail="Provide company name, URL, or pitch text.")

    initial_state = {
        "company_name": request.company_name or "",
        "company_url": request.company_url or "",
        "raw_input": request.pitch_text or "",
        "pitch_text": "",
        "market_analysis": "",
        "product_analysis": "",
        "traction_analysis": "",
        "debate_transcript": "",
        "questions_to_reconsider": "",
        "final_memo": ""
    }

    try:
        result = workflow.invoke(initial_state)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(api, host="0.0.0.0", port=8000)
