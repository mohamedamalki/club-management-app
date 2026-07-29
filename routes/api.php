<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CoachController;
use App\Http\Controllers\Api\CoachPaymentController;
use App\Http\Controllers\Api\CoachTeamController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\GuardianController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\PlayerTeamController;
use App\Http\Controllers\Api\SeasonController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\PlayerChargeController;
use App\Http\Controllers\Api\SponsorController;
use App\Http\Controllers\Api\SponsorshipController;
use App\Http\Controllers\Api\SponsorshipPaymentController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('seasons', SeasonController::class);
    Route::apiResource('teams', TeamController::class);
    Route::apiResource('coaches', CoachController::class);
    Route::apiResource('coach-assignments', CoachTeamController::class);
    Route::apiResource('players', PlayerController::class);
    Route::apiResource('guardians', GuardianController::class);

    Route::post(
        '/guardians/{guardian}/players',
        [GuardianController::class, 'attachPlayer']
    );

    Route::delete(
        '/guardians/{guardian}/players/{player}',
        [GuardianController::class, 'detachPlayer']
    );

    Route::apiResource(
        'player-assignments',
        PlayerTeamController::class
    )->parameters([
        'player-assignments' => 'playerAssignment',
    ]);

    Route::apiResource(
        'player-charges',
        PlayerChargeController::class
    );

    Route::apiResource(
        'payments',
        PaymentController::class
    )->except('update');

    Route::apiResource(
        'expenses',
        ExpenseController::class
    );

    Route::apiResource(
        'coach-payments',
        CoachPaymentController::class
    );
    Route::apiResource('sponsors', SponsorController::class);
    Route::apiResource('sponsor-ships', SponsorshipController::class)->parameters([
        'sponsor-ships' => 'sponsorship',
    ]);
        Route::apiResource( 'sponsorship-payments', SponsorshipPaymentController::class)->parameters([
        'sponsorship-payments' =>
            'sponsorshipPayment',
    ]);
});
