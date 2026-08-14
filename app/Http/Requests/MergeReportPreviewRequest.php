<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MergeReportPreviewRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimetypes:application/json,text/plain,application/octet-stream', 'max:10240'],
            'mapping' => ['nullable', 'string', 'json'],
        ];
    }
}
