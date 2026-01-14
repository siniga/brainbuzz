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
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->integer('standard'); // Standards 1-7
            $table->string('category'); // e.g., Algebra, Grammar
            $table->string('name'); // e.g., Addition, Nouns
            $table->integer('total_sessions')->default(10);
            $table->timestamps();

            // Index for faster lookups
            $table->index(['subject_id', 'standard']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};
