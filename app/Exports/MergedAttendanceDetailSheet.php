<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class MergedAttendanceDetailSheet implements FromArray, WithHeadings, WithTitle, ShouldAutoSize
{
    /**
     * @param  string[]  $sessions
     * @param  array<int, array<string, mixed>>  $rows
     */
    public function __construct(
        private string $eventName,
        private array $sessions,
        private array $rows,
    ) {}

    public function title(): string
    {
        return 'Attendance';
    }

    public function headings(): array
    {
        return array_merge(
            ['Student ID', 'First Name', 'Last Name', 'Year Level', 'Course'],
            $this->sessions
        );
    }

    public function array(): array
    {
        return array_map(function ($row) {
            $line = [
                $row['student_id'],
                $row['first_name'],
                $row['last_name'],
                $row['year_level'],
                $row['course'],
            ];

            foreach ($this->sessions as $session) {
                $line[] = $row['attendance'][$session] ?? 'Absent';
            }

            return $line;
        }, $this->rows);
    }
}
