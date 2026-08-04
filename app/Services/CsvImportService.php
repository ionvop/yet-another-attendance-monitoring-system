<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CsvImportService
{
    private const REQUIRED_HEADERS = ['student id', 'first name', 'last name', 'year level', 'course'];

    public function import(Event $event, UploadedFile $file, string $mode = 'insert_only', array $columnMapping = []): array
    {
        $result = [
            'imported' => 0,
            'updated' => 0,
            'skipped' => 0,
            'failed' => 0,
            'skipped_rows' => [],
            'failed_rows' => [],
        ];

        // Validate that all required headers have a mapping
        foreach (self::REQUIRED_HEADERS as $header) {
            if (! isset($columnMapping[$header]) || $columnMapping[$header] === null) {
                return $result;
            }
        }

        $handle = fopen($file->getRealPath(), 'r');
        if (! $handle) {
            return $result;
        }

        // Skip header row
        fgetcsv($handle);

        $rowNumber = 1; // header is row 1, data starts at row 2

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;

            // Skip empty rows
            if (count($row) <= 1 && empty(trim(implode('', $row)))) {
                continue;
            }

            $data = $this->mapRow($row, $columnMapping);

            // Validate the row
            $validator = Validator::make($data, $this->validationRules($event));

            if ($validator->fails()) {
                $result['failed']++;
                $result['failed_rows'][] = [
                    'row' => $rowNumber,
                    'reason' => implode('; ', $validator->errors()->all()),
                ];
                continue;
            }

            $validated = $validator->validated();

            // Check for existing registration
            $existing = Registration::query()
                ->where('event_id', $event->id)
                ->where('student_id', $validated['student_id'])
                ->first();

            if ($existing) {
                if ($mode === 'upsert') {
                    $existing->update($validated);
                    $result['updated']++;
                } else {
                    $result['skipped']++;
                    $result['skipped_rows'][] = [
                        'row' => $rowNumber,
                        'student_id' => $validated['student_id'],
                        'reason' => 'Duplicate student_id for this event',
                    ];
                }
            } else {
                $event->registrations()->create($validated);
                $result['imported']++;
            }
        }

        fclose($handle);

        return $result;
    }

    private function mapRow(array $row, array $columnMapping): array
    {
        $get = fn (string $header) => isset($columnMapping[$header]) && $columnMapping[$header] !== null
            ? ($row[$columnMapping[$header]] ?? null)
            : null;

        $registeredAt = $get('timestamp');
        if ($registeredAt && ($ts = strtotime($registeredAt))) {
            $registeredAt = date('Y-m-d H:i:s', $ts);
        }

        return [
            'student_id' => trim($get('student id') ?? ''),
            'first_name' => trim($get('first name') ?? ''),
            'last_name' => trim($get('last name') ?? ''),
            'year_level' => trim($get('year level') ?? ''),
            'course' => trim($get('course') ?? ''),
            'registered_at' => $registeredAt ?: now()->toDateTimeString(),
        ];
    }

    private function validationRules(Event $event): array
    {
        return [
            'student_id' => [
                'required',
                'string',
                'max:50',
                'regex:/^\d+$/',
            ],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'year_level' => ['required', 'string', Rule::in(config('attendance.year_levels'))],
            'course' => ['required', 'string', Rule::in(config('attendance.courses'))],
            'registered_at' => ['nullable', 'date'],
        ];
    }
}