<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Event;
use App\Models\EventSession;
use Illuminate\Support\Facades\DB;

/**
 * Merges device data (registrations, sessions, attendances) exported from
 * another device into the master device's event.
 *
 * Semantics:
 *  - Registrations: incoming student_id not found on the master is auto-created
 *    (handles walk-in registrations made on a non-master device). Existing ones
 *    are left untouched. Idempotent across repeated imports.
 *  - Sessions: an incoming session name that already exists on the master is
 *    matched automatically. A name that doesn't exist is a "conflict" the caller
 *    must resolve by supplying a session_mapping (create new OR map to an
 *    existing master session id). Session identity is the NAME, never the id,
 *    since auto-increment ids differ across devices.
 *  - Attendances: resolved by (incoming session name -> master session, student_id
 *    -> master registration). Inserted only if not already present (existing wins),
 *    keeping the merge idempotent.
 */
class DeviceDataMergeService
{
    public function preview(Event $event, array $payload): array
    {
        $existingByName = $event->sessions()->get()->keyBy('name');
        $incomingNames = collect($payload['sessions'] ?? [])->pluck('name');

        $alreadyExisting = $event->registrations()->pluck('student_id')->flip();

        $newRegistrations = collect($payload['registrations'] ?? [])
            ->filter(fn ($r) => ! $alreadyExisting->has((string) ($r['student_id'] ?? '')));

        $incomingSessions = $incomingNames->map(function ($name) use ($existingByName) {
            $existing = $existingByName->get($name);

            return [
                'name' => $name,
                'status' => $existing ? 'matched' : 'unmatched',
                'matched_to' => $existing ? $existing->id : null,
            ];
        })->values();

        // Total attendance rows that carry a session name present on the master
        // (either auto-matched or resolvable). Used just as an informational count.
        $attendancesApplicable = collect($payload['attendances'] ?? [])
            ->filter(fn ($a) => $existingByName->has((string) ($a['session'] ?? '')));

        return [
            'event' => ['id' => $event->id, 'name' => $event->name],
            'source_event_name' => $payload['event']['name'] ?? null,
            'exported_at' => $payload['exported_at'] ?? null,
            'total_registrations' => count($payload['registrations'] ?? []),
            'total_attendances' => count($payload['attendances'] ?? []),
            'sessions' => $incomingSessions,
            'new_registrations_count' => $newRegistrations->count(),
            'attendances_count' => $attendancesApplicable->count(),
            'conflicts' => $incomingSessions->where('status', 'unmatched')
                ->map(fn ($s) => ['session' => $s['name']])
                ->values(),
        ];
    }

    /**
     * @param array $payload decoded device export
     * @param array $mapping incoming session name => "create" | <master session id>
     */
    public function merge(Event $event, array $payload, array $mapping = []): array
    {
        return DB::transaction(function () use ($event, $payload, $mapping) {
            $result = [
                'registrations_created' => 0,
                'sessions_created' => 0,
                'attendances_created' => 0,
                'attendances_skipped' => 0,
                'errors' => [],
            ];

            [$sessionMap, $created] = $this->resolveSessions($event, $payload, $mapping);
            $result['sessions_created'] = $created;

            $registrationCreateCount = $this->unionRegistrations($event, $payload['registrations'] ?? []);
            $result['registrations_created'] = $registrationCreateCount;

            [$createdCount, $skippedCount, $errors] = $this->mergeAttendances($event, $payload['attendances'] ?? [], $sessionMap);
            $result['attendances_created'] = $createdCount;
            $result['attendances_skipped'] = $skippedCount;
            $result['errors'] = $errors;

            return $result;
        });
    }

    /**
     * Resolve each incoming session name to a master EventSession.
     * Returns [name => EventSession, sessionsCreated].
     */
    private function resolveSessions(Event $event, array $payload, array $mapping): array
    {
        $existing = $event->sessions()->get()->keyBy('name');

        $sessionMap = [];
        $created = 0;

        foreach ($payload['sessions'] ?? [] as $incoming) {
            $name = trim((string) ($incoming['name'] ?? ''));

            if ($name === '') {
                continue;
            }

            // Auto-match an existing session by name.
            if ($existing->has($name)) {
                $sessionMap[$name] = $existing->get($name);
                continue;
            }

            // Otherwise consult the manual mapping.
            $target = $mapping[$name] ?? null;

            if ($target === 'create') {
                $session = $event->sessions()->create([
                    'name' => $name,
                    'start_time' => $incoming['start_time'] ?? now(),
                    'end_time' => $incoming['end_time'] ?? now(),
                ]);
                $existing->put($name, $session);
                $sessionMap[$name] = $session;
                $created++;
                continue;
            }

            // Map to an existing master session id.
            if (is_numeric($target)) {
                $session = $event->sessions()->findOrFail((int) $target);
                $existing->put($name, $session);
                $sessionMap[$name] = $session;
                continue;
            }

            // No resolution provided: skip this session's attendances silently.
            $sessionMap[$name] = null;
        }

        return [$sessionMap, $created];
    }

    private function unionRegistrations(Event $event, array $incomingRegistrations): int
    {
        $existingById = $event->registrations()->pluck('id', 'student_id');

        $created = 0;
        foreach ($incomingRegistrations as $reg) {
            $studentId = trim((string) ($reg['student_id'] ?? ''));

            if ($studentId === '' || $existingById->has($studentId)) {
                continue;
            }

            $event->registrations()->create([
                'student_id' => $studentId,
                'first_name' => $reg['first_name'] ?? '',
                'last_name' => $reg['last_name'] ?? '',
                'year_level' => $reg['year_level'] ?? null,
                'course' => $reg['course'] ?? null,
                'registered_at' => isset($reg['registered_at']) ? $reg['registered_at'] : now()->toDateTimeString(),
            ]);

            $created++;
        }

        return $created;
    }

    private function mergeAttendances(Event $event, array $incomingAttendances, array $sessionMap): array
    {
        $registrationByStudentId = $event->registrations()->get()->keyBy('student_id');

        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($incomingAttendances as $attendance) {
            $studentId = trim((string) ($attendance['student_id'] ?? ''));
            $sessionName = trim((string) ($attendance['session'] ?? ''));

            $registration = $registrationByStudentId->get($studentId);
            $session = $sessionMap[$sessionName] ?? null;

            if (! $registration || ! $session) {
                $errors[] = [
                    'student_id' => $studentId,
                    'session' => $sessionName,
                    'reason' => ! $registration ? 'registration not found' : 'session not resolved',
                ];
                continue;
            }

            $existing = Attendance::query()
                ->where('session_id', $session->id)
                ->where('registration_id', $registration->id)
                ->exists();

            if ($existing) {
                $skipped++;
                continue;
            }

            Attendance::create([
                'session_id' => $session->id,
                'registration_id' => $registration->id,
                'recorded_at' => $attendance['recorded_at'] ?? now()->toDateTimeString(),
            ]);

            $created++;
        }

        return [$created, $skipped, $errors];
    }
}
