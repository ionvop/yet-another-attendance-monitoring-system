<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MergeReportRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimetypes:application/json,text/plain,application/octet-stream', 'max:10240'],
            'session_mapping' => ['required', 'string', 'json'],
        ];
    }
}
