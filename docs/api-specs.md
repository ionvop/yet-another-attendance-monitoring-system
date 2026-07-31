# Attendance Monitoring System — API Specification

**Stack:** Laravel (backend), NativePHP (desktop shell), local-first, single-machine use.

**Base URL:** `http://localhost/api/v1` (adjust per NativePHP's local server port)

**Auth:** Not required for v1, since NativePHP runs as a single-user local desktop app. If multi-user/shared-device support is added later, insert Sanctum-based auth in front of these routes without changing the shapes below.

**Content type:** `application/json` for all requests/responses except CSV import (`multipart/form-data`) and report export (binary file download).

---

## 1. Conventions

### 1.1 Standard success envelope

```json
{
  "data": { ... },
  "meta": { ... }   // optional, e.g. pagination
}
```

### 1.2 Standard error envelope

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": ["Human readable reason."]
  }
}
```

### 1.3 HTTP status codes used

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content (delete) |
| 404 | Not found |
| 409 | Conflict (duplicate / unique constraint) |
| 422 | Validation error |
| 500 | Server error |

### 1.4 Pagination

List endpoints accept `?page=` and `?per_page=` (default 25, max 100) and return:

```json
"meta": {
  "current_page": 1,
  "per_page": 25,
  "total": 120,
  "last_page": 5
}
```

---

## 2. Events — Initialization Phase

Events are the top-level container. Every registration, session, and attendance record belongs to exactly one event.

### `GET /events`
List all events, most recently created first.

**Query params:** `search` (matches `name`), `page`, `per_page`

**Response 200**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Orientation",
      "description": "Orientation of new students",
      "registrations_count": 320,
      "sessions_count": 2,
      "created_at": "2026-07-01T08:00:00Z",
      "updated_at": "2026-07-01T08:00:00Z"
    }
  ],
  "meta": { "current_page": 1, "per_page": 25, "total": 1, "last_page": 1 }
}
```

### `POST /events`
Create a new event.

**Body**
```json
{ "name": "Orientation", "description": "Orientation of new students" }
```

**Validation:** `name` required, string, max 255. `description` optional, string.

**Response 201** — the created event object.

### `GET /events/{event}`
Fetch a single event with summary counts (as shown above).

**Response 404** if event doesn't exist.

### `PUT /events/{event}`
Update `name` and/or `description`. Same validation as create.

### `DELETE /events/{event}`
Deletes the event **and cascades** to its registrations, sessions, and attendances. Recommend a confirmation step in the UI since this is destructive.

**Response 204**

---

## 3. Registrations — Registration Phase

Registrations are populated from the sanitized CSV export of the Google Form, scoped to one event. Manual add/edit is also supported for handling the "sanity check" cleanup step directly in-app instead of re-editing the CSV.

### 3.1 CSV Import

### `POST /events/{event}/registrations/import`
Uploads the sanitized CSV and bulk-inserts registrations for the event.

**Body:** `multipart/form-data`
| Field | Type | Notes |
|---|---|---|
| `file` | file | `.csv`, max 5MB |
| `mode` | string | `"insert_only"` (default) or `"upsert"` — see below |

**Expected CSV columns** (header row required, order-independent, matched by header name):
```
Timestamp, Student ID, First Name, Last Name, Year Level, Course
```

**Behavior:**
- Row-by-row validation (see 3.3 rules).
- `mode=insert_only`: rows whose `student_id` already exists for this event are skipped and reported as conflicts (does not overwrite).
- `mode=upsert`: existing `student_id` rows for this event are updated instead of skipped.
- The whole import runs in a DB transaction only for the parse/validate step; valid rows are inserted even if some rows fail, so one bad row doesn't block the rest — failures are collected and returned for the user to fix and re-upload as a small correction CSV, or fix manually via 3.4.

**Response 200**
```json
{
  "data": {
    "imported": 312,
    "updated": 0,
    "skipped": 8,
    "failed": 2
  },
  "skipped_rows": [
    { "row": 15, "student_id": "123456", "reason": "Duplicate student_id for this event" }
  ],
  "failed_rows": [
    { "row": 42, "reason": "year_level is required" }
  ]
}
```

**Response 422** if the file itself is missing/invalid format (no header row, wrong file type, etc.) before any row processing happens.

