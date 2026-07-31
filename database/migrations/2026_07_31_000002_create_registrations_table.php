<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('student_id', 50);
            $table->string('first_name');
            $table->string('last_name');
            $table->string('year_level', 50);
            $table->string('course', 50);
            $table->dateTime('registered_at')->useCurrent();
            $table->timestamps();

            $table->unique(['event_id', 'student_id']);
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};