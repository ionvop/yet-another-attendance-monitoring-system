<?php

namespace App\Http\Controllers;

use App\Exports\DeviceDataExport;
use App\Http\Requests\MergeReportPreviewRequest;
use App\Http\Requests\MergeReportRequest;
use App\Models\Event;
use App\Services\DeviceDataMergeService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DeviceMergeController extends Controller
{
    /**
     * Download the master device's data as a portable JSON file, intended to be
     * the source that populates other devices. Useful for cloning the roster.
     */
    public function export(Event $event): BinaryFileResponse
    {
        $content = (new DeviceDataExport($event))->toJson();

        $temp = tempnam(sys_get_temp_dir(), 'device-data-');
        file_put_contents($temp, $content);

        return response()->download(
            $temp,
            'device-data-' . \Illuminate\Support\Str::slug($event->name) . '-' . now()->format('Y-m-d') . '.json',
            ['Content-Type' => 'application/json']
        )->deleteFileAfterSend(true);
    }

    /**
     * Parse an incoming device export and return a preview of what a merge
     * would do: session matches/conflicts, new registrations, and attendance
     * count. Nothing is written.
     */
    public function preview(MergeReportPreviewRequest $request, Event $event, DeviceDataMergeService $service): JsonResponse
    {
        $payload = $this->decodePayload($request->file('file'));

        if ($payload === null) {
            return response()->json([
                'message' => 'The uploaded file is not valid JSON device data.',
            ], 422);
        }

        return response()->json([
            'data' => $service->preview($event, $payload),
        ]);
    }

    /**
     * Actually merge the incoming device data into this device/event.
     */
    public function merge(MergeReportRequest $request, Event $event, DeviceDataMergeService $service): JsonResponse
    {
        $payload = $this->decodePayload($request->file('file'));

        if ($payload === null) {
            return response()->json([
                'message' => 'The uploaded file is not valid JSON device data.',
            ], 422);
        }

        $mapping = json_decode($request->input('session_mapping', '{}'), true);

        $result = $service->merge($event, $payload, is_array($mapping) ? $mapping : []);

        return response()->json([
            'data' => $result,
        ]);
    }

    private function decodePayload($file): ?array
    {
        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            return null;
        }

        $decoded = json_decode($contents, true);

        return is_array($decoded) ? $decoded : null;
    }
}
