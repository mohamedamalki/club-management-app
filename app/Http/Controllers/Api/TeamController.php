<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeamController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $teams = Team::withCount(['players', 'coaches'])
            ->latest()
            ->get();

        return response()->json($teams);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
                $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'gender' => [
                'required',
                Rule::in(['male', 'female', 'mixed']),
            ],
            'description' => ['nullable', 'string'],
            'status' => [
                'required',
                Rule::in(['active', 'inactive']),
            ],
        ]);

        $team = Team::create($validated);

        return response()->json([
            'message' => 'Team created successfully.',
            'data' => $team,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Team $team)
    {
        $team->load(['players', 'coaches']);

        return response()->json($team);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Team $team)
    {
                $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'required', 'string', 'max:100'],
            'gender' => [
                'sometimes',
                'required',
                Rule::in(['male', 'female', 'mixed']),
            ],
            'description' => ['nullable', 'string'],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['active', 'inactive']),
            ],
        ]);

        $team->update($validated);

        return response()->json([
            'message' => 'Team updated successfully.',
            'data' => $team,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        return response()->json([
            'message' => 'Team deleted successfully.',
        ]);
    }
}
