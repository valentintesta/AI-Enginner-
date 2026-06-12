# MCP HubSpot — Meetings API

n8n workflow that exposes a **Model Context Protocol (MCP) server** with 3 AI tools for scheduling meetings via HubSpot. An AI agent (e.g. Darwin AI) can call these tools to check availability, search contacts, and book meetings — all through natural language.

---

## Architecture

```
AI Agent (MCP Client)
        ↓
[MCP Server Trigger]
        ↓
  ┌─────┼─────┐
  ↓     ↓     ↓
[Tool 1] [Tool 2] [Tool 3]
getAvail setMeeting getContact
  ↓         ↓          ↓
[Webhook] [Webhook1] [Webhook2]
  ↓         ↓          ↓
HubSpot  HubSpot     HubSpot
Avail.   Book API    Search API
  ↓         ↓          ↓
Format   Respond    Get Owner
& Merge            & Respond
```

---

## MCP Tools Exposed

| Tool | Description | Input params |
|---|---|---|
| `getAvailability Tool` | Returns available meeting slots for a given agenda | `timezone`, `slug` |
| `setMeeting Tool` | Books a meeting in HubSpot | `name`, `lastname`, `organizerID`, `startTime`, `slug`, `email`, `timezone`, `duration` |
| `getContact Tool` | Searches a HubSpot contact by phone and returns owner info | `phone` |

---

## Sub-flows

### Sub-flow 1 — Get Availability

Triggered by `getAvailability Tool` via internal webhook.

```
Webhook (POST)
    ↓
Encoding — encode slug (/ → %2F)
    ↓ (parallel)
  ┌─────────────────┐
  ↓                 ↓
HubSpot API       HubSpot API
month 0           month 1
  ↓                 ↓
Filter 30min      Filter 30min
slots only        slots only
  ↓                 ↓
Format UNIX       Format UNIX
→ Text            → Text
  └────────┬────────┘
           ↓
         Merge
           ↓
    Respond to Webhook
```

**Details:**
- Fetches availability for current month and next month in parallel
- Filters to only show **30-minute slots** (1800000ms)
- Converts UNIX timestamps to human-readable day + time in the contact's timezone
- Output format:
```json
{
  "Duracion de la reunion": "1800000 milissegundos (30.0 minutos)",
  "Dias y horarios disponibles": [
    { "Día": "Martes 2025-06-17", "Horarios": "10:00, 10:30, 11:00" }
  ]
}
```

---

### Sub-flow 2 — Set Meeting

Triggered by `setMeeting Tool` via internal webhook.

```
Webhook1 (POST)
    ↓
Form payload — build request body
    ↓
HubSpot Meetings API — POST /book
    ↓
Respond to Webhook
```

**Booking body sent to HubSpot:**

| Field | Source |
|---|---|
| `duration` | from tool input |
| `firstName` | from tool input |
| `lastName` | from tool input |
| `likelyAvailableUserIds` | `organizerID` from tool input |
| `timezone` | from tool input |
| `startTime` | from tool input (UTC, format `YYYY-MM-DDThh:mm:00Z`) |
| `email` | from tool input |
| `slug` | from tool input |
| `subject` | `Koltin - {firstName} {lastName}` |

> **Time conversion:** The AI adds 3 hours to convert from Brazil time (UTC-3) to UTC before passing `startTime`.

---

### Sub-flow 3 — Get Contact

Triggered by `getContact Tool` via internal webhook.

```
Webhook2 (POST)
    ↓
HubSpot Search API — find contact by phone
    ↓
HubSpot Owners API — get owner by ID
    ↓
Respond to Webhook
```

**Properties returned from HubSpot:**
- `hs_object_id`
- `firstname`
- `phone`
- `hubspot_owner_id`
- `email`

---

## Setup

1. Import the JSON into your n8n instance
2. Set your HubSpot Bearer token in each HTTP Request node
3. Update the internal webhook URLs to match your n8n instance domain
4. Connect the MCP Server Trigger to your AI agent as an MCP client

---

## Requirements

- n8n with MCP support (`@n8n/n8n-nodes-langchain.mcpTrigger`)
- HubSpot account with Meetings enabled
- HubSpot Private App token with `crm.objects.contacts.read` and `scheduler` scopes
