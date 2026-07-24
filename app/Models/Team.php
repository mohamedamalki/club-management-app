<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'category',
        'gender',
        'description',
        'status',
    ];

    public function coaches(): BelongsToMany
    {
        return $this->belongsToMany(Coach::class)
            ->withPivot([
                'season_id',
                'role',
                'start_date',
                'end_date',
                'status',
            ])
            ->withTimestamps();
    }

    public function players(): BelongsToMany
    {
        return $this->belongsToMany(Player::class)
            ->withPivot([
                'season_id',
                'joined_at',
                'left_at',
                'shirt_number',
                'status',
            ])
            ->withTimestamps();
    }

    public function membershipFees(): HasMany
    {
        return $this->hasMany(MembershipFee::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
