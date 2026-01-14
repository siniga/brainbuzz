<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\Subject;
use App\Models\Standard;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class Standard1MathSkillsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subject = Subject::where('name', 'Mathematics')->firstOrFail();
        $standard = Standard::where('level', 1)->firstOrFail();

        $curriculum = [
            'Numbers' => [
                'Count numbers 0–100',
                'Read numbers',
                'Write numbers',
                'Order numbers (ascending/descending)',
                'Compare numbers (> < =)',
            ],
            'Addition' => [
                'Add numbers up to 10',
                'Add numbers up to 20',
                'Add using objects',
                'Simple word problems',
            ],
            'Subtraction' => [
                'Subtract numbers up to 10',
                'Subtract numbers up to 20',
                'Subtract using objects',
                'Simple word problems',
            ],
            'Shapes' => [
                'Identify circle',
                'Identify square',
                'Identify triangle',
                'Identify rectangle',
            ],
            'Measurement' => [
                'Long / short',
                'Heavy / light',
                'Full / empty',
            ],
            'Time' => [
                'Morning / afternoon / evening / night',
                'Days of the week',
                'O’clock (intro)',
            ],
            'Money' => [
                'Identify coins',
                'Identify notes',
                'Simple buying situations',
            ],
            'Patterns & Sorting' => [
                'Identify number patterns',
                'Identify shape patterns',
                'Sort objects by size/color',
            ],
        ];

        foreach ($curriculum as $category => $skills) {
            foreach ($skills as $skillName) {
                Skill::firstOrCreate(
                    [
                        'subject_id' => $subject->id,
                        'standard_id' => $standard->id,
                        'name' => $skillName,
                    ],
                    [
                        'category' => $category,
                        'total_sessions' => 10,
                    ]
                );
            }
        }
    }
}
