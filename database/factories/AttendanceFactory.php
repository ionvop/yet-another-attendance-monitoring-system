<?php

namespace Database\Factories;

use App\Models\Attendance;
use App\Models\EventSession;
use App\Models\Registration;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceFactory extends Factory
{
    protected $model = Attendance::class;

    public function definition(): array
    {
        return [
            'session_id' => EventSession::factory(),
            'registration_id' => Registration::factory(),
            'recorded_at' => fake()->dateTimeBetween('-1 day', 'now'),
        ];
    }
}