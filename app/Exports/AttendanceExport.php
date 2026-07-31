<?php

namespace App\Exports;

use App\Models\Event;
use App\Models\EventSession;
use App\Models\Registration;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AttendanceExport implements WithMultipleSheets
{
    use Exportable;

    public function __construct(
        private Event $event,
        private array $sessionIds = [],
    ) {}

    public function sheets(): array
    {
        $sessions = EventSession::query()
            ->where('event_id', $this->event->id)
            ->when($this->sessionIds, fn ($q) => $q->whereIn('id', $this->sessionIds))
            ->orderBy('start_time')
            ->get();

        $registrations = Registration::query()
            ->where('event_id', $this->event->id)
            ->with(['attendances' => fn ($q) => $q->whereIn('session_id', $sessions->pluck('id'))])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return [
            new AttendanceDetailSheet($this->event->name, $sessions, $registrations),
            new AttendanceSummarySheet($this->event->name, $sessions, $registrations),
        ];
    }
}