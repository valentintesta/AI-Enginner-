import os
import json
from openai import AsyncOpenAI

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


SCORING_SYSTEM = """You are an expert HR assessor. You are given the transcript of a voice screening interview between an AI interviewer (Alex) and a candidate.

Evaluate the CANDIDATE only. Return a single JSON object with EXACTLY this shape:

{
  "overall_score": <int 0-100>,
  "scores": {
    "communication": <int 0-100>,
    "technical_knowledge": <int 0-100>,
    "problem_solving": <int 0-100>,
    "cultural_fit": <int 0-100>,
    "confidence": <int 0-100>
  },
  "strengths": [<short string>, ...],
  "areas_for_improvement": [<short string>, ...],
  "overall_impression": <2-3 sentence string>,
  "recommendation": <one of "STRONG_HIRE", "HIRE", "MAYBE", "NO_HIRE">
}

Rules:
- Base scores strictly on what the candidate actually said.
- If the transcript is empty or the candidate barely spoke, give low scores, note the lack of responses, and recommend "NO_HIRE".
- Provide 2-4 items each for strengths and areas_for_improvement.
- Return ONLY the JSON object, no extra text."""


async def generate_feedback(messages: list, config: dict) -> dict:
    transcript_text = "\n".join(
        f"{m.get('role', 'user')}: {m.get('content', '')}" for m in messages
    ).strip()

    if not transcript_text:
        transcript_text = "(No conversation took place — the candidate did not respond.)"

    user_prompt = (
        f"Role: {config.get('job_role')}\n"
        f"Company: {config.get('company_name')}\n"
        f"Candidate: {config.get('candidate_name')}\n\n"
        f"Transcript:\n{transcript_text}"
    )

    client = get_client()
    resp = await client.chat.completions.create(
        model="gpt-4o",
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SCORING_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
    )

    data = json.loads(resp.choices[0].message.content)

    # Normalize defensively so the frontend always renders cleanly.
    scores = data.get("scores", {}) or {}
    return {
        "overall_score": int(data.get("overall_score", 0)),
        "scores": {
            "communication": int(scores.get("communication", 0)),
            "technical_knowledge": int(scores.get("technical_knowledge", 0)),
            "problem_solving": int(scores.get("problem_solving", 0)),
            "cultural_fit": int(scores.get("cultural_fit", 0)),
            "confidence": int(scores.get("confidence", 0)),
        },
        "strengths": data.get("strengths", []) or [],
        "areas_for_improvement": data.get("areas_for_improvement", []) or [],
        "overall_impression": data.get("overall_impression", ""),
        "recommendation": data.get("recommendation", "MAYBE"),
    }
