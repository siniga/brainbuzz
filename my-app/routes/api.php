<?php

use App\Models\Subject;
use App\Models\Skill;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Database\Eloquent\Collection;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/onboarding/standard', [AuthController::class, 'updateStandard']);
    Route::post('/onboarding/age', [AuthController::class, 'updateAge']);
    Route::post('/onboarding/gender', [AuthController::class, 'updateGender']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public API routes for testing content access
Route::get('/subjects', function (): Collection {
    return Subject::with('skills')->get();
});

Route::get('/subjects/{subject}/skills', function (Subject $subject) {
    return $subject->skills;
});

Route::get('/skills/{skill}/questions', function (Skill $skill) {
    // Return 10 questions for a specific session (default to session 1 if not provided)
    $session = request('session', 1);
    return $skill->questions()->where('session_number', $session)->get();
});
