<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachTeam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CoachTeamController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $assignments = CoachTeam::with([
            'coach', 'team', 'season'
        ])->latest()->get();
        return response()->json($assignments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'coach_id' => ['required','exists:coaches,id',
            Rule::unique('coach_team', 'coach_id')
                ->where(
                    fn ($query) => $query
                        ->where( 'team_id', $request->team_id )
                        ->where('season_id', $request->season_id )
                        ->where( 'role', $request->role)
                ),
        ],

        'team_id' => [
            'required', 'exists:teams,id'
        ],

        'season_id' => [
            'required', 'exists:seasons,id'
        ],

        'role' => [
            'required',
            Rule::in([
                'head_coach', 'assistant_coach'
            ]),
        ],

        'start_date' => [
            'nullable', 'date'
        ],

        'end_date' => [
            'nullable', 'date', 'after_or_equal:start_date'
        ],

        'status' => [
            'required',
            Rule::in([
                'active', 'inactive'
            ]),
        ],
    ]);

    $assignment = CoachTeam::create($validated);

    return response()->json([
        'message' => 'Coach assigned successfully.',

        'data' => $assignment->load([
            'coach','team','season'
        ]),
    ], 201);
}

    /**
     * Display the specified resource.
     */
    public function show(
        CoachTeam $coachAssignment
    ): JsonResponse {
        $coachAssignment->load([
            'coach',
            'team',
            'season',
        ]);

        return response()->json([
            'data' => $coachAssignment,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        Request $request, CoachTeam $coachAssignment): JsonResponse
    {
        $validated = $request->validate([
        'coach_id' => ['required','exists:coaches,id',
            Rule::unique('coach_team', 'coach_id')
                ->where(
                    fn ($query) => $query
                        ->where( 'team_id', $request->team_id )
                        ->where('season_id', $request->season_id )
                        ->where( 'role', $request->role)
                )->ignore($coachAssignment->id),
        ],

        'team_id' => [
            'required', 'exists:teams,id'
        ],

        'season_id' => [
            'required', 'exists:seasons,id'
        ],

        'role' => [
            'required',
            Rule::in([
                'head_coach', 'assistant_coach'
            ]),
        ],

        'start_date' => [
            'nullable', 'date'
        ],

        'end_date' => [
            'nullable', 'date', 'after_or_equal:start_date'
        ],

        'status' => [
                'required',
                Rule::in([
                'active', 'inactive'
                ]),
            ],
        ]);

        $coachAssignment->update($validated);

        return response()->json([
            'message' => 'Assignment updated successfully.',
            'data' => $coachAssignment->load([
                'coach',
                'team',
                'season',
            ]),
        ]);
    }

    public function destroy(
        CoachTeam $coachAssignment
    ): JsonResponse {
        $coachAssignment->delete();

        return response()->json([
            'message' => 'Coach assignment removed.',
        ]);
    }
}
