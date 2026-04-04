<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| SPA Routes - All routes render the same React app view
|
*/

// Public Routes
Route::get('/', function () {
    return view('app');
});

Route::get('/form', function () {
    return view('app');
});

Route::get('/ticket/{id}', function () {
    return view('app');
});

Route::get('/display', function () {
    return view('app');
});

// Admin Routes
Route::get('/admin/login', function () {
    return view('app');
});

Route::get('/admin/dashboard', function () {
    return view('app');
});

Route::get('/admin/queue', function () {
    return view('app');
});

Route::get('/admin/history', function () {
    return view('app');
});

Route::get('/admin/services', function () {
    return view('app');
});

Route::get('/admin/location-settings', function () {
    return view('app');
});

Route::get('/admin/app-settings', function () {
    return view('app');
});

Route::get('/admin/audio-settings', function () {
    return view('app');
});
