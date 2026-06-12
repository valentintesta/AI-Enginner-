# DealScout — AI VC Due Diligence Platform

Multi-agent system that automates startup analysis for Venture Capitalists.

---

## Architecture

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

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | React                       |
| AI Model | Open AI                     |
| Agents   | LangChain + LangGraph       |
| Search   | Serper API (Google Search)  |

---

## Setup

```bash
pip install -r requirements.txt
```

Create a `.env` file in the root:

```
OPENAI_API_KEY=your_key_here
SERPER_API_KEY=your_key_here
```

Run the app:

```bash
streamlit run ui/app.py
```

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
- Final investment memo: PASS / DIG DEEPER / INVEST
- Downloadable full report
