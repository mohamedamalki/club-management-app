<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Expense::with(['team', 'season'])
                ->latest('expense_date')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'season_id' => ['nullable', 'exists:seasons,id'],
            'team_id' => ['nullable', 'exists:teams,id'],
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
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
                'unique:expenses,reference',
            ],
            'receipt_file' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $expense = Expense::create($validated);

        return response()->json([
            'message' => 'Expense created successfully.',
            'data' => $expense->load(['team', 'season']),
        ], 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json([
            'data' => $expense->load(['team', 'season']),
        ]);
    }

    public function update(
        Request $request,
        Expense $expense
    ): JsonResponse {
        $validated = $request->validate([
            'season_id' => ['nullable', 'exists:seasons,id'],
            'team_id' => ['nullable', 'exists:teams,id'],
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
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
                Rule::unique('expenses', 'reference')
                    ->ignore($expense->id),
            ],
            'receipt_file' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $expense->update($validated);

        return response()->json([
            'message' => 'Expense updated successfully.',
            'data' => $expense->load(['team', 'season']),
        ]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted successfully.',
        ]);
    }
}
