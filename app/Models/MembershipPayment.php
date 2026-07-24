<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembershipPayment extends Model
{
    protected $fillable = [
        'player_id',
        'membership_fee_id',
        'guardian_id',
        'amount',
        'payment_date',
        'payment_method',
        'reference',
        'receipt_number',
        'notes',
        'created_by',
    ];

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function membershipFee(): BelongsTo
    {
        return $this->belongsTo(MembershipFee::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
