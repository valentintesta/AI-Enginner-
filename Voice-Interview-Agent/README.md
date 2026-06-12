# Voice Interview Agent

AI-powered voice screening platform. The AI interviewer "Alex" talks with candidates in real time using **OpenAI's Realtime API** (speech-to-speech, no separate STT/TTS). After the call, the transcript is scored by GPT-4o into a structured assessment.

## Stack

| Layer | Tech |
|---|---|
| Voice (speech-to-speech) | OpenAI Realtime API · `gpt-realtime-2` · `@openai/agents/realtime` |
| Transport | WebRTC (browser handles mic + speaker automatically) |
| Scoring | OpenAI GPT-4o (JSON structured output) |
| Backend | Python + FastAPI |
| Frontend | React + Vite + Tailwind CSS |

## Architecture

```
Browser (React + @openai/agents/realtime)
    │  1. POST /api/interview        → session_id
    │  2. GET  /api/interview/:id/token
    ▼
FastAPI  ──► OpenAI POST /v1/realtime/client_secrets
    │            └─► returns ephemeral key (ek_...)
    ▼
Browser  ──► RealtimeSession.connect({ apiKey: ek_... })
    │            └─► WebRTC speech-to-speech with gpt-realtime-2
    │                (server VAD handles turn-taking)
    ▼
On end:  POST /api/interview/:id/feedback { transcript }
             └─► GPT-4o scores transcript → scorecard JSON
```

The real `OPENAI_API_KEY` never leaves the server. The browser only ever receives a short-lived ephemeral key.

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

`.env` already contains `OPENAI_API_KEY`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Usage

1. Click **Start New Interview**, fill in candidate, company, role, duration.
2. On the interview page, allow microphone access.
3. Just talk — Alex greets you and conducts the interview. Turn-taking is automatic (server VAD).
4. Click **End Interview** (or let the timer run out) to finish.
5. The feedback page shows an overall score, 5 category scores, strengths, areas to improve, and a hire recommendation.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/interview` | Create session, build interviewer instructions |
| GET | `/api/interview/{id}/token` | Mint ephemeral Realtime key + instructions |
| POST | `/api/interview/{id}/feedback` | Score transcript with GPT-4o |
| GET | `/api/interview/{id}/feedback` | Fetch stored scorecard |
| GET | `/api/interviews` | List all sessions |

## Credentials (local only — never push to GitHub)

- `OPENAI_API_KEY` — used for both the Realtime ephemeral key and GPT-4o scoring.
