<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'skill_id',
        'session_number',
        'type',
        'question_text',
        'options_json',
        'correct_answer',
        'media_url'
    ];

    protected $casts = [
        'options_json' => 'array',
    ];

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }
}

