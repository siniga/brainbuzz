<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Standard extends Model
{
    protected $fillable = ['name', 'level'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }
}
