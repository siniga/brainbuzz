<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->integer('session_number'); // 1 to 10
            $table->string('type'); // mcq, true_false, fill_blank, image, audio
            $table->text('question_text');
            $table->json('options_json')->nullable(); // For MCQ options
            $table->string('correct_answer');
            $table->string('media_url')->nullable(); // For image/audio
            $table->timestamps();

            // Index for fetching questions for a specific session
            $table->index(['skill_id', 'session_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
