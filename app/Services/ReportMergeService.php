<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

class ReportMergeService
{
    private const BASE_HEADERS = ['Student ID', 'First Name', 'Last Name', 'Year Level', 'Course'];

    /**
     * Merge multiple per-device attendance report .xlsx files into a single
     * normalized dataset.
     *
     * Each exported report already contains the full roster (registrations
     * joined with attendances), so merging is a union of "present" marks keyed
     * by student_id per session. Rows are unioned by student_id so roster
     * drift between devices is preserved.
     *
     * @param  UploadedFile[]  $files
     * @return array{sessions: string[], rows: array<int, array<string, mixed>>}
     */
    public function merge(array $files): array
    {
        if (count($files) < 2) {
            throw new RuntimeException('At least two report files are required to merge.');
        }

        $sessions = null;
        $rowsByStudent = [];

        foreach ($files as $file) {
            [$fileSessions, $fileRows] = $this->readReport($file);

            if ($sessions === null) {
                $sessions = $fileSessions;
            } elseif ($fileSessions !== $sessions) {
                throw new RuntimeException(
                    'Report files have mismatched session columns. Ensure all devices exported reports for the same sessions.'
                );
            }

            foreach ($fileRows as $row) {
                $studentId = $row['student_id'];

                if (! isset($rowsByStudent[$studentId])) {
                    $rowsByStudent[$studentId] = [
                        'student_id' => $studentId,
                        'first_name' => $row['first_name'],
                        'last_name' => $row['last_name'],
                        'year_level' => $row['year_level'],
                        'course' => $row['course'],
                        'attendance' => $row['attendance'],
                    ];
                    continue;
                }

                // Union present marks: keep earliest timestamp per session.
                foreach ($row['attendance'] as $session => $timestamp) {
                    $existing = $rowsByStudent[$studentId]['attendance'][$session] ?? null;
                    if ($timestamp !== null && ($existing === null || $timestamp < $existing)) {
                        $rowsByStudent[$studentId]['attendance'][$session] = $timestamp;
                    }
                }
            }
        }

        // Sort rows by last name then first name for a stable, readable report.
        uasort($rowsByStudent, function ($a, $b) {
            return [$a['last_name'], $a['first_name']] <=> [$b['last_name'], $b['first_name']];
        });

        return [
            'sessions' => $sessions ?? [],
            'rows' => array_values($rowsByStudent),
        ];
    }

    /**
     * Read the first sheet of a report file into a normalized structure.
     *
     * @return array{0: string[], 1: array<int, array<string, mixed>>}
     */
    private function readReport(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getSheet(0);
        $rows = $sheet->toArray(null, true, true, true);

        if (count($rows) < 2) {
            throw new RuntimeException("Report file '{$file->getClientOriginalName()}' has no data rows.");
        }

        $header = array_values($rows[1]);
        $baseCount = count(self::BASE_HEADERS);

        // Validate the base columns are present in the expected order.
        foreach (self::BASE_HEADERS as $i => $expected) {
            if (($header[$i] ?? null) !== $expected) {
                throw new RuntimeException(
                    "Report file '{$file->getClientOriginalName()}' is not a valid attendance report (missing '{$expected}' column)."
                );
            }
        }

        $sessions = array_slice($header, $baseCount);
        $sessions = array_values(array_filter($sessions, fn ($s) => $s !== null && $s !== ''));

        $dataRows = [];
        foreach (array_slice($rows, 1) as $row) {
            $values = array_values($row);

            $studentId = trim((string) ($values[0] ?? ''));
            if ($studentId === '') {
                continue;
            }

            $attendance = [];
            foreach ($sessions as $i => $session) {
                $cell = $values[$baseCount + $i] ?? null;
                $attendance[$session] = $this->parseTimestamp($cell);
            }

            $dataRows[] = [
                'student_id' => $studentId,
                'first_name' => trim((string) ($values[1] ?? '')),
                'last_name' => trim((string) ($values[2] ?? '')),
                'year_level' => trim((string) ($values[3] ?? '')),
                'course' => trim((string) ($values[4] ?? '')),
                'attendance' => $attendance,
            ];
        }

        return [$sessions, $dataRows];
    }

    /**
     * Convert a cell value to an ISO-8601 timestamp string, or null if absent.
     */
    private function parseTimestamp(mixed $cell): ?string
    {
        if ($cell === null || $cell === '') {
            return null;
        }

        // "Absent" is the marker used by the detail sheet for no attendance.
        if (is_string($cell) && strtolower(trim($cell)) === 'absent') {
            return null;
        }

        if ($cell instanceof \DateTimeInterface) {
            return $cell->format('Y-m-d H:i:s');
        }

        $value = trim((string) $cell);
        if ($value === '') {
            return null;
        }

        // PhpSpreadsheet may return an Excel serial date number.
        if (is_numeric($value)) {
            $timestamp = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject((float) $value);
            return $timestamp->format('Y-m-d H:i:s');
        }

        $parsed = strtotime($value);
        if ($parsed === false) {
            return null;
        }

        return date('Y-m-d H:i:s', $parsed);
    }
}
