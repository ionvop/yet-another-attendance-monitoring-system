<?php

use App\Models\Attendance;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\Registration;

test('attendance report returns correct structure', function () {
    $event = Event::factory()->create(['name' => 'Orientation']);
    $morning = EventSession::factory()->for($event)->create(['name' => 'Morning', 'start_time' => now()->setTime(7, 0)]);
    $afternoon = EventSession::factory()->for($event)->create(['name' => 'Afternoon', 'start_time' => now()->setTime(13, 0)]);

    $reg1 = Registration::factory()->for($event)->create(['student_id' => '111', 'first_name' => 'Alice', 'last_name' => 'Alpha']);
    $reg2 = Registration::factory()->for($event)->create(['student_id' => '222', 'first_name' => 'Bob', 'last_name' => 'Beta']);

    // Alice attended both, Bob attended only morning
    Attendance::factory()->for($morning, 'session')->for($reg1)->create();
    Attendance::factory()->for($afternoon, 'session')->for($reg1)->create();
    Attendance::factory()->for($morning, 'session')->for($reg2)->create();

    $response = $this->getJson("/api/v1/events/{$event->id}/reports/attendance");

    $response->assertOk()
        ->assertJsonPath('data.event.name', 'Orientation')
        ->assertJsonCount(2, 'data.sessions')
        ->assertJsonCount(2, 'data.rows')
        ->assertJsonPath('data.summary.total_registered', 2)
        ->assertJsonPath('data.summary.per_session.0.present', 2)
        ->assertJsonPath('data.summary.per_session.0.absent', 0)
        ->assertJsonPath('data.summary.per_session.1.present', 1)
        ->assertJsonPath('data.summary.per_session.1.absent', 1);
});

test('attendance report can filter by session_ids', function () {
    $event = Event::factory()->create();
    $morning = EventSession::factory()->for($event)->create(['name' => 'Morning', 'start_time' => now()->setTime(7, 0)]);
    $afternoon = EventSession::factory()->for($event)->create(['name' => 'Afternoon', 'start_time' => now()->setTime(13, 0)]);

    $reg = Registration::factory()->for($event)->create();
    Attendance::factory()->for($morning, 'session')->for($reg)->create();
    Attendance::factory()->for($afternoon, 'session')->for($reg)->create();

    $response = $this->getJson("/api/v1/events/{$event->id}/reports/attendance?session_ids[]={$morning->id}");

    $response->assertOk()
        ->assertJsonCount(1, 'data.sessions')
        ->assertJsonPath('data.sessions.0.name', 'Morning');
});