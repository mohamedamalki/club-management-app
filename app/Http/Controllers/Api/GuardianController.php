<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GuardianController extends Controller
{
    public function index(): JsonResponse
    {
        $guardians = Guardian::with('players')
            ->latest()
            ->get();

        return response()->json($guardians);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                'unique:guardians,email',
            ],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $guardian = Guardian::create($validated);

        return response()->json([
            'message' => 'Guardian created successfully.',
            'data' => $guardian,
        ], 201);
    }

    public function show(Guardian $guardian): JsonResponse
    {
        $guardian->load([
            'players',
            'payments.playerCharge.player',
        ]);

        return response()->json([
            'data' => $guardian,
        ]);
    }

    public function update(
        Request $request,
        Guardian $guardian
    ): JsonResponse {
        $validated = $request->validate([
            'first_name' => [
                'sometimes', 'required', 'string', 'max:255',
            ],
            'last_name' => [
                'sometimes', 'required', 'string', 'max:255',
            ],
            'phone' => [
                'sometimes', 'required', 'string', 'max:30',
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('guardians', 'email')
                    ->ignore($guardian->id),
            ],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $guardian->update($validated);

        return response()->json([
            'message' => 'Guardian updated successfully.',
            'data' => $guardian->fresh(),
        ]);
    }

    public function destroy(Guardian $guardian): JsonResponse
    {
        $guardian->delete();

        return response()->json([
            'message' => 'Guardian deleted successfully.',
        ]);
    }

    public function attachPlayer(
        Request $request,
        Guardian $guardian
    ): JsonResponse {
        $validated = $request->validate([
            'player_id' => [
                'required',
                'exists:players,id',
                Rule::unique('guardian_player', 'player_id')
                    ->where('guardian_id', $guardian->id),
            ],
            'relationship' => [
                'required',
                Rule::in([
                    'father',
                    'mother',
                    'brother',
                    'sister',
                    'other',
                ]),
            ],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $guardian->players()->attach(
            $validated['player_id'],
            [
                'relationship' => $validated['relationship'],
                'is_primary' => $validated['is_primary'] ?? false,
            ]
        );

        return response()->json([
            'message' => 'Player linked to guardian successfully.',
            'data' => $guardian->load('players'),
        ], 201);
    }

    public function detachPlayer(
        Guardian $guardian,
        int $player
    ): JsonResponse {
        $guardian->players()->detach($player);

        return response()->json([
            'message' => 'Player removed from guardian successfully.',
        ]);
    }
}
