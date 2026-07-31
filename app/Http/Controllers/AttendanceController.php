<?php

namespace App\Http\Controllers;

use App\Http\Requests\ScanAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Models\EventSession;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AttendanceController extends Controller
{
    public function scan(ScanAttendanceRequest $request, EventSession $session): JsonResponse
    {
        $studentId = $request->input('student_id');

        $registration = Registration::query()
            ->where('event_id', $session->event_id)
            ->where('student_id', $studentId)
            ->first();

        if (! $registration) {
            return response()->json([
                'message' => 'This student ID number is not registered.',
                'student_id' => $studentId,
            ], 404);
        }

        $existing = Attendance::query()
            ->where('session_id', $session->id)
            ->where('registration_id', $registration->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Attendance already recorded for this session.',
                'data' => [
                    'student_id' => $registration->student_id,
                    'first_name' => $registration->first_name,
                    'last_name' => $registration->last_name,
                    'recorded_at' => $existing->recorded_at,
                ],
            ], 409);
        }

        $attendance = Attendance::create([
            'session_id' => $session->id,
            'registration_id' => $registration->id,
            'recorded_at' => now(),
        ]);

        $attendance->load('registration');

        return (new AttendanceResource($attendance))
            ->additional(['message' => "Welcome, {$registration->first_name} {$registration->last_name}"])
            ->response()
            ->setStatusCode(201);
    }

    public function index(EventSession $session): AnonymousResourceCollection
    {
        $perPage = min((int) request('per_page', config('attendance.pagination.default_per_page')), config('attendance.pagination.max_per_page'));

        $attendances = Attendance::query()
            ->with('registration')
            ->where('session_id', $session->id)
            ->when(request('search'), function ($q, $search) {
                $q->whereHas('registration', function ($q) use ($search) {
                    $q->where('student_id', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->orderBy('recorded_at')
            ->paginate($perPage);

        return AttendanceResource::collection($attendances);
    }

    public function destroy(EventSession $session, Attendance $attendance): JsonResponse
    {
        $attendance->delete();

        return response()->json(null, 204);
    }
}