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

Route::get('/admin-sinom', function () {
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

Route::get('/admin/display-background', function () {
    return view('app');
});

Route::get('/admin/display-control', function () {
    return view('app');
});

Route::get('/admin/users', function () {
    return view('app');
});

// Staff Routes
Route::get('/staff/dashboard', function () {
    return view('app');
});

Route::get('/staff/queue', function () {
    return view('app');
});

Route::get('/staff/waiting-list', function () {
    return view('app');
});

Route::get('/staff/report', function () {
    return view('app');
});

Route::get('/staff/profile', function () {
    return view('app');
});
