<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MergeReportsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'min:2'],
            'files.*' => [
                'required',
                'file',
                'mimetypes:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream',
                'max:10240',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Please select at least two report files to merge.',
            'files.min' => 'Please select at least two report files to merge.',
            'files.*.mimetypes' => 'Each file must be an .xlsx attendance report.',
        ];
    }
}
