<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sponsor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SponsorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Sponsor::latest()->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => [
                'nullable',
                Rule::in(['active', 'inactive']),
            ],
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        $sponsor = Sponsor::create($validated);

        return response()->json([
            'message' => 'Sponsor created successfully.',
            'data' => $sponsor,
        ], 201);
    }

    public function show(Sponsor $sponsor): JsonResponse
    {
        return response()->json([
            'data' => $sponsor->load('sponsorships'),
        ]);
    }

    public function update(
        Request $request,
        Sponsor $sponsor
    ): JsonResponse {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['active', 'inactive']),
            ],
        ]);

        $sponsor->update($validated);

        return response()->json([
            'message' => 'Sponsor updated successfully.',
            'data' => $sponsor->fresh(),
        ]);
    }

    public function destroy(Sponsor $sponsor): JsonResponse
    {
        $sponsor->delete();

        return response()->json([
            'message' => 'Sponsor deleted successfully.',
        ]);
    }
}
