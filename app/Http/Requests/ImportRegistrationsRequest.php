<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportRegistrationsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimetypes:text/csv,text/plain', 'max:5120'],
            'mode' => ['nullable', 'string', 'in:insert_only,upsert'],
        ];
    }
}