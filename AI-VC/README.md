# DealScout — AI VC Due Diligence Platform

Multi-agent system that automates startup analysis for Venture Capitalists.

---

## Architecture

```
React Frontend  →  FastAPI Backend  →  LangGraph Agent Pipeline
    (Vite)           (Python)               (OpenAI GPT-4o)
                                                   |
                                    ┌──────────────┼──────────────┐
                                    ↓              ↓              ↓
                              Google Search   Web Scraper    PDF Parser
                              (Serper API)
```

---

## Agent Pipeline

```
Input (Company Name + URL  or  Full Pitch Deck)
    ↓
[1] Research Agent     → scrapes website, searches news, builds pitch deck
    ↓
[2] Market Analyst     → verifies TAM/SAM, checks competitors, scores timing
    ↓
[3] Product Analyst    → audits tech stack, checks if product is live
    ↓
[4] Traction Analyst   → cross-checks metrics, finds red flags
    ↓
[5] Debate Moderator   → forces analysts to argue contradictions
    ↓
[6] Questions Agent    → generates 8-12 hard questions before investing
    ↓
[7] GP Synthesizer     → writes final PASS / DIG DEEPER / INVEST memo
```

---

## Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | React + Vite + Tailwind |
| Backend  | Python + FastAPI        |
| AI       | OpenAI GPT-4o           |
| Agents   | LangChain + LangGraph   |
| Search   | Serper API              |

---

## Running Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Input Modes

**Quick Mode** — just company name + URL. AI auto-generates a pitch deck from web research.

**Full Mode** — paste a complete pitch deck for deeper analysis.

---

## Output

- Market timing score + TAM estimate
- Product-market fit assessment
- Traction score + red flags
- Live agent debate transcript
- 8-12 critical questions before investing
- Final investment memo with recommendation
