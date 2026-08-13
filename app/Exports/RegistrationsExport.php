<?php

namespace App\Exports;

use App\Models\Event;
use App\Models\Registration;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class RegistrationsExport implements FromArray, WithHeadings, ShouldAutoSize
{
    public function __construct(
        private Event $event,
        private array $filters = [],
    ) {}

    public function headings(): array
    {
        return ['Student ID', 'First Name', 'Last Name', 'Year Level', 'Course', 'Registered'];
    }

    public function array(): array
    {
        $filters = $this->filters;

        $registrations = Registration::query()
            ->where('event_id', $this->event->id)
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('student_id', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($filters['year_level'] ?? null, fn ($q, $yl) => $q->where('year_level', $yl))
            ->when($filters['course'] ?? null, fn ($q, $c) => $q->where('course', $c))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return $registrations->map(function ($registration) {
            return [
                $registration->student_id,
                $registration->first_name,
                $registration->last_name,
                $registration->year_level,
                $registration->course,
                $registration->registered_at?->format('Y-m-d H:i:s'),
            ];
        })->toArray();
    }
}
