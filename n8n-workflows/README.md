# Send Survey — NPS Response to HubSpot

n8n workflow that receives a patient NPS survey response (sent by Darwin AI via webhook) and updates the corresponding custom object in HubSpot with the rating, comment, and response date.

---

## Flow

```
[1] Webhook POST /encuestaboston
           ↓ (parallel)
  ┌────────┴────────┐
  ↓                 ↓
[2] Code JS        [3] Date & Time
  (map stars        (get current
  → HubSpot)        date)
  └────────┬────────┘
           ↓
       [4] Merge
           ↓
  [5] HTTP PATCH → HubSpot
```

---

## Nodes

### Node 1 — Webhook

- **Method:** POST
- **Path:** `encuestaboston`
- **Full URL:** `https://getdarwinai.app.n8n.cloud/webhook/encuestaboston`
- **Expected body:**

```json
{
  "comentario": "todo bien me gusto el tratamiento",
  "estrellas": "4",
  "idencuesta": "423401818360"
}
```

| Field | Type | Description |
|---|---|---|
| `comentario` | string | Free text from the patient |
| `estrellas` | string | Rating from 1 to 5 |
| `idencuesta` | string | HubSpot survey object ID |

---

### Node 2 — Code in JavaScript

Maps the star number to the corresponding HubSpot property name:

```js
for (const item of $input.all()) {
  const inputRating = item.json.body.estrellas;
  const mapping = {
    "1": "p__1_estrella",
    "2": "p__2_estrellas",
    "3": "p__3_estrellas",
    "4": "p__4_estrellas",
    "5": "p__5_estrellas"
  };
  item.json.hubspot_rating = mapping[inputRating] || "valor_no_valido";
}
return $input.all();
```

| Received value | HubSpot property |
|---|---|
| `"1"` | `p__1_estrella` |
| `"2"` | `p__2_estrellas` |
| `"3"` | `p__3_estrellas` |
| `"4"` | `p__4_estrellas` |
| `"5"` | `p__5_estrellas` |
| other | `valor_no_valido` |

---

### Node 3 — Date & Time

- Gets the current system date/time from n8n
- **Workflow timezone:** `America/Mexico_City`
- **Output:** `currentDate` — used in the HubSpot PATCH request

---

### Node 4 — Merge

- **Mode:** `combineAll` — combines the outputs of Node 2 (JS Code) and Node 3 (Date & Time) into a single item
- This ensures Node 5 has both `hubspot_rating` and `currentDate` available in the same item

---

### Node 5 — HTTP Request (PATCH to HubSpot)

- **Method:** PATCH
- **URL:** `https://api.hubapi.com/crm/v3/objects/2-198391026/{idencuesta}`
  - `2-198391026` = custom object ID for "Encuesta" in HubSpot
  - `{idencuesta}` = specific record ID, comes from the webhook body
- **Authentication:** Bearer Token — credential "Token Boston"
- **Request body:**

```json
{
  "properties": {
    "comentario_nps": "{{ $json.body.comentario }}",
    "valoracion_de_estrellas": "{{ $json.hubspot_rating }}",
    "estatusencuesta": "Respondida",
    "date_response": "{{ $json.currentDate }}"
  }
}
```

| HubSpot field | Value |
|---|---|
| `comentario_nps` | Patient comment text |
| `valoracion_de_estrellas` | Mapped property name (e.g. `p__4_estrellas`) |
| `estatusencuesta` | `"Respondida"` (hardcoded) |
| `date_response` | Current date/time (Mexico City) |
