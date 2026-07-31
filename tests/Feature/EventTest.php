<?php

use App\Models\Event;

test('can list events', function () {
    Event::factory()->count(3)->create();

    $response = $this->getJson('/api/v1/events');

    $response->assertOk()
        ->assertJsonStructure(['data', 'meta'])
        ->assertJsonCount(3, 'data');
});

test('can search events by name', function () {
    Event::factory()->create(['name' => 'Orientation']);
    Event::factory()->create(['name' => 'Workshop']);

    $response = $this->getJson('/api/v1/events?search=Orient');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Orientation');
});

test('can create an event', function () {
    $response = $this->postJson('/api/v1/events', [
        'name' => 'Orientation',
        'description' => 'New student orientation',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Orientation')
        ->assertJsonPath('data.description', 'New student orientation');

    $this->assertDatabaseHas('events', ['name' => 'Orientation']);
});

test('event name is required', function () {
    $response = $this->postJson('/api/v1/events', [
        'description' => 'No name',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('name');
});

test('can show an event with counts', function () {
    $event = Event::factory()->create();

    $response = $this->getJson("/api/v1/events/{$event->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $event->id)
        ->assertJsonPath('data.registrations_count', 0)
        ->assertJsonPath('data.sessions_count', 0);
});

test('show returns 404 for missing event', function () {
    $response = $this->getJson('/api/v1/events/999');

    $response->assertNotFound();
});

test('can update an event', function () {
    $event = Event::factory()->create(['name' => 'Old Name']);

    $response = $this->putJson("/api/v1/events/{$event->id}", [
        'name' => 'New Name',
        'description' => 'Updated description',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'New Name');

    $this->assertDatabaseHas('events', ['id' => $event->id, 'name' => 'New Name']);
});

test('can delete an event', function () {
    $event = Event::factory()->create();

    $response = $this->deleteJson("/api/v1/events/{$event->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('events', ['id' => $event->id]);
});