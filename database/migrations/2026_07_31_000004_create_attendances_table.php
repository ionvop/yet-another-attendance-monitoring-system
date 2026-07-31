<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('event_sessions')->cascadeOnDelete();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->dateTime('recorded_at')->useCurrent();
            $table->timestamps();

            $table->unique(['session_id', 'registration_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};