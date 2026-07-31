<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSessionRequest;
use App\Http\Requests\UpdateSessionRequest;
use App\Http\Resources\SessionResource;
use App\Models\Event;
use App\Models\EventSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SessionController extends Controller
{
    public function index(Event $event): AnonymousResourceCollection
    {
        $sessions = EventSession::query()
            ->where('event_id', $event->id)
            ->withCount('attendances')
            ->orderBy('start_time')
            ->get();

        return SessionResource::collection($sessions);
    }

    public function store(StoreSessionRequest $request, Event $event): JsonResponse
    {
        $session = $event->sessions()->create($request->validated());

        return (new SessionResource($session))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Event $event, EventSession $session): SessionResource
    {
        $session->loadCount('attendances');

        return new SessionResource($session);
    }

    public function update(UpdateSessionRequest $request, Event $event, EventSession $session): SessionResource
    {
        $session->update($request->validated());

        return new SessionResource($session);
    }

    public function destroy(Event $event, EventSession $session): JsonResponse
    {
        $session->delete();

        return response()->json(null, 204);
    }
}