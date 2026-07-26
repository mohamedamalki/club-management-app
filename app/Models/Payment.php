<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_charge_id',
        'guardian_id',
        'amount',
        'payment_date',
        'payment_method',
        'reference',
        'notes',
    ];

    public function playerCharge(): BelongsTo
    {
        return $this->belongsTo(PlayerCharge::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class);
    }
}
