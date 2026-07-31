<?php

use App\Models\Attendance;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\Registration;

test('scan records new attendance', function () {
    $event = Event::factory()->create();
    $session = EventSession::factory()->for($event)->create();
    $registration = Registration::factory()->for($event)->create(['student_id' => '123456', 'first_name' => 'John', 'last_name' => 'Doe']);

    $response = $this->postJson("/api/v1/sessions/{$session->id}/attendances/scan", [
        'student_id' => '123456',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.student.student_id', '123456')
        ->assertJsonPath('message', 'Welcome, John Doe');

    $this->assertDatabaseHas('attendances', [
        'session_id' => $session->id,
        'registration_id' => $registration->id,
    ]);
});

test('scan returns 404 for unregistered student', function () {
    $event = Event::factory()->create();
    $session = EventSession::factory()->for($event)->create();

    $response = $this->postJson("/api/v1/sessions/{$session->id}/attendances/scan", [
        'student_id' => '999999',
    ]);

    $response->assertNotFound()
        ->assertJsonPath('message', 'This student ID number is not registered.')
        ->assertJsonPath('student_id', '999999');
});

test('scan returns 409 for duplicate scan in same session', function () {
    $event = Event::factory()->create();
    $session = EventSession::factory()->for($event)->create();
    $registration = Registration::factory()->for($event)->create(['student_id' => '123456', 'first_name' => 'John', 'last_name' => 'Doe']);
    Attendance::factory()->for($session, 'session')->for($registration)->create();

    $response = $this->postJson("/api/v1/sessions/{$session->id}/attendances/scan", [
        'student_id' => '123456',
    ]);

    $response->assertStatus(409)
        ->assertJsonPath('message', 'Attendance already recorded for this session.');
});

test('can list attendances for a session', function () {
    $event = Event::factory()->create();
    $session = EventSession::factory()->for($event)->create();
    $registration = Registration::factory()->for($event)->create(['student_id' => '123456']);
    Attendance::factory()->for($session, 'session')->for($registration)->create();

    $response = $this->getJson("/api/v1/sessions/{$session->id}/attendances");

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.student.student_id', '123456');
});

test('can delete a mis-scanned attendance', function () {
    $event = Event::factory()->create();
    $session = EventSession::factory()->for($event)->create();
    $registration = Registration::factory()->for($event)->create();
    $attendance = Attendance::factory()->for($session, 'session')->for($registration)->create();

    $response = $this->deleteJson("/api/v1/sessions/{$session->id}/attendances/{$attendance->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('attendances', ['id' => $attendance->id]);
});