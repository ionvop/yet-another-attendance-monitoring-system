<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Registration;
use Illuminate\Database\Eloquent\Factories\Factory;

class RegistrationFactory extends Factory
{
    protected $model = Registration::class;

    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'student_id' => fake()->unique()->numerify('######'),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'year_level' => fake()->randomElement(config('attendance.year_levels')),
            'course' => fake()->randomElement(config('attendance.courses')),
            'registered_at' => fake()->dateTimeBetween('-1 month', 'now'),
        ];
    }
}