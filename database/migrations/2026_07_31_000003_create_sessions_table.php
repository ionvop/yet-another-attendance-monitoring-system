<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->timestamps();

            $table->unique(['event_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_sessions');
    }
};