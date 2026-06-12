# AI Engineer Portfolio

A collection of AI-powered projects spanning resume analysis, venture capital due diligence, and no-code automation workflows.

---

## Projects

### AI-HR — Resume Analyzer

A web app that evaluates a resume against a job description using GPT-4o vision and ATS scoring logic. Upload a PDF resume, paste a job description, and get structured feedback across five dimensions: ATS compatibility, tone & style, content impact, structure, and skills alignment.

The app converts the PDF to an image client-side, sends it to GPT-4o vision, and returns a scored JSON with specific actionable tips per category. Built with React, TypeScript, Vite, Tailwind CSS, and Puter.js as a serverless backend.

→ [View project](./AI-HR)

---

### AI-VC — DealScout VC Due Diligence Platform

A multi-agent system that automates startup analysis for Venture Capitalists. Enter a company name and URL or paste a full pitch deck, and a pipeline of 7 specialized AI agents researches, analyzes, debates, and delivers a final investment memo.

The agent pipeline covers market sizing, product validation, traction fact-checking, a simulated analyst debate, critical pre-investment questions, and a GP-level PASS / DIG DEEPER / INVEST recommendation. Built with Python, FastAPI, LangChain, LangGraph, OpenAI GPT-4o, Serper API, and a React + Vite frontend.

→ [View project](./AI-VC)

---

### No-Code Workflows — Automation Library

A library of production automation workflows built without custom backend code. Covers HubSpot CRM updates, outbound messaging via Darwin AI, Zapier lead processing, and an MCP server that lets AI agents schedule meetings through natural language.

| Folder | Tool | Description |
|---|---|---|
| `n8n-hubspot-workflow` | n8n | Receives NPS survey responses and updates HubSpot custom objects |
| `zapier/create-contact-hubspot` | Zapier | Creates or updates HubSpot contacts from Darwin AI session events |
| `zapier/outbound-new-contact-list-hubspot` | Zapier | Sends outbound WhatsApp messages when new contacts enter a HubSpot list |
| `MCP-N8N` | n8n + MCP | Exposes HubSpot meeting scheduling as AI tools via Model Context Protocol |

→ [View project](./no-code-workflows)

---

## Stack Overview

| Project | AI | Backend | Frontend |
|---|---|---|---|
| AI-HR | OpenAI GPT-4o | Puter.js (serverless) | React + TypeScript |
| AI-VC | OpenAI GPT-4o | Python + FastAPI + LangGraph | React + Vite |
| No-Code Workflows | — | n8n / Zapier | — |
