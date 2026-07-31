<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScanAttendanceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'student_id' => ['required', 'string'],
        ];
    }
}