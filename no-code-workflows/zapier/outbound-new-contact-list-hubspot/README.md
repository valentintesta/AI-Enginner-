# Outbound — New Contact in HubSpot List

Zapier workflow triggered when a new contact is added to the HubSpot list "MASAERATI & INEOS - Leads Digitales". It waits 2 minutes, validates the brand and model, and sends an outbound WhatsApp message via Darwin AI using the appropriate template. Logs the outbound timestamp in Google Sheets.

---

## Flow

```
[1] Trigger — HubSpot: New Contact in List
           ↓
[2] Delay — 2 minutes
           ↓
[3] Code Python — Default owner if empty
           ↓
[4] HubSpot — Get Contact by ID (fetch properties)
           ↓
[5] Filter — Only Maserati brand
           ↓
[6] Branch
    ├── Path A: modelo = Grecale
    │     ↓
    │   [7] Filter — firstname + grecale_version exist
    │     ↓
    │   [8] Webhook POST → Darwin AI (template with grecale_version)
    │     ↓
    │   [9] Code Python — Get current date/time (Argentina UTC-3)
    │     ↓
    │   [10] Google Sheets — Log outbound message
    │
    └── Path B: modelo ≠ Grecale
          ↓
        [11] Webhook POST → Darwin AI (template with bi_modelo_version_v2)
          ↓
        [12] Code Python — Get current date/time (Argentina UTC-3)
          ↓
        [13] Google Sheets — Log outbound message
```

---

## Nodes

### Node 1 — Trigger: HubSpot New Contact in List
- **App:** HubSpot (v1.14.0)
- **Event:** New Contact in List
- **List:** `MASAERATI & INEOS - Leads Digitales` (ID `274`)

---

### Node 2 — Delay
- **Duration:** 2 minutes
- Waits before processing to allow HubSpot data to sync

---

### Node 3 — Code Python: Default Owner
If `hubspot_owner_id` is empty, defaults to Felipe Puente (`81887479`).
```python
if not owner:
    output = {'owner': '81887479'}
else:
    output = {'owner': owner}
```

---

### Node 4 — HubSpot: Get Contact by ID
Fetches the following properties from HubSpot:

| Property | Internal name |
|---|---|
| GF-BI-Modelo Versión | `bi_modelo_version_v2` |
| GF-Marca | `gfmarca` |
| WhatsApp Phone Number | `hs_whatsapp_phone_number` |
| Versiones - Grecale | `grecale_version` |
| Modelo | `modelo` |
| Contact owner | `hubspot_owner_id` |

---

### Node 5 — Filter: Maserati Only
- **Condition:** `gfmarca` equals `Maserati` (case insensitive)
- Stops the Zap for any other brand

---

### Node 6 — Branch
Splits based on `modelo`:
- **Path A:** `modelo` equals `Grecale`
- **Path B:** `modelo` does NOT equal `Grecale`

---

### Path A — Grecale Model

**Node 7 — Filter: Validate required fields**
- `firstname` must exist
- `grecale_version` must exist

**Node 8 — Webhook POST: Darwin AI outbound message**
- **URL:** `https://api.getdarwin.ai/v1/thread/{phone}/messages/outbound`
- **Template params:** `[firstname, grecale_version]`
- **Template ID:** `24215901201441410`
- **Pipeline:** `6278`

**Node 9 — Code Python: Get current date/time (UTC-3)**
```python
output = {
    'date': current_date,   # YYYY-MM-DD
    'time': current_time    # HH:MM:SS
}
```

**Node 10 — Google Sheets: Log outbound**
- Sheet: `Maserati - Mensaje outbound`
- Tab: `Outbound AI Message`
- Columns: phone, email, date, time

---

### Path B — Other Models

**Node 11 — Webhook POST: Darwin AI outbound message**
- Same endpoint and pipeline as Path A
- **Template params:** `[firstname, bi_modelo_version_v2]`

**Node 12 — Code Python: Get current date/time** *(same as Node 9)*

**Node 13 — Google Sheets: Log outbound** *(same sheet as Node 10)*

---

## Integrations

| Service | Purpose |
|---|---|
| HubSpot | Trigger + fetch contact properties |
| Darwin AI | Send outbound WhatsApp message |
| Google Sheets | Log outbound timestamp per contact |
