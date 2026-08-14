<?php

use App\Models\Event;
use App\Models\EventSession;

test('can list sessions for an event', function () {
    $event = Event::factory()->create();
    EventSession::factory()->count(2)->for($event)->create();

    $response = $this->getJson("/api/v1/events/{$event->id}/sessions");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

test('can create a session', function () {
    $event = Event::factory()->create();

    $response = $this->postJson("/api/v1/events/{$event->id}/sessions", [
        'name' => 'Morning',
        'start_time' => '2026-08-01T07:00:00Z',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Morning');

    $this->assertDatabaseHas('event_sessions', [
        'event_id' => $event->id,
        'name' => 'Morning',
    ]);
});

test('session name must be unique per event', function () {
    $event = Event::factory()->create();
    EventSession::factory()->for($event)->create(['name' => 'Morning']);

    $response = $this->postJson("/api/v1/events/{$event->id}/sessions", [
        'name' => 'Morning',
        'start_time' => '2026-08-01T13:00:00Z',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('name');
});

test('can update a session', function () {
    $event = Event::factory()->create();
    $session = EventSession::factory()->for($event)->create(['name' => 'Morning']);

    $response = $this->putJson("/api/v1/events/{$event->id}/sessions/{$session->id}", [
        'name' => 'Morning Session',
        'start_time' => $session->start_time->toIso8601String(),
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Morning Session');
});

test('can delete a session', function () {
    $event = Event::factory()->create();
    $session = EventSession::factory()->for($event)->create();

    $response = $this->deleteJson("/api/v1/events/{$event->id}/sessions/{$session->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('event_sessions', ['id' => $session->id]);
});