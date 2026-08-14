<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class MergedAttendanceSummarySheet implements FromArray, WithHeadings, WithTitle, ShouldAutoSize
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
        return 'Summary';
    }

    public function headings(): array
    {
        return ['Session', 'Present', 'Absent', 'Total Registered'];
    }

    public function array(): array
    {
        $total = count($this->rows);

        return array_map(function ($session) use ($total) {
            $present = count(array_filter(
                $this->rows,
                fn ($row) => ($row['attendance'][$session] ?? null) !== null
            ));

            return [
                $session,
                $present,
                $total - $present,
                $total,
            ];
        }, $this->sessions);
    }
}
