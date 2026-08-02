<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'csv_column_aliases' => ['nullable', 'array'],
            'csv_column_aliases.*' => ['string', 'max:255'],
        ];
    }
}