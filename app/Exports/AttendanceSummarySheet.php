<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class AttendanceSummarySheet implements FromArray, WithHeadings, WithTitle, ShouldAutoSize
{
    public function __construct(
        private string $eventName,
        private Collection $sessions,
        private Collection $registrations,
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
        return $this->sessions->map(function ($session) {
            $present = $this->registrations->filter(
                fn ($r) => $r->attendances->contains('session_id', $session->id)
            )->count();

            return [
                $session->name,
                $present,
                $this->registrations->count() - $present,
                $this->registrations->count(),
            ];
        })->toArray();
    }
}