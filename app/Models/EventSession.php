<?php

namespace App\Models;

use Database\Factories\EventSessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['event_id', 'name', 'start_time'])]
class EventSession extends Model
{
    /** @use HasFactory<EventSessionFactory> */
    use HasFactory;
    protected $table = 'event_sessions';

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'session_id');
    }

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
        ];
    }
}