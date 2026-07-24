<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sponsor extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'logo',
        'notes',
        'status',
    ];

    public function sponsorships(): HasMany
    {
        return $this->hasMany(Sponsorship::class);
    }
}
