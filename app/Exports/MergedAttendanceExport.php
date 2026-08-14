<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class MergedAttendanceExport implements WithMultipleSheets
{
    use Exportable;

    /**
     * @param  string[]  $sessions
     * @param  array<int, array<string, mixed>>  $rows
     */
    public function __construct(
        private string $eventName,
        private array $sessions,
        private array $rows,
    ) {}

    public function sheets(): array
    {
        return [
            new MergedAttendanceDetailSheet($this->eventName, $this->sessions, $this->rows),
            new MergedAttendanceSummarySheet($this->eventName, $this->sessions, $this->rows),
        ];
    }
}
