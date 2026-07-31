<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class AttendanceDetailSheet implements FromArray, WithHeadings, WithTitle, ShouldAutoSize
{
    public function __construct(
        private string $eventName,
        private Collection $sessions,
        private Collection $registrations,
    ) {}

    public function title(): string
    {
        return 'Attendance';
    }

    public function headings(): array
    {
        $base = ['Student ID', 'First Name', 'Last Name', 'Year Level', 'Course'];
        foreach ($this->sessions as $session) {
            $base[] = $session->name;
        }

        return $base;
    }

    public function array(): array
    {
        return $this->registrations->map(function ($registration) {
            $row = [
                $registration->student_id,
                $registration->first_name,
                $registration->last_name,
                $registration->year_level,
                $registration->course,
            ];

            foreach ($this->sessions as $session) {
                $record = $registration->attendances->firstWhere('session_id', $session->id);
                $row[] = $record ? $record->recorded_at->format('Y-m-d H:i:s') : 'Absent';
            }

            return $row;
        })->toArray();
    }
}