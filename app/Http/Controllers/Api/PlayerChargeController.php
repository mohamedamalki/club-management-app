<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlayerCharge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlayerChargeController extends Controller
{
    public function index(): JsonResponse
    {
        $charges = PlayerCharge::with([
            'player',
            'season',
            'payments.guardian',
        ])->latest()->get();

        return response()->json($charges);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'player_id' => ['required', 'exists:players,id'],
            'season_id' => ['required', 'exists:seasons,id'],
            'type' => [
                'required',
                Rule::in([
                    'registration',
                    'monthly_fee',
                    'equipment',
                    'transport',
                    'other',
                ]),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['required', 'date'],
            'status' => [
                'nullable',
                Rule::in([
                    'unpaid',
                    'partially_paid',
                    'paid',
                    'cancelled',
                ]),
            ],
        ]);

        $validated['status'] = $validated['status'] ?? 'unpaid';

        $charge = PlayerCharge::create($validated);

        return response()->json([
            'message' => 'Player charge created successfully.',
            'data' => $charge->load(['player', 'season']),
        ], 201);
    }

    public function show(PlayerCharge $playerCharge): JsonResponse
    {
        $playerCharge->load([
            'player',
            'season',
            'payments.guardian',
        ]);

        $paidAmount = $playerCharge->payments->sum('amount');

        return response()->json([
            'data' => $playerCharge,
            'paid_amount' => $paidAmount,
            'remaining_amount' => max(
                0,
                (float) $playerCharge->amount - $paidAmount
            ),
        ]);
    }

    public function update(
        Request $request,
        PlayerCharge $playerCharge
    ): JsonResponse {
        $validated = $request->validate([
            'player_id' => ['required', 'exists:players,id'],
            'season_id' => ['required', 'exists:seasons,id'],
            'type' => [
                'required',
                Rule::in([
                    'registration',
                    'monthly_fee',
                    'equipment',
                    'transport',
                    'other',
                ]),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['required', 'date'],
            'status' => [
                'required',
                Rule::in([
                    'unpaid',
                    'partially_paid',
                    'paid',
                    'cancelled',
                ]),
            ],
        ]);

        $alreadyPaid = $playerCharge->payments()->sum('amount');

        if ($validated['amount'] < $alreadyPaid) {
            return response()->json([
                'message' => 'The charge cannot be lower than the amount already paid.',
            ], 422);
        }

        $playerCharge->update($validated);

        return response()->json([
            'message' => 'Player charge updated successfully.',
            'data' => $playerCharge->load([
                'player',
                'season',
                'payments',
            ]),
        ]);
    }

    public function destroy(PlayerCharge $playerCharge): JsonResponse
    {
        if ($playerCharge->payments()->exists()) {
            return response()->json([
                'message' => 'A charge containing payments cannot be deleted.',
            ], 422);
        }

        $playerCharge->delete();

        return response()->json([
            'message' => 'Player charge deleted successfully.',
        ]);
    }
}