### 3.2 CRUD (manual sanity-check corrections)

### `GET /events/{event}/registrations`
List registrations for an event.

**Query params:**
- `search` — matches `student_id`, `first_name`, or `last_name`
- `year_level`, `course` — exact filters
- `page`, `per_page`

**Response 200**
```json
{
  "data": [
    {
      "id": 10,
      "event_id": 1,
      "student_id": "123456",
      "first_name": "John",
      "last_name": "Doe",
      "year_level": "1st year",
      "course": "BSCS",
      "registered_at": "2026-06-20T10:15:00Z",
      "created_at": "2026-06-25T09:00:00Z",
      "updated_at": "2026-06-25T09:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### `POST /events/{event}/registrations`
Manually add a single registration (e.g. a student missed the form deadline but organizers allow a walk-in add).

**Body**
```json
{
  "student_id": "123456",
  "first_name": "John",
  "last_name": "Doe",
  "year_level": "1st year",
  "course": "BSCS",
  "registered_at": "2026-06-20T10:15:00Z"
}
```

`registered_at` optional — defaults to now if omitted.

**Response 201** — created registration.
**Response 409** if `(event_id, student_id)` already exists.

### `GET /events/{event}/registrations/{registration}`
Fetch a single registration.

### `PUT /events/{event}/registrations/{registration}`
Edit a registration (typo fixes during sanity check). Same validation as create, excluding itself from the uniqueness check.

### `DELETE /events/{event}/registrations/{registration}`
Remove a duplicate/false entry found during sanity check.

**Note:** if attendances already reference this registration, either block deletion with a 409 ("Cannot delete: attendance already recorded for this student") or require `?force=true` to cascade-delete the attendance too — recommend blocking by default so a scanned attendance is never silently lost.

### 3.3 Validation rules (shared by import + manual create/edit)

| Field | Rule |
|---|---|
| `student_id` | required, string, matches expected institutional ID format (e.g. digits only), unique per `event_id` |
| `first_name` | required, string, max 255 |
| `last_name` | required, string, max 255 |
| `year_level` | required, one of the configured dropdown values |
| `course` | required, one of the configured dropdown values |
| `registered_at` | optional, valid datetime |

---

## 4. Sessions

A session represents one scan window within an event (e.g. "Morning", "Afternoon", "Entrance", "Exit").

### `GET /events/{event}/sessions`
List sessions for an event, ordered by `start_time`.

### `POST /events/{event}/sessions`
**Body**
```json
{
  "name": "Morning",
  "start_time": "2026-08-01T07:00:00Z",
  "end_time": "2026-08-01T12:00:00Z"
}
```

**Validation:** `name` required, unique per `event_id`. `start_time` required datetime. `end_time` required, must be after `start_time`.

**Response 201**

### `GET /events/{event}/sessions/{session}`
Fetch a session, including `attendances_count`.

### `PUT /events/{event}/sessions/{session}`
Update name/time window. Same validation as create.

### `DELETE /events/{event}/sessions/{session}`
Cascades to that session's attendances only (other sessions in the event are unaffected).

---

## 5. Attendance — Attendance Phase

This is the scanning workflow. The frontend/NativePHP camera layer decodes the barcode into a plain student ID string and calls a single endpoint per scan; the backend does the lookup, session-scoped duplicate check, and recording in one round trip so the UI can show "Welcome, ..." or "not registered" immediately.

### `POST /sessions/{session}/attendances/scan`
**Body**
```json
{ "student_id": "123456" }
```

**Behavior:**
1. Look up `registrations` where `event_id = session.event_id AND student_id = :student_id`.
2. If not found → `404`, response body signals "not registered" so the UI shows that message.
3. If found, check `attendances` for `(session_id, registration_id)`:
   - If it already exists → `409`, response indicates already recorded (with the original `recorded_at`) so the UI can show a distinct "already scanned" message rather than a generic error, or you can choose to treat this as a soft-success and just re-show the welcome message — pick one for the UI and keep it consistent.
   - If it doesn't exist → create the attendance row with `recorded_at = now()` and return `201`.

**Response 201 (success — new attendance recorded)**
```json
{
  "data": {
    "id": 501,
    "session_id": 3,
    "registration_id": 10,
    "recorded_at": "2026-08-01T07:32:10Z",
    "student": {
      "student_id": "123456",
      "first_name": "John",
      "last_name": "Doe",
      "year_level": "1st year",
      "course": "BSCS"
    }
  },
  "message": "Welcome, John Doe"
}
```

**Response 404 (not registered)**
```json
{
  "message": "This student ID number is not registered.",
  "student_id": "123456"
}
```

**Response 409 (duplicate scan within this session)**
```json
{
  "message": "Attendance already recorded for this session.",
  "data": {
    "student_id": "123456",
    "first_name": "John",
    "last_name": "Doe",
    "recorded_at": "2026-08-01T07:32:10Z"
  }
}
```

**Validation:** `student_id` required, string.

### `GET /sessions/{session}/attendances`
List attendance records for a session, joined with student info. Used for a live "who's checked in" view if needed.

**Query params:** `search` (student_id/name), `page`, `per_page`

**Response 200**
```json
{
  "data": [
    {
      "id": 501,
      "session_id": 3,
      "recorded_at": "2026-08-01T07:32:10Z",
      "student": {
        "student_id": "123456",
        "first_name": "John",
        "last_name": "Doe",
        "year_level": "1st year",
        "course": "BSCS"
      }
    }
  ],
  "meta": { ... }
}
```

### `DELETE /sessions/{session}/attendances/{attendance}`
Manual correction path for when staff need to un-record a mis-scan (e.g. wrong barcode scanned by accident). Not part of the normal flow but necessary for operational error recovery.

**Response 204**

---

## 6. Reports — Results Phase

### `GET /events/{event}/reports/attendance`
Returns a JSON summary — one row per registered student, with a present/absent flag per session. Useful for an in-app preview before exporting.

**Query params:** `session_ids[]` (optional filter, defaults to all sessions of the event)

**Response 200**
```json
{
  "data": {
    "event": { "id": 1, "name": "Orientation" },
    "sessions": [
      { "id": 3, "name": "Morning" },
      { "id": 4, "name": "Afternoon" }
    ],
    "rows": [
      {
        "student_id": "123456",
        "first_name": "John",
        "last_name": "Doe",
        "year_level": "1st year",
        "course": "BSCS",
        "attendance": {
          "Morning": "2026-08-01T07:32:10Z",
          "Afternoon": null
        }
      }
    ],
    "summary": {
      "total_registered": 320,
      "per_session": [
        { "session": "Morning", "present": 298, "absent": 22 },
        { "session": "Afternoon", "present": 275, "absent": 45 }
      ]
    }
  }
}
```

### `GET /events/{event}/reports/attendance/export`
Generates and streams an `.xlsx` file of the same data (one sheet, one column per session, plus a summary sheet). Suggested filename: `attendance-{event-name}-{date}.xlsx`.

**Query params:** same `session_ids[]` filter as above.

**Response 200** — binary, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, with `Content-Disposition: attachment; filename="..."`.

---

## 7. Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/events` | List events |
| POST | `/events` | Create event |
| GET | `/events/{event}` | Show event |
| PUT | `/events/{event}` | Update event |
| DELETE | `/events/{event}` | Delete event (cascades) |
| POST | `/events/{event}/registrations/import` | Bulk import CSV |
| GET | `/events/{event}/registrations` | List registrations |
| POST | `/events/{event}/registrations` | Manual add |
| GET | `/events/{event}/registrations/{registration}` | Show registration |
| PUT | `/events/{event}/registrations/{registration}` | Edit registration |
| DELETE | `/events/{event}/registrations/{registration}` | Delete registration |
| GET | `/events/{event}/sessions` | List sessions |
| POST | `/events/{event}/sessions` | Create session |
| GET | `/events/{event}/sessions/{session}` | Show session |
| PUT | `/events/{event}/sessions/{session}` | Update session |
| DELETE | `/events/{event}/sessions/{session}` | Delete session (cascades) |
| POST | `/sessions/{session}/attendances/scan` | Scan barcode → lookup + record |
| GET | `/sessions/{session}/attendances` | List attendance for a session |
| DELETE | `/sessions/{session}/attendances/{attendance}` | Remove a mis-scanned record |
| GET | `/events/{event}/reports/attendance` | JSON attendance report |
| GET | `/events/{event}/reports/attendance/export` | Export report as .xlsx |