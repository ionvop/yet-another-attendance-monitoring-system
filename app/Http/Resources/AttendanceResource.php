<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_id' => $this->session_id,
            'registration_id' => $this->registration_id,
            'recorded_at' => $this->recorded_at,
            'student' => $this->whenLoaded('registration', fn () => [
                'student_id' => $this->registration->student_id,
                'first_name' => $this->registration->first_name,
                'last_name' => $this->registration->last_name,
                'year_level' => $this->registration->year_level,
                'course' => $this->registration->course,
            ]),
        ];
    }
}