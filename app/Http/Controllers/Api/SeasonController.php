<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Season;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SeasonController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $seasons = Season::latest()->get();
        return response()->json($seasons);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:seasons,name'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => [
                'required',
                Rule::in(['upcoming', 'active', 'completed']),
            ],
        ]);
        $season = Season::create($validated);
        return response()->json([
            'message' => 'season create successfully',
            'data' => $season
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Season $season)
    {
        return response()->json($season);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Season $season)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('seasons', 'name')->ignore($season->id),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date'],
            'status' => [
                'required',
                Rule::in(['upcoming', 'active', 'completed']),
            ],
        ]);

        $season->update($validated);

        return response()->json([
            'message' => 'Season updated successfully.',
            'data' => $season,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Season $season)
    {
        $season->delete();

        return response()->json([
            'message' => 'Season deleted successfully.',
        ]);
    }
}
