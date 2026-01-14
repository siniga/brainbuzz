<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Standard;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Standards
        $standards = [
            ['name' => 'Standard 1', 'level' => 1],
            ['name' => 'Standard 2', 'level' => 2],
            ['name' => 'Standard 3', 'level' => 3],
            ['name' => 'Standard 4', 'level' => 4],
            ['name' => 'Standard 5', 'level' => 5],
            ['name' => 'Standard 6', 'level' => 6],
            ['name' => 'Standard 7', 'level' => 7],
        ];

        foreach ($standards as $std) {
            Standard::firstOrCreate($std);
        }

        // Create a test user
        User::factory()->create([
            'name' => 'Test User',
            'phone_number' => '1234567890',
            'standard_id' => Standard::where('level', 1)->first()->id,
        ]);

        // Run Math Seeders
        $this->call([
            MathSubjectSeeder::class,
            Standard1MathSkillsSeeder::class,
            Standard1MathQuestionsSeeder::class,
        ]);
    }
}
