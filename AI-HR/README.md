# AI Resume Analyzer

A web app that evaluates a resume against a job description using GPT-4o vision and ATS scoring logic. Upload a PDF, paste a job description, and get structured feedback across five dimensions: ATS compatibility, tone & style, content impact, structure, and skills alignment.

---

## What it does

1. User uploads a resume (PDF) and pastes a job title + job description
2. The PDF is converted to an image client-side
3. The image is sent to OpenAI's GPT-4o vision API with an ATS-focused evaluation prompt
4. The model returns a structured JSON score with specific, actionable tips per category
5. Results are stored in Puter KV and the user is redirected to a feedback page

The ATS evaluation prompt simulates how a real applicant tracking system processes a resume: it checks keyword match against the job description, flags formatting issues that break parsers (tables, columns, graphics), evaluates whether achievements are quantified, and lists which required skills are present or missing.

---

## Tech stack

- **React + React Router v7** — frontend and routing
- **TypeScript** — throughout
- **Vite** — build tool and dev server
- **Tailwind CSS** — styling
- **Zustand** — global state (auth, file system, AI)
- **Puter.js** — serverless auth, file storage, and KV store (no backend needed)
- **OpenAI API (GPT-4o)** — resume analysis via vision + structured JSON output

---

## Key decisions

**OpenAI instead of Puter AI**: The original implementation used Puter's built-in Claude integration. Switched to calling the OpenAI API directly to use GPT-4o vision with full control over the model, prompt, and response format.

**Image instead of PDF**: OpenAI's vision API doesn't accept PDFs directly. The app converts the PDF to a PNG client-side before sending it to the model.

**ATS prompt**: The evaluation prompt was written to simulate a real ATS pass — it extracts keywords from the job description and checks them against the resume, flags layout issues that break parsers, and scores each dimension independently with a strict rubric.

**Error handling**: The analysis flow wraps all async steps in try/catch/finally to ensure the loading state always resets, and falls back to regex extraction if the model returns JSON wrapped in extra text.

---

## Setup

```bash
npm install
```

Create a `.env` file in the root:

```
VITE_OPENAI_API_KEY=your_openai_key_here
```

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project structure

```
app/
  lib/
    puter.ts       # Puter auth, FS, KV, and OpenAI feedback call
    pdf2img.ts     # PDF to image conversion (client-side)
  routes/
    upload.tsx     # Upload flow and analysis orchestration
    resume/        # Feedback display page
constants/
  index.ts         # ATS evaluation prompt and response format
```
