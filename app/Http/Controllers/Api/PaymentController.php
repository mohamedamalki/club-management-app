<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PlayerCharge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function index(): JsonResponse
    {
        $payments = Payment::with([
            'guardian',
            'playerCharge.player',
            'playerCharge.season',
        ])->latest('payment_date')->get();

        return response()->json($payments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'player_charge_id' => [
                'required',
                'exists:player_charges,id',
            ],
            'guardian_id' => [
                'nullable',
                'exists:guardians,id',
            ],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'payment_method' => [
                'required',
                Rule::in([
                    'cash',
                    'bank_transfer',
                    'card',
                    'other',
                ]),
            ],
            'reference' => [
                'nullable',
                'string',
                'max:255',
                'unique:payments,reference',
            ],
            'notes' => ['nullable', 'string'],
        ]);

        $payment = DB::transaction(function () use ($validated) {
            $charge = PlayerCharge::query()
                ->lockForUpdate()
                ->findOrFail($validated['player_charge_id']);

            if ($charge->status === 'cancelled') {
                throw ValidationException::withMessages([
                    'player_charge_id' => 'This charge is cancelled.',
                ]);
            }

            $alreadyPaid = $charge->payments()->sum('amount');
            $remaining = (float) $charge->amount - $alreadyPaid;

            if ((float) $validated['amount'] > $remaining) {
                throw ValidationException::withMessages([
                    'amount' => "The remaining amount is {$remaining}.",
                ]);
            }

            $payment = Payment::create($validated);

            $totalPaid = $alreadyPaid + (float) $payment->amount;

            $charge->update([
                'status' => $totalPaid >= (float) $charge->amount
                    ? 'paid'
                    : 'partially_paid',
            ]);

            return $payment;
        });

        return response()->json([
            'message' => 'Payment recorded successfully.',
            'data' => $payment->load([
                'guardian',
                'playerCharge.player',
            ]),
        ], 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json([
            'data' => $payment->load([
                'guardian',
                'playerCharge.player',
                'playerCharge.season',
            ]),
        ]);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        DB::transaction(function () use ($payment) {
            $charge = $payment->playerCharge;

            $payment->delete();

            $totalPaid = $charge->payments()->sum('amount');

            $charge->update([
                'status' => match (true) {
                    $totalPaid <= 0 => 'unpaid',
                    $totalPaid >= (float) $charge->amount => 'paid',
                    default => 'partially_paid',
                },
            ]);
        });

        return response()->json([
            'message' => 'Payment deleted successfully.',
        ]);
    }
}
