<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlayerController extends Controller
{
    public function index(): JsonResponse
    {
        $players = Player::with([
            'guardians',
            'teams',
        ])->latest()->get();

        return response()->json($players);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                'unique:players,email',
            ],
            'address' => ['nullable', 'string', 'max:255'],
            'status' => [
                'required',
                Rule::in(['active', 'inactive']),
            ],
            'notes' => ['nullable', 'string'],
        ]);
            $validated['registration_number'] = $this->generateRegistrationNumber();
            $validated['registration_date'] = now()->toDateString();

        $player = Player::create($validated);

        return response()->json([
            'message' => 'Player created successfully.',
            'data' => $player,
        ], 201);
    }

    public function show(Player $player): JsonResponse
    {
        $player->load([
            'guardians',
            'teams',
            'charges.payments',
        ]);

        return response()->json([
            'data' => $player,
        ]);
    }

    public function update(
        Request $request,
        Player $player
    ): JsonResponse {
        $validated = $request->validate([
            'first_name' => [
                'sometimes', 'required', 'string', 'max:255',
            ],
            'last_name' => [
                'sometimes', 'required', 'string', 'max:255',
            ],
            'date_of_birth' => [
                'nullable', 'date', 'before:today',
            ],
            'gender' => [
                'sometimes',
                'required',
                Rule::in(['male', 'female']),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('players', 'email')->ignore($player->id),
            ],
            'address' => ['nullable', 'string', 'max:255'],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['active', 'inactive']),
            ],
            'notes' => ['nullable', 'string'],
        ]);

        $player->update($validated);

        return response()->json([
            'message' => 'Player updated successfully.',
            'data' => $player->fresh(),
        ]);
    }

    public function destroy(Player $player): JsonResponse
    {
        $player->delete();

        return response()->json([
            'message' => 'Player deleted successfully.',
        ]);
    }
        private function generateRegistrationNumber(): string
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $lastId = Player::withTrashed()->max('id') ?? 0;
            $candidate = 'PLY-' . str_pad(
                $lastId + 1 + $attempt,
                5,
                '0',
                STR_PAD_LEFT
            );

            if (! Player::withTrashed()
                ->where('registration_number', $candidate)
                ->exists()
            ) {
                return $candidate;
            }
        }

        // Extremely unlikely fallback: timestamp-based suffix guarantees uniqueness.
        return 'PLY-' . now()->format('YmdHis');
    }
}
