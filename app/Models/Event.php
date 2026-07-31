<?php

namespace App\Models;

use Database\Factories\EventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'description'])]
class Event extends Model
{
    /** @use HasFactory<EventFactory> */
    use HasFactory;
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(EventSession::class);
    }
}