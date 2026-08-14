<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'name' => $this->name,
            'start_time' => $this->start_time,
            'attendances_count' => $this->whenCounted('attendances'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}