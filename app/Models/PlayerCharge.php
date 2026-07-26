<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlayerCharge extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_id',
        'season_id',
        'type',
        'description',
        'amount',
        'due_date',
        'status',
    ];
    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
