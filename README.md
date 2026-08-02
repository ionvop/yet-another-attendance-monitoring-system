# Attendance Monitoring System

A local-first, single-machine attendance monitoring system built with **Laravel** (backend) and **React + TypeScript** (frontend). Designed to handle the full lifecycle of event-based attendance tracking: registration import, barcode scanning, session management, and report generation.

---

## Workflow

### 1. Initialization — Create an Event
Every registration and attendance record belongs to an event. Create or select an event to get started. The system is reusable across multiple events.

### 2. Registration — Import Student Data
Students register via a Google Form. Once the form closes, the results are sanitized, downloaded as a CSV, and uploaded into the system.

- **Bulk CSV import** with validation and duplicate detection
- **Manual CRUD** for correcting typos, removing false entries, or adding walk-ins during the sanity-check phase

CSV columns (header row required): `Timestamp, Student ID, First Name, Last Name, Year Level, Course`

### 3. Attendance — Barcode Scanning
Students scan their ID barcodes using the device camera. The system decodes the barcode, looks up the student, and records attendance in real time.

- Each event can have **multiple sessions** (e.g. Morning/Afternoon, Entrance/Exit)
- A student can only be recorded **once per session**
- Visual feedback: "Welcome, John Doe" on success, "Not registered" on failure, "Already recorded" on duplicate

### 4. Results — Generate Reports
View attendance summaries in-app and export them as **Excel (.xlsx)** files with per-session present/absent breakdowns.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Laravel 11, PHP 8.3+ |
| **Frontend** | React 19, TypeScript |
| **Routing** | React Router v7 |
| **Styling** | Tailwind CSS v4, shadcn/ui, Radix UI |
| **Build** | Vite 8 with laravel-vite-plugin |
| **Barcode Scanning** | @undecaf/zbar-wasm (WebAssembly) |
| **Excel Export** | maatwebsite/excel (Laravel Excel) |
| **Testing** | Pest PHP |
| **Notifications** | sonner (toast library) |
| **Icons** | lucide-react |

---

## Data Model

```
Event
 ├── has many → Registration (student_id, first_name, last_name, year_level, course)
 │                └── has many → Attendance (recorded_at)
 └── has many → EventSession (name, start_time, end_time)
                  └── has many → Attendance (recorded_at)
```

- **Event** — Top-level container (e.g. "Orientation 2026")
- **Registration** — One student registration per event, unique on `(event_id, student_id)`
- **EventSession** — A time window within an event (e.g. "Morning", "Afternoon")
- **Attendance** — Links a registration to a session with a timestamp; unique on `(session_id, registration_id)`

---

## API Endpoints

All endpoints are prefixed with `/api/v1`. See [`docs/api-specs.md`](docs/api-specs.md) for full request/response schemas.

### Events
| Method | Path | Description |
|---|---|---|
| `GET` | `/events` | List all events |
| `POST` | `/events` | Create an event |
| `GET` | `/events/{event}` | Get event details |
| `PUT` | `/events/{event}` | Update an event |
| `DELETE` | `/events/{event}` | Delete event (cascades) |

### Registrations
| Method | Path | Description |
|---|---|---|
| `GET` | `/events/{event}/registrations` | List registrations |
| `POST` | `/events/{event}/registrations` | Manually add a registration |
| `POST` | `/events/{event}/registrations/import` | Bulk CSV import |
| `GET` | `/events/{event}/registrations/{registration}` | Show a registration |
| `PUT` | `/events/{event}/registrations/{registration}` | Edit a registration |
| `DELETE` | `/events/{event}/registrations/{registration}` | Delete a registration |

### Sessions
| Method | Path | Description |
|---|---|---|
| `GET` | `/events/{event}/sessions` | List sessions |
| `POST` | `/events/{event}/sessions` | Create a session |
| `GET` | `/events/{event}/sessions/{session}` | Show a session |
| `PUT` | `/events/{event}/sessions/{session}` | Update a session |
| `DELETE` | `/events/{event}/sessions/{session}` | Delete session (cascades) |

### Attendance
| Method | Path | Description |
|---|---|---|
| `POST` | `/sessions/{session}/attendances/scan` | Scan barcode & record attendance |
| `GET` | `/sessions/{session}/attendances` | List attendance records |
| `DELETE` | `/sessions/{session}/attendances/{attendance}` | Remove an attendance record |

### Reports
| Method | Path | Description |
|---|---|---|
| `GET` | `/events/{event}/reports/attendance` | JSON attendance summary |
| `GET` | `/events/{event}/reports/attendance/export` | Download Excel report |

---

## Getting Started

### Prerequisites
- PHP 8.3+
- [Composer](https://getcomposer.org/)
- Node.js 18+
- SQLite (default) or MySQL/PostgreSQL

### Installation

```bash
# Clone and install dependencies
composer install
npm install

# Set up environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate
```

### Development

Run the development server:

```bash
# Build frontend assets
npm run build

# Run development server
php artisan serve

# The system is now accessible at http://localhost:8000
```

---

## Frontend Routes

| Path | Page |
|---|---|
| `/` | Events list |
| `/events/new` | Create event |
| `/events/:eventId` | Event dashboard |
| `/events/:eventId/edit` | Edit event |
| `/events/:eventId/registrations` | Registration list + CSV import |
| `/events/:eventId/registrations/new` | Add registration manually |
| `/events/:eventId/registrations/:registrationId/edit` | Edit registration |
| `/events/:eventId/sessions` | Session list |
| `/events/:eventId/sessions/new` | Create session |
| `/events/:eventId/sessions/:sessionId/edit` | Edit session |
| `/events/:eventId/sessions/:sessionId/scan` | Barcode attendance scanner |
| `/events/:eventId/sessions/:sessionId/attendances` | Attendance records for session |
| `/events/:eventId/reports` | Attendance reports & export |

---

## Project Structure

```
├── app/
│   ├── Exports/          # Excel export classes (maatwebsite/excel)
│   ├── Http/
│   │   ├── Controllers/  # API controllers
│   │   ├── Requests/     # Form request validation
│   │   └── Resources/    # API resource transformers
│   ├── Models/           # Eloquent models
│   ├── Providers/        # Service providers
│   └── Services/         # Business logic (CSV import, etc.)
├── database/
│   ├── factories/        # Model factories (Pest/Faker)
│   ├── migrations/       # Database migrations
│   └── seeders/          # Database seeders
├── routes/
│   ├── api.php           # API route definitions
│   └── web.php           # Web routes (serves the SPA)
├── src/                  # React frontend source
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions & API client
│   ├── pages/            # Page components (one per route)
│   └── utils/            # Helper utilities
├── resources/
│   ├── css/              # Stylesheets
│   └── views/            # Blade templates (SPA shell)
└── tests/                # Pest PHP tests
    ├── Feature/          # Feature/integration tests
    └── Unit/             # Unit tests
```

---

## Testing

```bash
php artisan test
```

Uses [Pest PHP](https://pestphp.com/) for elegant, readable tests. Run specific test files:

```bash
php artisan test --filter=EventTest
```

---

## License

This project is open-source software.
