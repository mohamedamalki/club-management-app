<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlayerTeam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlayerTeamController extends Controller
{
    public function index(): JsonResponse
    {
        $assignments = PlayerTeam::with([
            'player',
            'team',
            'season',
        ])->latest()->get();

        return response()->json($assignments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'player_id' => [
                'required',
                'exists:players,id',

                Rule::unique('player_team', 'player_id')
                    ->where(
                        fn ($query) => $query
                            ->where('team_id', $request->team_id)
                            ->where('season_id', $request->season_id)
                    ),
            ],
            'team_id' => ['required', 'exists:teams,id'],
            'season_id' => ['required', 'exists:seasons,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
            'status' => [
                'required',
                Rule::in(['active', 'inactive']),
            ],
        ]);

        $assignment = PlayerTeam::create($validated);

        return response()->json([
            'message' => 'Player assigned successfully.',
            'data' => $assignment->load([
                'player',
                'team',
                'season',
            ]),
        ], 201);
    }

    public function show(
        PlayerTeam $playerAssignment
    ): JsonResponse {
        return response()->json([
            'data' => $playerAssignment->load([
                'player',
                'team',
                'season',
            ]),
        ]);
    }

    public function update(
        Request $request,
        PlayerTeam $playerAssignment
    ): JsonResponse {
        $validated = $request->validate([
            'player_id' => [
                'required',
                'exists:players,id',

                Rule::unique('player_team', 'player_id')
                    ->where(
                        fn ($query) => $query
                            ->where('team_id', $request->team_id)
                            ->where('season_id', $request->season_id)
                    )
                    ->ignore($playerAssignment->id),
            ],
            'team_id' => ['required', 'exists:teams,id'],
            'season_id' => ['required', 'exists:seasons,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
            'status' => [
                'required',
                Rule::in(['active', 'inactive']),
            ],
        ]);

        $playerAssignment->update($validated);

        return response()->json([
            'message' => 'Player assignment updated successfully.',
            'data' => $playerAssignment->load([
                'player',
                'team',
                'season',
            ]),
        ]);
    }

    public function destroy(
        PlayerTeam $playerAssignment
    ): JsonResponse {
        $playerAssignment->delete();

        return response()->json([
            'message' => 'Player assignment removed successfully.',
        ]);
    }
}
