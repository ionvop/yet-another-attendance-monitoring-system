<?php

namespace App\Http\Controllers;

use App\Exports\AttendanceExport;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    public function attendance(Event $event): JsonResponse
    {
        $sessionIds = request('session_ids', []);
        $sessions = EventSession::query()
            ->where('event_id', $event->id)
            ->when($sessionIds, fn ($q) => $q->whereIn('id', (array) $sessionIds))
            ->orderBy('start_time')
            ->get();

        $registrations = Registration::query()
            ->where('event_id', $event->id)
            ->with(['attendances' => fn ($q) => $q->whereIn('session_id', $sessions->pluck('id'))])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $rows = $registrations->map(function ($registration) use ($sessions) {
            $attendance = [];
            foreach ($sessions as $session) {
                $record = $registration->attendances->firstWhere('session_id', $session->id);
                $attendance[$session->name] = $record ? $record->recorded_at->toIso8601String() : null;
            }

            return [
                'student_id' => $registration->student_id,
                'first_name' => $registration->first_name,
                'last_name' => $registration->last_name,
                'year_level' => $registration->year_level,
                'course' => $registration->course,
                'attendance' => $attendance,
            ];
        });

        $perSession = $sessions->map(function ($session) use ($registrations) {
            $present = $registrations->filter(fn ($r) => $r->attendances->contains('session_id', $session->id))->count();

            return [
                'session' => $session->name,
                'present' => $present,
                'absent' => $registrations->count() - $present,
            ];
        });

        return response()->json([
            'data' => [
                'event' => ['id' => $event->id, 'name' => $event->name],
                'sessions' => $sessions->map(fn ($s) => ['id' => $s->id, 'name' => $s->name]),
                'rows' => $rows,
                'summary' => [
                    'total_registered' => $registrations->count(),
                    'per_session' => $perSession,
                ],
            ],
        ]);
    }

    public function export(Event $event): BinaryFileResponse
    {
        $sessionIds = request('session_ids', []);

        return Excel::download(
            new AttendanceExport($event, (array) $sessionIds),
            'attendance-' . \Illuminate\Support\Str::slug($event->name) . '-' . now()->format('Y-m-d') . '.xlsx'
        );
    }
}