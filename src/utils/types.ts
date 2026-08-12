// ============================================================
// Entity types — mirror Laravel API Resource shapes
// ============================================================

export interface Event {
  id: number;
  name: string;
  description: string | null;
  csv_column_aliases?: Record<string, string>;
  registrations_count?: number;
  sessions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: number;
  event_id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  year_level: string;
  course: string;
  registered_at: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  event_id: number;
  name: string;
  start_time: string;
  end_time: string;
  attendances_count?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentInfo {
  student_id: string;
  first_name: string;
  last_name: string;
  year_level: string;
  course: string;
}

export interface Attendance {
  id: number;
  session_id: number;
  registration_id: number;
  recorded_at: string;
  student?: StudentInfo;
}

// ============================================================
// API response wrappers
// ============================================================

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================
// Scan result
// ============================================================

export interface ScanSuccess {
  status: "success";
  id: number;
  session_id: number;
  registration_id: number;
  recorded_at: string;
  student: StudentInfo;
  message: string;
}

export interface ScanNotFound {
  status: "not_found";
  message: string;
  student_id: string;
}

export interface ScanDuplicate {
  status: "duplicate";
  message: string;
  student_id: string;
  first_name: string;
  last_name: string;
  recorded_at: string;
}

export type ScanResult = ScanSuccess | ScanNotFound | ScanDuplicate;

// ============================================================
// CSV Import
// ============================================================

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface SkippedRow {
  row: number;
  student_id: string;
  reason: string;
}

export interface FailedRow {
  row: number;
  reason: string;
}

export interface ImportResponse {
  data: ImportResult;
  skipped_rows: SkippedRow[];
  failed_rows: FailedRow[];
}

/** Maps expected header names to 0-based CSV column indices (null = skip/unmapped). */
export type CsvHeaderMapping = Record<string, number | null>;

// ============================================================
// Report
// ============================================================

export interface ReportSession {
  id: number;
  name: string;
}

export interface ReportRow {
  student_id: string;
  first_name: string;
  last_name: string;
  year_level: string;
  course: string;
  attendance: Record<string, string | null>;
}

export interface SessionSummary {
  session: string;
  present: number;
  absent: number;
}

export interface ReportData {
  event: { id: number; name: string };
  sessions: ReportSession[];
  rows: ReportRow[];
  summary: {
    total_registered: number;
    per_session: SessionSummary[];
  };
}

// ============================================================
// Config
// ============================================================

export const YEAR_LEVELS = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "5th year",
] as const;

export const COURSES = [
  "BSCS",
  "BSIT",
  "BSBA",
  "BSA",
  "BSED",
  "BSN",
  "BSCRIM",
  "BSHM",
  "BSTM",
  "BSCE",
  "BSME",
  "BSEE",
  "BSMA",
] as const;