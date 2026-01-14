<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MathSubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Subject::firstOrCreate(
            ['name' => 'Mathematics'],
            ['description' => 'Primary school mathematics covering numbers, shapes, measurement, and basic arithmetic.']
        );
    }
}
