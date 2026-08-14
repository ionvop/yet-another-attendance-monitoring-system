<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventSession;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventSessionFactory extends Factory
{
    protected $model = EventSession::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('now', '+1 week');

        return [
            'event_id' => Event::factory(),
            'name' => fake()->unique()->word() . ' Session',
            'start_time' => $start,
        ];
    }
}