<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'season_id',
        'team_id',
        'description',
        'amount',
        'expense_date',
        'payment_method',
        'reference',
        'receipt_file',
        'notes',
        'created_by',
    ];

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
