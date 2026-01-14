<?php

namespace Database\Seeders;

use App\Models\Question;
use App\Models\Skill;
use App\Models\Subject;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class Standard1MathQuestionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        $subject = Subject::where('name', 'Mathematics')->first();
        
        if (!$subject) {
            $this->command->error('Mathematics subject not found. Run MathSubjectSeeder first.');
            return;
        }

        // Get Standard 1 ID (assumes StandardSeeder ran)
        $standardId = \App\Models\Standard::where('level', 1)->value('id');

        // Get all Standard 1 Maths skills
        $skills = Skill::where('subject_id', $subject->id)
                      ->where('standard_id', $standardId) // Changed from standard=1
                      ->get();

        foreach ($skills as $skill) {
            $this->command->info("Generating questions for: {$skill->name} ({$skill->category})");
            
            // Generate 10 sessions
            for ($session = 1; $session <= 10; $session++) {
                // Generate 10 questions per session
                for ($q = 1; $q <= 10; $q++) {
                    $this->createQuestion($skill, $session, $faker);
                }
            }
        }
    }

    private function createQuestion($skill, $session, $faker)
    {
        // Difficulty scaling: Session 1 is easy, Session 10 is harder
        // We simulate this by increasing number ranges or complexity based on session number
        
        $type = 'mcq'; // Default to MCQ for robustness, mix in others
        $questionText = '';
        $options = null;
        $correctAnswer = '';
        $mediaUrl = null;

        // Logic based on Category and Skill Name
        switch ($skill->category) {
            case 'Numbers':
                if (str_contains($skill->name, 'Count') || str_contains($skill->name, 'Read')) {
                    $max = $session * 10; // Session 1: 0-10, Session 10: 0-100
                    $num = $faker->numberBetween(0, $max);
                    $questionText = "What number is this: **$num**?";
                    $correctAnswer = (string)$num;
                    $options = $this->generateOptions($num, $max);
                } elseif (str_contains($skill->name, 'Compare')) {
                    $max = $session * 10;
                    $a = $faker->numberBetween(0, $max);
                    $b = $faker->numberBetween(0, $max);
                    // Avoid equality for simplicity unless intended
                    if ($a == $b) $b++; 
                    
                    $questionText = "Which is larger? $a or $b";
                    $correctAnswer = $a > $b ? (string)$a : (string)$b;
                    $options = json_encode([$a, $b]);
                } else {
                    // Default Number logic
                     $max = $session * 10;
                     $num = $faker->numberBetween(1, $max);
                     $questionText = "Select the number **$num**.";
                     $correctAnswer = (string)$num;
                     $options = $this->generateOptions($num, $max);
                }
                break;

            case 'Addition':
                $maxSum = ($skill->name == 'Add numbers up to 20') ? 20 : 10;
                // Scale difficulty: Session 1 uses small numbers, Session 10 uses larger within range
                $min = 0;
                $max = $session <= 5 ? floor($maxSum / 2) : $maxSum;
                
                $a = $faker->numberBetween($min, $max);
                $b = $faker->numberBetween($min, $maxSum - $a);
                $ans = $a + $b;
                
                $questionText = "What is $a + $b?";
                $correctAnswer = (string)$ans;
                $options = $this->generateOptions($ans, $maxSum + 5);
                break;

            case 'Subtraction':
                $maxVal = ($skill->name == 'Subtract numbers up to 20') ? 20 : 10;
                 // Ensure result is non-negative
                $a = $faker->numberBetween(1, $maxVal);
                $b = $faker->numberBetween(0, $a);
                $ans = $a - $b;
                
                $questionText = "What is $a - $b?";
                $correctAnswer = (string)$ans;
                $options = $this->generateOptions($ans, $maxVal);
                break;
                
            case 'Shapes':
                $shapes = ['Circle', 'Square', 'Triangle', 'Rectangle'];
                $targetShape = '';
                
                if (str_contains($skill->name, 'Circle')) $targetShape = 'Circle';
                elseif (str_contains($skill->name, 'Square')) $targetShape = 'Square';
                elseif (str_contains($skill->name, 'Triangle')) $targetShape = 'Triangle';
                elseif (str_contains($skill->name, 'Rectangle')) $targetShape = 'Rectangle';
                else $targetShape = $faker->randomElement($shapes);

                $questionText = "Which one is a **$targetShape**?";
                $correctAnswer = $targetShape;
                // For shape questions, options might be text or eventually images. 
                // Let's use text options for now.
                $options = json_encode($shapes);
                $mediaUrl = 'images/shapes/' . strtolower($targetShape) . '.png';
                break;

            case 'Time':
                $parts = ['Morning', 'Afternoon', 'Evening', 'Night'];
                $target = $faker->randomElement($parts);
                $questionText = "When do you sleep?";
                if ($target == 'Night') {
                    $correctAnswer = 'Night';
                } else {
                     $questionText = "Which is a time of day?";
                     $correctAnswer = $target;
                }
                $options = json_encode($parts);
                break;

            default:
                // Fallback for other categories
                $a = $faker->numberBetween(1, 10);
                $questionText = "Select the value $a";
                $correctAnswer = (string)$a;
                $options = $this->generateOptions($a, 20);
                break;
        }

        Question::create([
            'skill_id' => $skill->id,
            'session_number' => $session,
            'type' => $type,
            'question_text' => $questionText,
            'options_json' => $options,
            'correct_answer' => $correctAnswer,
            'media_url' => $mediaUrl,
        ]);
    }

    private function generateOptions($correct, $maxRange)
    {
        $options = [(int)$correct];
        while (count($options) < 4) {
            $rand = rand(0, $maxRange);
            if (!in_array($rand, $options)) {
                $options[] = $rand;
            }
        }
        shuffle($options);
        return json_encode($options);
    }
}
