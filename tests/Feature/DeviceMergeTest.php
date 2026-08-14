<?php

use App\Models\Attendance;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\Registration;
use Illuminate\Http\UploadedFile;

// Helper to build a Portable JSON device-export payload with realistic shape.
function devicePayload(array $overrides = []): array
{
    return array_merge([
        'event' => ['name' => 'Orientation'],
        'exported_at' => '2026-08-01T07:00:00+00:00',
        'sessions' => [
            ['name' => 'Morning', 'start_time' => '2026-08-01T07:00:00+00:00'],
        ],
        'registrations' => [
            ['student_id' => '123456', 'first_name' => 'John', 'last_name' => 'Doe', 'year_level' => '1st year', 'course' => 'BSCS', 'registered_at' => '2026-07-20T10:00:00+00:00'],
        ],
        'attendances' => [
            ['student_id' => '123456', 'session' => 'Morning', 'recorded_at' => '2026-08-01T07:32:10+00:00'],
        ],
    ], $overrides);
}

function uploadDevicePayload(array $payload): UploadedFile
{
    $tmp = tempnam(sys_get_temp_dir(), 'device');
    file_put_contents($tmp, json_encode($payload));
    return new UploadedFile($tmp, 'device-data.json', 'application/json', null, true);
}

test('device data export produces expected JSON structure', function () {
    $event = Event::factory()->create(['name' => 'Orientation']);
    $morning = EventSession::factory()->for($event)->create(['name' => 'Morning']);
    $registration = Registration::factory()->for($event)->create(['student_id' => '123456']);
    Attendance::factory()->for($morning, 'session')->for($registration)->create(['recorded_at' => '2026-08-01T07:32:10+00:00']);

    $response = $this->getJson("/api/v1/events/{$event->id}/reports/device/export");

    $response->assertOk();
    $content = json_decode($response->streamedContent(), true);

    expect($content['event']['name'])->toBe('Orientation');
    expect($content['sessions'][0]['name'])->toBe('Morning');
    expect($content['registrations'][0]['student_id'])->toBe('123456');
    expect($content['attendances'][0])->toEqual(['student_id' => '123456', 'session' => 'Morning', 'recorded_at' => '2026-08-01T07:32:10+00:00']);
});

test('merge preview reports matched sessions and auto-created registrations', function () {
    $event = Event::factory()->create();
    EventSession::factory()->for($event)->create(['name' => 'Morning']);

    $payload = devicePayload([
        'sessions' => [
            ['name' => 'Morning'],
            ['name' => 'Afternoon'],
        ],
        'registrations' => [
            ['student_id' => '123456', 'first_name' => 'John', 'last_name' => 'Doe', 'year_level' => '1st year', 'course' => 'BSCS'],
            ['student_id' => '999999', 'first_name' => 'New', 'last_name' => 'Walkin', 'year_level' => '2nd year', 'course' => 'BSIT'],
        ],
    ]);

    $response = $this->postJson("/api/v1/events/{$event->id}/reports/merge/preview", [
        'file' => uploadDevicePayload($payload),
    ]);

    $response->assertOk()
        ->assertJsonPath('data.new_registrations_count', 2)
        ->assertJsonCount(2, 'data.sessions')
        ->assertJsonPath('data.sessions.0.status', 'matched')
        ->assertJsonPath('data.sessions.0.matched_to', $event->sessions()->first()->id)
        ->assertJsonPath('data.sessions.1.status', 'unmatched')
        ->assertJsonCount(1, 'data.conflicts');
});

