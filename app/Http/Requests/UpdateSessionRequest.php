<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSessionRequest extends FormRequest
{
    public function rules(): array
    {
        $session = $this->route('session');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('event_sessions')
                    ->where('event_id', $this->route('event')->id)
                    ->ignore($session->id),
            ],
            'start_time' => ['required', 'date'],
        ];
    }
}