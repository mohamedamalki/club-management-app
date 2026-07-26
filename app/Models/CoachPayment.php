<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'coach_id',
        'season_id',
        'type',
        'description',
        'amount',
        'due_date',
        'paid_at',
        'status',
        'payment_method',
        'reference',
    ];

    public function coach(): BelongsTo
    {
        return $this->belongsTo(Coach::class);
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }
}
