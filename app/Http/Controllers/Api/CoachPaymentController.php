<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CoachPaymentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            CoachPayment::with(['coach', 'season'])
                ->latest('due_date')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'coach_id' => ['required', 'exists:coaches,id'],
            'season_id' => ['required', 'exists:seasons,id'],
            'type' => [
                'required',
                Rule::in([
                    'salary',
                    'bonus',
                    'transport',
                    'other',
                ]),
            ],
            'description' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['required', 'date'],
            'paid_at' => ['nullable', 'date'],
            'status' => [
                'required',
                Rule::in(['pending', 'paid', 'cancelled']),
            ],
            'payment_method' => [
                'nullable',
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
                'unique:coach_payments,reference',
            ],
        ]);

        if ($validated['status'] === 'paid' &&
            empty($validated['paid_at'])) {
            $validated['paid_at'] = now()->toDateString();
        }

        $payment = CoachPayment::create($validated);

        return response()->json([
            'message' => 'Coach payment created successfully.',
            'data' => $payment->load(['coach', 'season']),
        ], 201);
    }

    public function show(CoachPayment $coachPayment): JsonResponse
    {
        return response()->json([
            'data' => $coachPayment->load(['coach', 'season']),
        ]);
    }

    public function update(
        Request $request,
        CoachPayment $coachPayment
    ): JsonResponse {
        $validated = $request->validate([
            'coach_id' => ['required', 'exists:coaches,id'],
            'season_id' => ['required', 'exists:seasons,id'],
            'type' => [
                'required',
                Rule::in([
                    'salary',
                    'bonus',
                    'transport',
                    'other',
                ]),
            ],
            'description' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['required', 'date'],
            'paid_at' => ['nullable', 'date'],
            'status' => [
                'required',
                Rule::in(['pending', 'paid', 'cancelled']),
            ],
            'payment_method' => [
                'nullable',
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
                Rule::unique('coach_payments', 'reference')
                    ->ignore($coachPayment->id),
            ],
        ]);

        if ($validated['status'] === 'paid' &&
            empty($validated['paid_at'])) {
            $validated['paid_at'] = now()->toDateString();
        }

        if ($validated['status'] !== 'paid') {
            $validated['paid_at'] = null;
        }

        $coachPayment->update($validated);

        return response()->json([
            'message' => 'Coach payment updated successfully.',
            'data' => $coachPayment->load(['coach', 'season']),
        ]);
    }

    public function destroy(CoachPayment $coachPayment): JsonResponse
    {
        $coachPayment->delete();

        return response()->json([
            'message' => 'Coach payment deleted successfully.',
        ]);
    }
}
