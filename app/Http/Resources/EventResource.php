<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'csv_column_aliases' => $this->csv_column_aliases ?? [],
            'registrations_count' => $this->whenCounted('registrations'),
            'sessions_count' => $this->whenCounted('sessions'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}