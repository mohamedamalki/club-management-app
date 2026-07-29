<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sponsorship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SponsorshipController extends Controller
{
    public function index(): JsonResponse
    {
        $sponsorships = Sponsorship::with([
            'sponsor',
            'season',
        ])
            ->withSum('payments', 'amount')
            ->latest()
            ->get();

        return response()->json($sponsorships);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sponsor_id' => [
                'required',
                'exists:sponsors,id',
            ],
            'season_id' => [
                'required',
                'exists:seasons,id',
            ],
            'title' => [
                'required',
                'string',
                'max:255',
            ],
            'agreed_amount' => [
                'required',
                'numeric',
                'min:0.01',
            ],
            'start_date' => [
                'required',
                'date',
            ],
            'end_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],
            'payment_deadline' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
            'contract_file' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx',
                'max:5120',
            ],
            'status' => [
                'required',
                Rule::in([
                    'draft',
                    'active',
                    'completed',
                    'cancelled',
                ]),
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        if ($request->hasFile('contract_file')) {
            $validated['contract_file'] = $request
                ->file('contract_file')
                ->store('sponsorship-contracts', 'public');
        }

        $sponsorship = Sponsorship::create($validated);

        return response()->json([
            'message' => 'Sponsorship created successfully.',
            'data' => $sponsorship->load([
                'sponsor',
                'season',
            ]),
        ], 201);
    }

    public function show(
        Sponsorship $sponsorship
    ): JsonResponse {
        $sponsorship->load([
            'sponsor',
            'season',
            'payments',
        ]);

        $paidAmount = (float) $sponsorship
            ->payments
            ->sum('amount');

        $remainingAmount = max(
            (float) $sponsorship->agreed_amount - $paidAmount,
            0
        );

        return response()->json([
            'data' => $sponsorship,
            'paid_amount' => $paidAmount,
            'remaining_amount' => $remainingAmount,
        ]);
    }

    public function update(
        Request $request,
        Sponsorship $sponsorship
    ): JsonResponse {
        $validated = $request->validate([
            'sponsor_id' => [
                'required',
                'exists:sponsors,id',
            ],
            'season_id' => [
                'required',
                'exists:seasons,id',
            ],
            'title' => [
                'required',
                'string',
                'max:255',
            ],
            'agreed_amount' => [
                'required',
                'numeric',
                'min:0.01',
            ],
            'start_date' => [
                'required',
                'date',
            ],
            'end_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],
            'payment_deadline' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
            'contract_file' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx',
                'max:5120',
            ],
            'status' => [
                'required',
                Rule::in([
                    'draft',
                    'active',
                    'completed',
                    'cancelled',
                ]),
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        $paidAmount = (float) $sponsorship
            ->payments()
            ->sum('amount');

        if ((float) $validated['agreed_amount'] < $paidAmount) {
            return response()->json([
                'message' =>
                    'The agreed amount cannot be lower than the amount already paid.',
            ], 422);
        }

        if ($request->hasFile('contract_file')) {
            $newContract = $request
                ->file('contract_file')
                ->store('sponsorship-contracts', 'public');

            if ($sponsorship->contract_file) {
                Storage::disk('public')->delete(
                    $sponsorship->contract_file
                );
            }

            $validated['contract_file'] = $newContract;
        }

        $sponsorship->update($validated);

        return response()->json([
            'message' => 'Sponsorship updated successfully.',
            'data' => $sponsorship
                ->fresh()
                ->load([
                    'sponsor',
                    'season',
                    'payments',
                ]),
        ]);
    }

    public function destroy(
        Sponsorship $sponsorship
    ): JsonResponse {
        if ($sponsorship->payments()->exists()) {
            return response()->json([
                'message' =>
                    'A sponsorship containing payments cannot be deleted.',
            ], 422);
        }

        if ($sponsorship->contract_file) {
            Storage::disk('public')->delete(
                $sponsorship->contract_file
            );
        }

        $sponsorship->delete();

        return response()->json([
            'message' => 'Sponsorship deleted successfully.',
        ]);
    }
}
