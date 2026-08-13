<?php

namespace App\Http\Controllers;

use App\Exports\RegistrationsExport;
use App\Http\Requests\ImportRegistrationsRequest;
use App\Http\Requests\StoreRegistrationRequest;
use App\Http\Requests\UpdateRegistrationRequest;
use App\Http\Resources\RegistrationResource;
use App\Models\Event;
use App\Models\Registration;
use App\Services\CsvImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class RegistrationController extends Controller
{
    public function index(Event $event): AnonymousResourceCollection
    {
        $perPage = min((int) request('per_page', config('attendance.pagination.default_per_page')), config('attendance.pagination.max_per_page'));

        $registrations = Registration::query()
            ->where('event_id', $event->id)
            ->when(request('search'), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('student_id', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when(request('year_level'), fn ($q, $yl) => $q->where('year_level', $yl))
            ->when(request('course'), fn ($q, $c) => $q->where('course', $c))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($perPage);

        return RegistrationResource::collection($registrations);
    }

    public function store(StoreRegistrationRequest $request, Event $event): JsonResponse
    {
        $registration = $event->registrations()->create($request->validated());

        return (new RegistrationResource($registration))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Event $event, Registration $registration): RegistrationResource
    {
        return new RegistrationResource($registration);
    }

    public function update(UpdateRegistrationRequest $request, Event $event, Registration $registration): RegistrationResource
    {
        $registration->update($request->validated());

        return new RegistrationResource($registration);
    }

    public function destroy(Event $event, Registration $registration): JsonResponse
    {
        if ($registration->attendances()->exists()) {
            if (! request()->boolean('force')) {
                return response()->json([
                    'message' => 'Cannot delete: attendance already recorded for this student.',
                ], 409);
            }

            $registration->attendances()->delete();
        }

        $registration->delete();

        return response()->json(null, 204);
    }

    public function export(Event $event): BinaryFileResponse
    {
        $filters = request()->only(['search', 'year_level', 'course']);

        return Excel::download(
            new RegistrationsExport($event, $filters),
            'registrations-' . \Illuminate\Support\Str::slug($event->name) . '-' . now()->format('Y-m-d') . '.csv',
            \Maatwebsite\Excel\Excel::CSV
        );
    }

    public function import(ImportRegistrationsRequest $request, Event $event, CsvImportService $service): JsonResponse
    {
        $mode = $request->input('mode', 'insert_only');
        $mapping = json_decode($request->input('mapping', '{}'), true);
        $result = $service->import($event, $request->file('file'), $mode, $mapping);

        return response()->json([
            'data' => [
                'imported' => $result['imported'],
                'updated' => $result['updated'],
                'skipped' => $result['skipped'],
                'failed' => $result['failed'],
            ],
            'skipped_rows' => $result['skipped_rows'],
            'failed_rows' => $result['failed_rows'],
        ]);
    }
}