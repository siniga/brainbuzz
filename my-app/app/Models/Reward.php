<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reward extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'sessions_required', 'icon_url'];

    public function userRewards(): HasMany
    {
        return $this->hasMany(UserReward::class);
    }
}

