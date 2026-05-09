<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\CmsController;
use App\Http\Controllers\LmsController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\DownloadController;

// Health check
Route::get('/health', fn() => response()->json(['status' => 'ok']));

// --- Auth ---
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('jwt.auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
});

// --- Users (authenticated) ---
Route::prefix('users')->middleware('jwt.auth')->group(function () {
    Route::get('/me/stats', [UserController::class, 'stats']);
    Route::post('/downloads', [UserController::class, 'recordDownload']);
    Route::get('/{id}/downloads', [UserController::class, 'downloads']);
    Route::get('/{id}/stats', [UserController::class, 'statsByid']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::put('/{id}', [UserController::class, 'update']);
});

// --- Admin (authenticated + admin) ---
Route::prefix('admin')->middleware(['jwt.auth', 'admin'])->group(function () {
    Route::get('/stats', [AdminController::class, 'stats']);

    // Users
    Route::get('/users', [AdminController::class, 'listUsers']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

    // Categories
    Route::get('/meta/categories', [AdminController::class, 'listCategories']);
    Route::post('/meta/categories', [AdminController::class, 'createCategory']);
    Route::put('/meta/categories/{id}', [AdminController::class, 'updateCategory']);
    Route::delete('/meta/categories/{id}', [AdminController::class, 'deleteCategory']);

    // Resources
    Route::get('/resources', [ResourceController::class, 'index']);
    Route::post('/resources/upload', [ResourceController::class, 'upload']);
    Route::post('/resources/import-url', [ResourceController::class, 'importUrl']);
    Route::put('/resources/{id}/file', [ResourceController::class, 'replaceFile']);
    Route::put('/resources/{id}/import-url', [ResourceController::class, 'replaceImportUrl']);
    Route::post('/resources', [ResourceController::class, 'store']);
    Route::put('/resources/{id}', [ResourceController::class, 'update']);
    Route::delete('/resources/{id}', [ResourceController::class, 'destroy']);

    // CMS
    Route::get('/cms/pages', [CmsController::class, 'listPages']);
    Route::get('/cms/pages/{slug}', [CmsController::class, 'getPage']);
    Route::put('/cms/pages/{slug}', [CmsController::class, 'putPage']);

    // LMS
    Route::get('/lms/actividades', [LmsController::class, 'adminListActividades']);
    Route::post('/lms/actividades', [LmsController::class, 'adminCreateActividad']);
    Route::put('/lms/actividades/{id}', [LmsController::class, 'adminUpdateActividad']);
    Route::delete('/lms/actividades/{id}', [LmsController::class, 'adminDeleteActividad']);
    Route::get('/lms/actividades/{id}/items', [LmsController::class, 'adminListItems']);
    Route::post('/lms/actividades/{actividadId}/import-banco', [LmsController::class, 'adminImportBanco']);
    Route::post('/lms/items', [LmsController::class, 'adminCreateItem']);
    Route::put('/lms/items/{id}', [LmsController::class, 'adminUpdateItem']);
    Route::delete('/lms/items/{id}', [LmsController::class, 'adminDeleteItem']);
    Route::get('/lms/banco/items', [LmsController::class, 'adminListBanco']);
    Route::post('/lms/banco/items', [LmsController::class, 'adminCreateBanco']);
    Route::put('/lms/banco/items/{id}', [LmsController::class, 'adminUpdateBanco']);
    Route::delete('/lms/banco/items/{id}', [LmsController::class, 'adminDeleteBanco']);
});

// --- Catalog (public) ---
Route::prefix('catalog')->group(function () {
    Route::get('/search', [CatalogController::class, 'search']);
    Route::get('/highlights', [CatalogController::class, 'highlights']);
    Route::get('/recursos', [CatalogController::class, 'recursos']);
    Route::get('/recursos/{id}', [CatalogController::class, 'recursoDetail']);
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/categories/{id}/recursos', [CatalogController::class, 'categoryRecursos']);
    Route::get('/categories/{id}', [CatalogController::class, 'categoryDetail']);
    Route::get('/cms/pages/{slug}', [CmsController::class, 'publicPage']);

    // LMS public
    Route::get('/lms/actividades', [LmsController::class, 'publicListActividades']);
    Route::get('/lms/actividades/{slug}', [LmsController::class, 'publicGetActividad']);
    Route::post('/lms/actividades/{slug}/intentos', [LmsController::class, 'publicSubmitIntento'])->middleware('jwt.auth');
    Route::get('/lms/mis-intentos', [LmsController::class, 'publicMisIntentos'])->middleware('jwt.auth');
});

// --- Secure Download (authenticated) ---
Route::get('/downloads/{resourceId}', [DownloadController::class, 'download'])->middleware('jwt.auth');