test('merge auto-creates unknown session when mapped to create', function () {
    $event = Event::factory()->create();

    $payload = devicePayload([
        'sessions' => [
            ['name' => 'Morning', 'start_time' => '2026-08-01T07:00:00+00:00'],
        ],
        'registrations' => [
            ['student_id' => '123456', 'first_name' => 'John', 'last_name' => 'Doe', 'year_level' => '1st year', 'course' => 'BSCS'],
        ],
    ]);

    $response = $this->postJson("/api/v1/events/{$event->id}/reports/merge", [
        'file' => uploadDevicePayload($payload),
        'session_mapping' => json_encode(['Morning' => 'create']),
    ]);

    $response->assertOk()
        ->assertJsonPath('data.sessions_created', 1)
        ->assertJsonPath('data.registrations_created', 1)
        ->assertJsonPath('data.attendances_created', 1);

    $this->assertDatabaseHas('event_sessions', ['event_id' => $event->id, 'name' => 'Morning']);
    $this->assertDatabaseHas('registrations', ['event_id' => $event->id, 'student_id' => '123456']);
    $this->assertDatabaseCount('attendances', 1);
});

test('merge maps unmatched session to an existing master session', function () {
    $event = Event::factory()->create();
    $afternoon = EventSession::factory()->for($event)->create(['name' => 'Afternoon']);
    Registration::factory()->for($event)->create(['student_id' => '123456']);

    // Incoming device named the session differently.
    $payload = devicePayload([
        'sessions' => [
            ['name' => 'PM'],
        ],
        'registrations' => [
            ['student_id' => '123456', 'first_name' => 'John', 'last_name' => 'Doe', 'year_level' => '1st year', 'course' => 'BSCS'],
        ],
        'attendances' => [
            ['student_id' => '123456', 'session' => 'PM', 'recorded_at' => '2026-08-01T13:10:00+00:00'],
        ],
    ]);

    $response = $this->postJson("/api/v1/events/{$event->id}/reports/merge", [
        'file' => uploadDevicePayload($payload),
        'session_mapping' => json_encode(['PM' => (string) $afternoon->id]),
    ]);

    $response->assertOk()
        ->assertJsonPath('data.sessions_created', 0)
        ->assertJsonPath('data.registrations_created', 0)
        ->assertJsonPath('data.attendances_created', 1);

    $this->assertDatabaseHas('attendances', [
        'session_id' => $afternoon->id,
        'registration_id' => Registration::where('student_id', '123456')->first()->id,
    ]);
});

test('merge auto-creates walk-in registration from incoming data', function () {
    $event = Event::factory()->create();
    $morning = EventSession::factory()->for($event)->create(['name' => 'Morning']);

    $payload = devicePayload([
        'registrations' => [
            ['student_id' => '555666', 'first_name' => 'Walk', 'last_name' => 'In', 'year_level' => '3rd year', 'course' => 'BSCS'],
        ],
        'attendances' => [
            ['student_id' => '555666', 'session' => 'Morning', 'recorded_at' => '2026-08-01T08:00:00+00:00'],
        ],
    ]);

    $response = $this->postJson("/api/v1/events/{$event->id}/reports/merge", [
        'file' => uploadDevicePayload($payload),
        'session_mapping' => json_encode(['Morning' => 'create']),
    ]);

    $response->assertOk()
        ->assertJsonPath('data.registrations_created', 1)
        ->assertJsonPath('data.attendances_created', 1);

    $registration = Registration::where('student_id', '555666')->first();
    expect($registration)->not->toBeNull();
    $this->assertDatabaseHas('attendances', [
        'session_id' => $morning->id,
        'registration_id' => $registration->id,
    ]);
});

test('merge is idempotent - re-importing creates no duplicates', function () {
    $event = Event::factory()->create();
    EventSession::factory()->for($event)->create(['name' => 'Morning']);
    Registration::factory()->for($event)->create(['student_id' => '123456']);

    $payload = devicePayload();

    foreach ([1, 2] as $_) {
        $response = $this->postJson("/api/v1/events/{$event->id}/reports/merge", [
            'file' => uploadDevicePayload($payload),
            'session_mapping' => json_encode(['Morning' => 'create']),
        ]);

        $response->assertOk();
    }

    $this->assertDatabaseCount('attendances', 1);
    $this->assertDatabaseCount('registrations', 1);
});
