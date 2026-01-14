import { upsertSubjects, upsertSkills, upsertQuestions } from './db';

export const runSeed = async () => {
  console.log('Seeding database...');
  
  // 1. Subject: Math
  const mathSubject = {
    id: 'subj_math',
    name: 'Mathematics',
    icon_uri: 'https://example.com/math_icon.png'
  };
  await upsertSubjects([mathSubject]);

  // 2. Skill: Count numbers 0-100
  const countSkill = {
    id: 'skill_count_0_100',
    subject_id: 'subj_math',
    name: 'Count numbers 0-100',
    standard: 'Standard 1',
    category: 'Numbers',
    total_sessions: 10
  };
  await upsertSkills([countSkill]);

  // 3. Questions (15 samples)
  // We will assign them to sessions 1 and 2 to demonstrate session splitting.
  const questions = [];
  
  for (let i = 1; i <= 15; i++) {
    const sessionIndex = i <= 10 ? 1 : 2; // First 10 in Session 1, next 5 in Session 2
    questions.push({
      id: `q_count_${i}`,
      skill_id: 'skill_count_0_100',
      session_index: sessionIndex,
      question_text: `What comes after ${i}?`,
      options_json: JSON.stringify([`${i+1}`, `${i+2}`, `${i+3}`, `${i-1}`]),
      correct_answer: `${i+1}`,
      explanation: `The number after ${i} is ${i+1}.`
    });
  }

  await upsertQuestions(questions);
  console.log('Seeding complete.');
};

