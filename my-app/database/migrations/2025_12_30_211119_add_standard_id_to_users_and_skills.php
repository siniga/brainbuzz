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
        // Update Users Table
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('standard'); // Remove the old string column
            $table->foreignId('standard_id')->nullable()->after('phone_number')->constrained()->nullOnDelete();
        });

        // Update Skills Table
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn('standard'); // Remove the old integer column
            $table->foreignId('standard_id')->nullable()->after('subject_id')->constrained()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['standard_id']);
            $table->dropColumn('standard_id');
            $table->string('standard')->nullable();
        });

        Schema::table('skills', function (Blueprint $table) {
            $table->dropForeign(['standard_id']);
            $table->dropColumn('standard_id');
            $table->integer('standard');
        });
    }
};
