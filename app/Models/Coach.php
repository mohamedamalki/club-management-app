<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coach extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'date_of_birth',
        'hire_date',
        'speciality',
        'salary',
        'status',
        'notes',
    ];

    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class)
            ->withPivot([
                'season_id',
                'role',
                'start_date',
                'end_date',
                'status',
            ])
            ->withTimestamps();
    }
    public function payments(): HasMany
    {
        return $this->hasMany(CoachPayment::class);
    }
}
