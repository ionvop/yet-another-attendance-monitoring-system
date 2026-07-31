<?php

use App\Models\Event;
use App\Models\Registration;

test('can list registrations for an event', function () {
    $event = Event::factory()->create();
    Registration::factory()->count(3)->for($event)->create();

    $response = $this->getJson("/api/v1/events/{$event->id}/registrations");

    $response->assertOk()
        ->assertJsonStructure(['data', 'meta'])
        ->assertJsonCount(3, 'data');
});

test('can search registrations by student_id or name', function () {
    $event = Event::factory()->create();
    Registration::factory()->for($event)->create(['student_id' => '123456', 'first_name' => 'John', 'last_name' => 'Doe']);
    Registration::factory()->for($event)->create(['student_id' => '789012', 'first_name' => 'Jane', 'last_name' => 'Smith']);

    $response = $this->getJson("/api/v1/events/{$event->id}/registrations?search=John");

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.first_name', 'John');
});

test('can filter registrations by year_level and course', function () {
    $event = Event::factory()->create();
    Registration::factory()->for($event)->create(['year_level' => '1st year', 'course' => 'BSCS']);
    Registration::factory()->for($event)->create(['year_level' => '2nd year', 'course' => 'BSIT']);

    $response = $this->getJson("/api/v1/events/{$event->id}/registrations?year_level=1st+year&course=BSCS");

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

test('can manually add a registration', function () {
    $event = Event::factory()->create();

    $response = $this->postJson("/api/v1/events/{$event->id}/registrations", [
        'student_id' => '123456',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'year_level' => '1st year',
        'course' => 'BSCS',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.student_id', '123456');

    $this->assertDatabaseHas('registrations', [
        'event_id' => $event->id,
        'student_id' => '123456',
    ]);
});

test('duplicate student_id in same event returns 409', function () {
    $event = Event::factory()->create();
    Registration::factory()->for($event)->create(['student_id' => '123456']);

    $response = $this->postJson("/api/v1/events/{$event->id}/registrations", [
        'student_id' => '123456',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'year_level' => '1st year',
        'course' => 'BSCS',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('student_id');
});

test('student_id must be digits only', function () {
    $event = Event::factory()->create();

    $response = $this->postJson("/api/v1/events/{$event->id}/registrations", [
        'student_id' => 'ABC123',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'year_level' => '1st year',
        'course' => 'BSCS',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('student_id');
});

test('year_level must be a valid configured value', function () {
    $event = Event::factory()->create();

    $response = $this->postJson("/api/v1/events/{$event->id}/registrations", [
        'student_id' => '123456',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'year_level' => 'Invalid Year',
        'course' => 'BSCS',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('year_level');
});

test('can update a registration', function () {
    $event = Event::factory()->create();
    $registration = Registration::factory()->for($event)->create(['first_name' => 'John']);

    $response = $this->putJson("/api/v1/events/{$event->id}/registrations/{$registration->id}", [
        'student_id' => $registration->student_id,
        'first_name' => 'Jonathan',
        'last_name' => $registration->last_name,
        'year_level' => $registration->year_level,
        'course' => $registration->course,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.first_name', 'Jonathan');
});

test('can delete a registration with no attendances', function () {
    $event = Event::factory()->create();
    $registration = Registration::factory()->for($event)->create();

    $response = $this->deleteJson("/api/v1/events/{$event->id}/registrations/{$registration->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('registrations', ['id' => $registration->id]);
});