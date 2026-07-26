<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CoachController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $coaches = Coach::with('teams')->latest()->get();
        return response()->json($coaches);
    }

    /**
     * Store a newly created resource in storage.
     */
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'first_name' => [
            'required', 'string', 'max:100',
        ],
        'last_name' => [
            'required', 'string', 'max:100',
        ],
        'email' => [
            'nullable', 'email', 'max:255', 'unique:coaches,email',
        ],
        'phone' => [
            'required', 'string', 'max:30',
        ],
        'address' => [
            'nullable', 'string', 'max:255',
        ],
        'date_of_birth' => [
            'nullable', 'date', 'before:today',
        ],
        'hire_date' => [
            'nullable', 'date',
        ],
        'speciality' => [
            'nullable', 'string','max:150',
        ],
        'salary' => [
            'nullable', 'numeric', 'min:0',
        ],
        'status' => [
            'required', Rule::in(['active', 'inactive']),
        ],
        'notes' => [
            'nullable', 'string',
        ],
    ]);

        $coach = Coach::create($validated);

        return response()->json([
                'message' => 'Coach created successfully.',
                'data' => $coach,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Coach $coach)
    {
        $coach->load('teams');
        return response()->json([
            'data' => $coach
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Coach $coach)
    {
            $validated = $request->validate([
        'first_name' => [
            'required', 'string', 'max:100',
        ],
        'last_name' => [
            'required', 'string', 'max:100',
        ],
        'email' => [
            'nullable', 'email', 'max:255', 'unique:coaches,email',
        ],
        'phone' => [
            'required', 'string', 'max:30',
        ],
        'address' => [
            'nullable', 'string', 'max:255',
        ],
        'date_of_birth' => [
            'nullable', 'date', 'before:today',
        ],
        'hire_date' => [
            'nullable', 'date',
        ],
        'speciality' => [
            'nullable', 'string','max:150',
        ],
        'salary' => [
            'nullable', 'numeric', 'min:0',
        ],
        'status' => [
            'required', Rule::in(['active', 'inactive']),
        ],
        'notes' => [
            'nullable', 'string',
        ],
    ]);

        $coach->update($validated);

        return response()->json([
                'message' => 'Coach created successfully.',
                'data' => $coach,
        ], 201);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Coach $coach): JsonResponse
    {
        $coach->delete();

        return response()->json([
            'message' => 'Coach deleted successfully.',
        ]);
    }
}
