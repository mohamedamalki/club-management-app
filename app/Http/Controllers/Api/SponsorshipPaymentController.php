<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sponsorship;
use App\Models\SponsorshipPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SponsorshipPaymentController  extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = SponsorshipPayment::with([
            'sponsorship.sponsor',
            'sponsorship.season',
            'creator',
        ])
            ->when(
                $request->filled('sponsorship_id'),
                fn ($query) => $query->where(
                    'sponsorship_id',
                    $request->sponsorship_id
                )
            )
            ->latest('payment_date')
            ->get();

        return response()->json($payments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sponsorship_id' => [
                'required',
                'exists:sponsorships,id',
            ],
            'amount' => [
                'required',
                'numeric',
                'min:0.01',
            ],
            'payment_date' => [
                'required',
                'date',
            ],
            'payment_method' => [
                'required',
                Rule::in([
                    'cash',
                    'bank_transfer',
                    'card',
                    'cheque',
                    'other',
                ]),
            ],
            'reference' => [
                'nullable',
                'string',
                'max:255',
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        $payment = DB::transaction(
            function () use ($request, $validated) {
                $sponsorship = Sponsorship::query()
                    ->lockForUpdate()
                    ->findOrFail(
                        $validated['sponsorship_id']
                    );

                if ($sponsorship->status === 'cancelled') {
                    throw ValidationException::withMessages([
                        'sponsorship_id' =>
                            'Payments cannot be added to a cancelled sponsorship.',
                    ]);
                }

                $alreadyPaid = (float) $sponsorship
                    ->payments()
                    ->sum('amount');

                $remainingAmount = max(
                    (float) $sponsorship->agreed_amount -
                        $alreadyPaid,
                    0
                );

                if (
                    (float) $validated['amount'] >
                    $remainingAmount
                ) {
                    throw ValidationException::withMessages([
                        'amount' =>
                            "The payment cannot exceed the remaining amount of {$remainingAmount} MAD.",
                    ]);
                }

                $validated['created_by'] =
                    $request->user()->id;

                return SponsorshipPayment::create(
                    $validated
                );
            }
        );

        return response()->json([
            'message' => 'Sponsorship payment created successfully.',
            'data' => $payment->load([
                'sponsorship.sponsor',
                'sponsorship.season',
                'creator',
            ]),
        ], 201);
    }

    public function show(
        SponsorshipPayment $sponsorshipPayment
    ): JsonResponse {
        $sponsorshipPayment->load([
            'sponsorship.sponsor',
            'sponsorship.season',
            'creator',
        ]);

        $sponsorship =
            $sponsorshipPayment->sponsorship;

        $paidAmount = (float) $sponsorship
            ->payments()
            ->sum('amount');

        $remainingAmount = max(
            (float) $sponsorship->agreed_amount -
                $paidAmount,
            0
        );

        return response()->json([
            'data' => $sponsorshipPayment,
            'paid_amount' => $paidAmount,
            'remaining_amount' => $remainingAmount,
        ]);
    }

    public function update(
        Request $request,
        SponsorshipPayment $sponsorshipPayment
    ): JsonResponse {
        $validated = $request->validate([
            'sponsorship_id' => [
                'required',
                'exists:sponsorships,id',
            ],
            'amount' => [
                'required',
                'numeric',
                'min:0.01',
            ],
            'payment_date' => [
                'required',
                'date',
            ],
            'payment_method' => [
                'required',
                Rule::in([
                    'cash',
                    'bank_transfer',
                    'card',
                    'cheque',
                    'other',
                ]),
            ],
            'reference' => [
                'nullable',
                'string',
                'max:255',
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        DB::transaction(function () use (
            $validated,
            $sponsorshipPayment
        ) {
            $sponsorship = Sponsorship::query()
                ->lockForUpdate()
                ->findOrFail(
                    $validated['sponsorship_id']
                );

            if ($sponsorship->status === 'cancelled') {
                throw ValidationException::withMessages([
                    'sponsorship_id' => 'Payments cannot be assigned to a cancelled sponsorship.',
                ]);
            }

            /*
             * Calculate all payments except the payment
             * currently being updated.
             */
            $otherPaymentsTotal = (float) $sponsorship
                ->payments()
                ->where(
                    'id',
                    '!=',
                    $sponsorshipPayment->id
                )
                ->sum('amount');

            $availableAmount = max(
                (float) $sponsorship->agreed_amount -
                    $otherPaymentsTotal,
                0
            );

            if (
                (float) $validated['amount'] >
                $availableAmount
            ) {
                throw ValidationException::withMessages([
                    'amount' => "The payment cannot exceed the available amount of {$availableAmount} MAD.",
                ]);
            }

            /*
             * created_by is not updated because it should
             * continue identifying the original creator.
             */
            $sponsorshipPayment->update($validated);
        });

        return response()->json([
            'message' =>
                'Sponsorship payment updated successfully.',
            'data' => $sponsorshipPayment->load([
                'sponsorship.sponsor',
                'sponsorship.season',
                'creator',
            ]),
        ]);
    }

    public function destroy(
        SponsorshipPayment $sponsorshipPayment
    ): JsonResponse {
        $sponsorshipPayment->delete();

        return response()->json([
            'message' => 'Sponsorship payment deleted successfully.',
        ]);
    }
}
