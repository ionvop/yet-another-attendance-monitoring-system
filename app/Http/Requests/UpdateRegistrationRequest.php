<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRegistrationRequest extends FormRequest
{
    public function rules(): array
    {
        $registration = $this->route('registration');

        return [
            'student_id' => [
                'required',
                'string',
                'max:50',
                'regex:/^\d+$/',
                Rule::unique('registrations')
                    ->where('event_id', $this->route('event')->id)
                    ->ignore($registration->id),
            ],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'year_level' => ['required', 'string', Rule::in(config('attendance.year_levels'))],
            'course' => ['required', 'string', Rule::in(config('attendance.courses'))],
            'registered_at' => ['nullable', 'date'],
        ];
    }
}