# Create New Contact in HubSpot

Zapier workflow triggered by Darwin AI when a session is forwarded. It processes the lead data, normalizes the seller, formats the phone and email, and creates or updates the contact in HubSpot. Handles both inbound and outbound leads through a branching path.

---

## Flow

```
[1] Trigger — Darwin AI (Session Forwarded)
           ↓
[2] Filter — Only Inbound leads
           ↓
[3] Code JS — Map seller name → HubSpot owner ID
           ↓
[4] Formatter — Force email (fallback: threadId@gmail.com)
           ↓
[5] Code Python — Map brand → Grecale
           ↓
[6] Code Python — Format phone (remove 3rd digit)
           ↓
[7] Branch
    ├── Path A: outbound
    │     ↓
    │   [8] Google Sheets — Lookup outbound message by phone
    │     ↓
    │   [9] Google Sheets — Lookup human first message by phone
    │     ↓
    │   [10] Code Python — Calculate time difference (treated on time?)
    │     ↓
    │   [11] HubSpot — Create or Update Contact
    │
    └── Path B: inbound
          ↓
        [12] HubSpot — Create or Update Contact
```

---

## Nodes

### Node 1 — Trigger: Darwin AI (Session Forwarded)
- **App:** Darwin AI (App198639CLIAPI v1.7.0)
- **Event:** Session forwarded / qualified
- **Output fields used:**
  - `data.type` — inbound or outbound
  - `data.smartFields.nombre` — contact first name
  - `data.smartFields.correo` — contact email
  - `data.smartFields.ciudad` — contact city
  - `data.smartFields.product suggested` — car model
  - `data.conversationThreadId` — WhatsApp phone number
  - `data.forwardedToName` — seller name

---

### Node 2 — Filter: Inbound Only
- **Condition:** `data.type` equals `inbound` (case insensitive)
- Only inbound leads continue past this point

---

### Node 3 — Code JS: Map Seller → HubSpot Owner ID
Maps the seller name to a HubSpot numeric owner ID.

```js
const nameToNumberMap = {
  "felipe puente": 81887479,
  "jose omar nuño osorio": 81911048,
  "miguel flores": 77390458,
  "alberto gamez": 81906643,
  "maximiliano vera": 82603610,
  "edson alvarez": 86872105
};
```

> Currently forced to Edson Alvarez (ID `86872105`) regardless of input.

---

### Node 4 — Formatter: Force Email
- **Transform:** Default Value
- If `correo` (email) is empty, uses `{threadId}@gmail.com` as fallback

---

### Node 5 — Code Python: Map Brand → Grecale
```python
if brand.upper() in ["GRECALE", "GRECALE TROFEO", "GRECALE MODERNA"]:
    output = {'result': 'Grecale'}
else:
    output = {'result': ''}
```

---

### Node 6 — Code Python: Format Phone Number
Removes the 3rd digit from the phone number received from Darwin AI.
```python
modified_phone = phone[:2] + phone[3:]
```

---

### Node 7 — Branch
Splits the flow based on `data.type`:
- **Path A:** `outbound`
- **Path B:** `inbound`

---

### Path A — Outbound

**Node 8 — Google Sheets: Lookup Outbound Message**
- Sheet: `Maserati - Mensaje outbound`
- Tab: `Outbound AI Message`
- Lookup by: formatted phone number

**Node 9 — Google Sheets: Lookup Human First Message**
- Sheet: `Maserati - Mensaje outbound`
- Tab: `Human's first message`
- Lookup by: original `conversationThreadId`

**Node 10 — Code Python: Calculate Response Time**
Compares outbound send time vs human first reply time.
```python
if time_difference <= 10:
    output = {'result': 'true'}   # lead treated on time
else:
    output = {'result': 'false'}
```

**Node 11 — HubSpot: Create or Update Contact**

| HubSpot field | Value |
|---|---|
| `firstname` | `data.smartFields.nombre` |
| `email` | forced email |
| `city` | `data.smartFields.ciudad` |
| `hs_whatsapp_phone_number` | `conversationThreadId` |
| `hubspot_owner_id` | mapped seller ID |
| `lead_tratado_a_tiempo` | `true` / `false` |
| `gfmarca` | `Maserati` |

---

### Path B — Inbound

**Node 12 — HubSpot: Create or Update Contact**
Same fields as Node 11 but without `lead_tratado_a_tiempo` calculation.
