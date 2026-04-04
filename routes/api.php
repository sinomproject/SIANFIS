<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Public\VisitorController;
use App\Http\Controllers\Public\TicketController;
use App\Http\Controllers\Public\DisplayController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\QueueController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\VideoController;
use App\Http\Controllers\Admin\SettingController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==================== PUBLIC ROUTES ====================

// Services (for dropdown)
Route::get('/services', [VisitorController::class, 'getServices']);

// Location Settings (public - for form validation)
Route::get('/settings/location', [SettingController::class, 'getLocationSettings']);

// App Settings (public - for header & logo)
Route::get('/settings/app', [SettingController::class, 'getAppSettings']);

// Audio Settings (public - for voice announcement)
Route::get('/settings/audio', [SettingController::class, 'getAudioSettings']);

// Visitor Registration
Route::post('/queue/register', [VisitorController::class, 'register']);

// Ticket
Route::get('/ticket/{id}', [TicketController::class, 'show']);
Route::get('/ticket/code/{code}', [TicketController::class, 'getByCode']);

// Display (for polling)
Route::get('/display/current', [DisplayController::class, 'current']);

// Video (DEPRECATED - replaced with YouTube Playlist)
// Route::get('/video', [VideoController::class, 'show']);

// ==================== ADMIN AUTH ROUTES ====================

Route::post('/admin/login', [AuthController::class, 'login']);

// ==================== ADMIN PROTECTED ROUTES ====================

Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::post('/admin/logout', [AuthController::class, 'logout']);
    Route::get('/admin/me', [AuthController::class, 'me']);
    
    // Queue Management
    Route::prefix('admin/queue')->group(function () {
        Route::get('/', [QueueController::class, 'index']);
        Route::get('/stats', [QueueController::class, 'stats']);
        Route::get('/history', [QueueController::class, 'history']);
        Route::post('/call', [QueueController::class, 'call']);
        Route::post('/{id}/done', [QueueController::class, 'done']);
        Route::post('/{id}/skip', [QueueController::class, 'skip']);
        Route::post('/{id}/recall', [QueueController::class, 'recall']);
    });
    
    // Service Management
    Route::prefix('admin/services')->group(function () {
        Route::get('/', [ServiceController::class, 'index']);
        Route::post('/', [ServiceController::class, 'store']);
        Route::put('/{id}', [ServiceController::class, 'update']);
        Route::delete('/{id}', [ServiceController::class, 'destroy']);
        
        // Counters
        Route::get('/counters', [ServiceController::class, 'allCounters']);
        Route::get('/{serviceId}/counters', [ServiceController::class, 'counters']);
        Route::post('/counters', [ServiceController::class, 'storeCounter']);
        Route::put('/counters/{id}', [ServiceController::class, 'updateCounter']);
        Route::delete('/counters/{id}', [ServiceController::class, 'destroyCounter']);
    });

    // Video Management (DEPRECATED - replaced with YouTube Playlist)
    // Route::prefix('admin/video')->group(function () {
    //     Route::get('/', [VideoController::class, 'show']);
    //     Route::post('/', [VideoController::class, 'store']);
    //     Route::delete('/', [VideoController::class, 'destroy']);
    // });

    // Settings Management
    Route::prefix('admin/settings')->group(function () {
        Route::put('/location', [SettingController::class, 'updateLocationSettings']);
        Route::put('/app', [SettingController::class, 'updateAppSettings']);
        Route::put('/audio', [SettingController::class, 'updateAudioSettings']);
    });
});
