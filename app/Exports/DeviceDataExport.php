<?php

namespace App\Exports;

use App\Models\Event;
use Illuminate\Support\Carbon;

/**
 * Serializes an event's registrations, sessions, and attendances into a
 * portable JSON structure intended for offline transfer between devices.
 *
 * Attendances reference sessions by NAME (not id), because auto-increment
 * session ids are not stable across devices. This lets the receiving device
 * resolve sessions semantically during a merge.
 *
 * The output shape is deliberately self-describing and idempotent, so the same
 * file can be merged more than once without creating duplicates.
 */
class DeviceDataExport
{
    public function __construct(
        private Event $event,
    ) {}

    public function toArray(): array
    {
        $this->event->load(['sessions', 'registrations.attendances']);

        return [
            'event' => [
                'name' => $this->event->name,
            ],
            'exported_at' => now()->toIso8601String(),
            'sessions' => $this->event->sessions->map(fn ($session) => [
                'name' => $session->name,
                'start_time' => $session->start_time?->toIso8601String(),
            ])->values()->all(),

            'registrations' => $this->event->registrations->map(fn ($registration) => [
                'student_id' => $registration->student_id,
                'first_name' => $registration->first_name,
                'last_name' => $registration->last_name,
                'year_level' => $registration->year_level,
                'course' => $registration->course,
                'registered_at' => $this->iso($registration->registered_at),
            ])->values()->all(),

            'attendances' => $this->event->registrations
                ->flatMap(fn ($registration) => $registration->attendances->map(fn ($attendance) => [
                    'student_id' => $registration->student_id,
                    'session' => $attendance->session?->name,
                    'recorded_at' => $this->iso($attendance->recorded_at),
                ]))
                ->values()
                ->all(),
        ];
    }

    public function toJson(): string
    {
        return json_encode($this->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    private function iso(Carbon|null $date): ?string
    {
        return $date?->toIso8601String();
    }
}
