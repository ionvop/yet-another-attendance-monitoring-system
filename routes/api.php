<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DeviceMergeController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Events
    Route::apiResource('events', EventController::class);

    // Registrations (nested under events)
    Route::prefix('events/{event}')->group(function () {
        Route::post('registrations/import', [RegistrationController::class, 'import']);
        Route::get('registrations/export', [RegistrationController::class, 'export']);
        Route::apiResource('registrations', RegistrationController::class)->except(['index']);
        Route::get('registrations', [RegistrationController::class, 'index']);

        // Sessions (nested under events)
        Route::apiResource('sessions', SessionController::class)->except(['index']);
        Route::get('sessions', [SessionController::class, 'index']);

        // Reports (nested under events)
        Route::get('reports/attendance', [ReportController::class, 'attendance']);
        Route::get('reports/attendance/export', [ReportController::class, 'export']);

        // Device data transfer (merge from other devices)
        Route::get('reports/device/export', [DeviceMergeController::class, 'export']);
        Route::post('reports/merge/preview', [DeviceMergeController::class, 'preview']);
        Route::post('reports/merge', [DeviceMergeController::class, 'merge']);
    });

    // Attendance (nested under sessions, but sessions are already under events)
    Route::prefix('sessions/{session}')->group(function () {
        Route::post('attendances/scan', [AttendanceController::class, 'scan']);
        Route::get('attendances', [AttendanceController::class, 'index']);
        Route::delete('attendances/{attendance}', [AttendanceController::class, 'destroy']);
    });

});