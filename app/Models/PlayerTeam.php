<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerTeam extends Model
{
    use HasFactory;

    // Laravel would normally search for "player_teams".
    // Your pivot table is named "player_team".
    protected $table = 'player_team';

    protected $fillable = [
        'player_id',
        'team_id',
        'season_id',
        'start_date',
        'end_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }
}
