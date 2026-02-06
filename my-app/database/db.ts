import * as SQLite from 'expo-sqlite';
import {
  Subject, Skill, Question, UserSkillProgress, UserSessionLog, Reward
} from './types';
import { CREATE_TABLES, SCHEMA_VERSION } from './schema';

const DB_NAME = 'brainbuzz.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const openDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      return db;
    } catch (error) {
      dbPromise = null; // Reset on error so subsequent calls can retry
      throw error;
    }
  })();

  return dbPromise;
};

export const initDB = async () => {
  const db = await openDB();

  // Check current version
  let currentVersion = 0;
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );
    if (result) currentVersion = result.version;
  } catch (e) {
    // Table doesn't exist yet, version 0
  }

  if (currentVersion < SCHEMA_VERSION) {
    await db.withTransactionAsync(async () => {
      // Execute all create statements
      for (const statement of CREATE_TABLES) {
        await db.execAsync(statement);
      }

      // MIGRATION for Version 2: Add image_url to subjects
      if (currentVersion < 2) {
        try {
          const tableInfo = await db.getAllAsync('PRAGMA table_info(subjects)');
          const hasColumn = tableInfo.some((col: any) => col.name === 'image_url');
          if (!hasColumn) {
            await db.execAsync(`ALTER TABLE subjects ADD COLUMN image_url TEXT;`);
          }
        } catch (e) {
          console.log("Migration warning: " + e);
        }
      }

      // MIGRATION: Add type to questions
        try {
          const tableInfo = await db.getAllAsync('PRAGMA table_info(questions)');
          const hasColumn = tableInfo.some((col: any) => col.name === 'type');
          if (!hasColumn) {
            await db.execAsync(`ALTER TABLE questions ADD COLUMN type TEXT DEFAULT 'mcq';`);
          }
        } catch (e) {
        console.log("Migration warning (questions type): " + e);
      }

      // MIGRATION for Version 4: Add audio_url to questions
      if (currentVersion < 4) {
        try {
          const tableInfo = await db.getAllAsync('PRAGMA table_info(questions)');
          const hasColumn = tableInfo.some((col: any) => col.name === 'audio_url');
          if (!hasColumn) {
            await db.execAsync(`ALTER TABLE questions ADD COLUMN audio_url TEXT;`);
            console.log("Added audio_url column to questions table");
          }
        } catch (e) {
          console.log("Migration warning (questions audio_url): " + e);
        }
      }

      await db.runAsync(
        'INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        SCHEMA_VERSION, new Date().toISOString()
      );
    });
  }
};

// --- Content Helpers ---

export const upsertSubjects = async (subjects: Subject[]) => {
  const db = await openDB();

  // Ensure the column exists before inserting
  try {
    const tableInfo = await db.getAllAsync('PRAGMA table_info(subjects)');
    const hasColumn = tableInfo.some((col: any) => col.name === 'image_url');
    if (!hasColumn) {
      await db.execAsync(`ALTER TABLE subjects ADD COLUMN image_url TEXT;`);
    }
  } catch (e) {
    console.log("Upsert subject column check error: " + e);
  }

  await db.withTransactionAsync(async () => {
    // Optional: clear duplicates or handle them if needed. 
    // Usually REPLACE handles ID conflicts, but if IDs differ (e.g., int vs string), you get duplicates.
    // Let's delete existing subjects by name to avoid duplicates if ID changed from local seeding vs server.

    // 1. Get IDs of incoming subjects
    const incomingNames = subjects.map(s => s.name);
    // 2. Delete existing subjects with these names (to ensure we replace them cleanly)
    // NOTE: If your server IDs are stable, this isn't needed. 
    // BUT if you seeded locally with 'subj_math' and server sends '1', they are different rows!
    if (incomingNames.length > 0) {
      const placeholders = incomingNames.map(() => '?').join(',');
      await db.runAsync(`DELETE FROM subjects WHERE name IN (${placeholders})`, ...incomingNames);
    }

    for (const s of subjects) {
      // Ensure we convert server numeric ID to string if needed
      const id = String(s.id);
      await db.runAsync(
        'INSERT OR REPLACE INTO subjects (id, name, icon_uri, image_url) VALUES (?, ?, ?, ?)',
        id, s.name, s.icon_uri || null, s.image_url || null
      );
    }
  });
};

export const upsertUserSubjects = async (userId: string, subjectIds: string[]) => {
  const db = await openDB();
  await db.withTransactionAsync(async () => {
    // Clear existing selection for this user?
    await db.runAsync('DELETE FROM user_subjects WHERE user_id = ?', userId);

    for (const subId of subjectIds) {
      await db.runAsync(
        'INSERT INTO user_subjects (user_id, subject_id) VALUES (?, ?)',
        userId, String(subId)
      );
    }
  });
};

export const upsertSkills = async (skills: Skill[]) => {
  const db = await openDB();
  await db.withTransactionAsync(async () => {
    for (const s of skills) {
      await db.runAsync(
        `INSERT OR REPLACE INTO skills 
        (id, subject_id, name, standard, category, total_sessions) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        s.id, s.subject_id, s.name, s.standard_id || s.standard, s.category, s.total_sessions
      );
    }
  });
};

export const upsertQuestions = async (questions: Question[]) => {
  const db = await openDB();

  // Ensure columns exist (Defensive Check)
  try {
    const tableInfo = await db.getAllAsync('PRAGMA table_info(questions)');
    const hasTypeColumn = tableInfo.some((col: any) => col.name === 'type');
    if (!hasTypeColumn) {
      await db.execAsync(`ALTER TABLE questions ADD COLUMN type TEXT DEFAULT 'mcq';`);
    }
    const hasAudioColumn = tableInfo.some((col: any) => col.name === 'audio_url');
    if (!hasAudioColumn) {
      await db.execAsync(`ALTER TABLE questions ADD COLUMN audio_url TEXT;`);
    }
  } catch (e) {
    console.log("Upsert column check error: " + e);
  }

  await db.withTransactionAsync(async () => {
    for (const q of questions) {
      await db.runAsync(
        `INSERT OR REPLACE INTO questions 
        (id, skill_id, session_index, type, question_text, options_json, correct_answer, media_uri, audio_url, explanation) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        q.id, q.skill_id, q.session_number || q.session_index, q.type || 'mcq', q.question_text,
        q.options_json, q.correct_answer, q.media_uri || q.media_url || null, 
        (q as any).audio_url || null, q.explanation || null
      );
    }
  });
};

export const upsertRewards = async (rewards: Reward[]) => {
  const db = await openDB();
  await db.withTransactionAsync(async () => {
    for (const r of rewards) {
      await db.runAsync(
        `INSERT OR REPLACE INTO rewards (id, user_id, skill_id, reward_type, awarded_at, synced) 
        VALUES (?, ?, ?, ?, ?, 1)`,
        [String(r.id), String(r.user_id), String(r.skill_id), String(r.reward_type), String(r.awarded_at)]
      );
    }
  });
};

export const upsertSessionLogs = async (logs: UserSessionLog[]) => {
  const db = await openDB();
  await db.withTransactionAsync(async () => {
    for (const l of logs) {
      await db.runAsync(
        `INSERT OR REPLACE INTO user_session_logs 
        (id, user_id, skill_id, session_number, score, correct_count, total_count, time_taken_seconds, passed, created_at, synced) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          String(l.id),
          String(l.user_id),
          String(l.skill_id),
          Number(l.session_number),
          Number(l.score),
          Number(l.correct_count),
          Number(l.total_count),
          Number(l.time_taken_seconds),
          Number(l.passed),
          String(l.created_at),
          1 // Mark as synced
        ]
      );
    }
  });
};

export const upsertProgress = async (progress: UserSkillProgress[]) => {
  const db = await openDB();
  await db.withTransactionAsync(async () => {
    for (const p of progress) {
      // We use INSERT OR REPLACE to update existing records with server data.
      // Since (user_id, skill_id) is UNIQUE, this handles updates correctly.
      await db.runAsync(
        `INSERT OR REPLACE INTO user_skill_progress 
        (id, user_id, skill_id, sessions_passed, stars_earned, is_completed, last_unlocked_session, synced) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          String(p.id || generateId()),
          String(p.user_id),
          String(p.skill_id),
          Number(p.sessions_passed),
          Number(p.stars_earned),
          Number(p.is_completed),
          Number(p.last_unlocked_session),
          1 // Mark as synced since it comes from server
        ]
      );
    }
  });
};

// --- Progress Helpers ---

export const getSkillsByStandard = async (subjectId: string, standard: string, userId: string): Promise<(Skill & UserSkillProgress)[]> => {
  const db = await openDB();
  // Join skills with user progress
  const result = await db.getAllAsync<Skill & UserSkillProgress>(
    `SELECT s.*, 
            COALESCE(p.sessions_passed, 0) as sessions_passed, 
            COALESCE(p.stars_earned, 0) as stars_earned, 
            COALESCE(p.is_completed, 0) as is_completed,
            COALESCE(p.last_unlocked_session, 1) as last_unlocked_session
     FROM skills s
     LEFT JOIN user_skill_progress p ON s.id = p.skill_id AND p.user_id = ?
     WHERE s.subject_id = ? AND s.standard = ?
     ORDER BY CAST(s.id AS INTEGER) ASC`,
    userId, subjectId, standard
  );
  return result;
};

export const getNextSessionToPlay = async (userId: string, skillId: string): Promise<number> => {
  if (!userId || !skillId) {
    console.warn('getNextSessionToPlay: userId or skillId is missing');
    return 1;
  }
  const db = await openDB();
  const result = await db.getFirstAsync<{ last_unlocked_session: number, is_completed: number }>(
    `SELECT last_unlocked_session, is_completed FROM user_skill_progress WHERE user_id = ? AND skill_id = ?`,
    [String(userId), String(skillId)]
  );

  // Get total sessions
  const skillInfo = await db.getFirstAsync<{ total_sessions: number }>(
    `SELECT total_sessions FROM skills WHERE id = ?`,
    skillId
  );
  const maxSessions = skillInfo?.total_sessions || 10;

  if (!result) return 1; // Default to session 1
  if (result.is_completed) return maxSessions; // Or handle as review
  return result.last_unlocked_session;
};

export const getLastSessionNumber = async (userId: string, skillId: string): Promise<number | null> => {
  if (!userId || !skillId) return null;
  const db = await openDB();
  const result = await db.getFirstAsync<{ session_number: number }>(
    `SELECT session_number FROM user_session_logs WHERE user_id = ? AND skill_id = ? ORDER BY created_at DESC LIMIT 1`,
    [String(userId), String(skillId)]
  );
  return result ? result.session_number : null;
};

// Deterministic Strategy: Questions are pre-assigned to session_index in DB.
export const getQuestionsForSession = async (skillId: string, sessionNumber: number, count = 10): Promise<Question[]> => {
  if (!skillId) return [];
  const db = await openDB();
  // Fetch questions specifically for this session
  let questions = await db.getAllAsync<Question>(
    `SELECT * FROM questions WHERE skill_id = ? AND session_index = ? LIMIT ?`,
    [String(skillId), Number(sessionNumber), Number(count)]
  );

  // If fewer than count (or 0) found (maybe legacy content without session_index?), 
  // fallback to deterministic slice based on sessionNumber.
  if (questions.length < count) {
    const offset = (Number(sessionNumber) - 1) * Number(count);
    questions = await db.getAllAsync<Question>(
      `SELECT * FROM questions WHERE skill_id = ? ORDER BY id LIMIT ? OFFSET ?`,
      [String(skillId), Number(count), Number(offset)]
    );
  }

  return questions;
};

export const saveSessionResult = async (
  userId: string,
  skillId: string,
  sessionNumber: number,
  score: number,
  correctCount: number,
  totalCount: number,
  timeTaken: number
): Promise<string[]> => {
  if (!userId || !skillId) {
    console.error("saveSessionResult: Missing userId or skillId", { userId, skillId });
    return [];
  }
  const db = await openDB();
  const passed = score >= 8 ? 1 : 0; // 80% pass rule (assuming score is out of 10)
  let newRewards: string[] = [];

  const logId = generateId();
  const now = new Date().toISOString();

  try {
      await db.withTransactionAsync(async () => {
        // 1. Insert Log
        await db.runAsync(
          `INSERT INTO user_session_logs 
          (id, user_id, skill_id, session_number, score, correct_count, total_count, time_taken_seconds, passed, created_at, synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            String(logId),
            String(userId),
            String(skillId),
            Number(sessionNumber),
            Number(score),
            Number(correctCount),
            Number(totalCount),
            Number(timeTaken),
            Number(passed),
            String(now)
          ]
        );


        // 2. Update Progress if passed
        if (passed) {
          newRewards = await computePassFailAndUpdateProgress(db, userId, skillId, sessionNumber, score);
        }
      });
  } catch (e) {
      console.error("saveSessionResult Error:", e);
      throw e;
  }

  return newRewards;
};

export const computePassFailAndUpdateProgress = async (
  db: SQLite.SQLiteDatabase,
  userId: string,
  skillId: string,
  sessionNumber: number,
  score: number
): Promise<string[]> => {
  // Get current progress
  const progress = await db.getFirstAsync<{
    id: string, sessions_passed: number, last_unlocked_session: number, stars_earned: number, is_completed: number
  }>(
    `SELECT id, sessions_passed, last_unlocked_session, stars_earned, is_completed FROM user_skill_progress WHERE user_id = ? AND skill_id = ?`,
    [String(userId), String(skillId)]
  );

  // Get total sessions for this skill
  const skillInfo = await db.getFirstAsync<{ total_sessions: number }>(
    `SELECT total_sessions FROM skills WHERE id = ?`,
    [String(skillId)]
  );
  const maxSessions = skillInfo?.total_sessions || 10;

  let sessionsPassed = progress?.sessions_passed || 0;
  let lastUnlocked = progress?.last_unlocked_session || 1;
  let stars = progress?.stars_earned || 0;
  let isCompleted = progress?.is_completed || 0;
  let progressId = progress?.id || generateId();

  // Logic: Only advance if this was the current unlocked session
  if (sessionNumber === lastUnlocked) {
    if (lastUnlocked < maxSessions) {
      lastUnlocked += 1;
    } else {
      isCompleted = 1;
    }
    // Update sessionsPassed to reflect highest cleared
    sessionsPassed = isCompleted ? maxSessions : (lastUnlocked - 1);
  }

  // Award Star if new session passed (simplified: stars = sessionsPassed)
  if (sessionsPassed > stars) {
    stars = sessionsPassed;
  }

  // Also check if they just finished session 1 for the first time
  if (progress === null && sessionNumber === 1) {
    sessionsPassed = 1;
    lastUnlocked = 2;
    stars = 1;
  }

  // Update DB
  // We use INSERT OR REPLACE. Since we have a UNIQUE index on (user_id, skill_id),
  // we want to preserve the ID if it exists, or use the new one.
  // Actually, we fetched the ID.
  await db.runAsync(
    `INSERT OR REPLACE INTO user_skill_progress 
      (id, user_id, skill_id, sessions_passed, stars_earned, is_completed, last_unlocked_session, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      String(progressId),
      String(userId),
      String(skillId),
      Number(sessionsPassed),
      Number(stars),
      Number(isCompleted),
      Number(lastUnlocked)
    ]
  );

  // Check rewards
  return await awardStarAndRewardIfEligible(db, userId, skillId, sessionsPassed, maxSessions);
};

export const awardStarAndRewardIfEligible = async (db: SQLite.SQLiteDatabase, userId: string, skillId: string, sessionsPassed: number, maxSessions: number = 10): Promise<string[]> => {
  const now = new Date().toISOString();
  const newRewards: string[] = [];

  // 1. First Session Ever Award (Global)
  // Check if this user has exactly 1 passed session log. 
  // Since this is called AFTER saving the current session log, a count of 1 means this is their first pass.
  const passedCountResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM user_session_logs WHERE user_id = ? AND passed = 1`,
    userId
  );

  if (passedCountResult && passedCountResult.count === 1) {
    const exists = await db.getFirstAsync(
      `SELECT id FROM rewards WHERE user_id = ? AND reward_type = 'first_session_trophy'`,
      userId
    );
    if (!exists) {
      await db.runAsync(
        `INSERT INTO rewards (id, user_id, skill_id, reward_type, awarded_at, synced) VALUES (?, ?, ?, ?, ?, 0)`,
        generateId(), userId, skillId, 'first_session_trophy', now
      );
      newRewards.push('first_session_trophy');
    }
  }

  // 2. 5 Sessions Award (Per Skill)
  if (sessionsPassed >= 5) {
    const exists = await db.getFirstAsync(
      `SELECT id FROM rewards WHERE user_id = ? AND skill_id = ? AND reward_type = 'star_5_sessions'`,
      userId, skillId
    );
    if (!exists) {
      await db.runAsync(
        `INSERT INTO rewards (id, user_id, skill_id, reward_type, awarded_at, synced) VALUES (?, ?, ?, ?, ?, 0)`,
        generateId(), userId, skillId, 'star_5_sessions', now
      );
      newRewards.push('star_5_sessions');
    }
  }

  // 3. Completion Award (Per Skill)
  if (sessionsPassed >= maxSessions) {
    const exists = await db.getFirstAsync(
      `SELECT id FROM rewards WHERE user_id = ? AND skill_id = ? AND reward_type = 'completion_trophy'`,
      userId, skillId
    );
    if (!exists) {
      await db.runAsync(
        `INSERT INTO rewards (id, user_id, skill_id, reward_type, awarded_at, synced) VALUES (?, ?, ?, ?, ?, 0)`,
        generateId(), userId, skillId, 'completion_trophy', now
      );
      newRewards.push('completion_trophy');
    }
  }

  return newRewards;
};

// --- Stats Helpers ---

export const getUserStats = async (userId: string) => {
  const db = await openDB();

  // Total Sessions Played
  const sessionsResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM user_session_logs WHERE user_id = ?`,
    userId
  );

  // Total Correct Answers
  const correctResult = await db.getFirstAsync<{ count: number }>(
    `SELECT SUM(correct_count) as count FROM user_session_logs WHERE user_id = ?`,
    userId
  );

  // Total Time Spent (in minutes)
  const timeResult = await db.getFirstAsync<{ seconds: number }>(
    `SELECT SUM(time_taken_seconds) as seconds FROM user_session_logs WHERE user_id = ?`,
    userId
  );

  // Total Stars Earned
  const starsResult = await db.getFirstAsync<{ count: number }>(
    `SELECT SUM(stars_earned) as count FROM user_skill_progress WHERE user_id = ?`,
    userId
  );

  // Total Skills Completed
  const skillsCompletedResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM user_skill_progress WHERE user_id = ? AND is_completed = 1`,
    userId
  );

  return {
    totalSessions: sessionsResult?.count || 0,
    totalCorrect: correctResult?.count || 0,
    totalTimeMinutes: Math.floor((timeResult?.seconds || 0) / 60),
    totalStars: starsResult?.count || 0,
    skillsCompleted: skillsCompletedResult?.count || 0,
  };
};

export const getAllSessionLogs = async (userId: string, limit = 20) => {
  const db = await openDB();
  // Join with Skills to get skill name ? No, skill table might not be easy to join if we didn't export it. 
  // Let's just fetch logs for now, we can fetch skill names if needed or extensive join.
  // Actually, let's try to join with skills table for better UI.
  return await db.getAllAsync<{
    id: string;
    skill_id: string;
    skill_name: string;
    session_number: number;
    score: number;
    correct_count: number;
    total_count: number;
    created_at: string;
    passed: number;
  }>(
    `SELECT 
        l.*, 
        s.name as skill_name 
     FROM user_session_logs l
     LEFT JOIN skills s ON l.skill_id = s.id
     WHERE l.user_id = ? 
     ORDER BY l.created_at DESC 
     LIMIT ?`,
    userId, limit
  );
};

// --- Sync Helpers ---


export const getUnsyncedProgress = async (userId: string, limit = 50): Promise<UserSkillProgress[]> => {
  const db = await openDB();
  return await db.getAllAsync<UserSkillProgress>(
    `SELECT * FROM user_skill_progress WHERE user_id = ? AND synced = 0 LIMIT ?`,
    userId, limit
  );
};

export const getUnsyncedRewards = async (userId: string, limit = 50): Promise<Reward[]> => {
  const db = await openDB();
  return await db.getAllAsync<Reward>(
    `SELECT * FROM rewards WHERE user_id = ? AND synced = 0 LIMIT ?`,
    userId, limit
  );
};

export const getUserRewards = async (userId: string) => {
  const db = await openDB();
  return await db.getAllAsync(
    `SELECT r.*, s.name as skill_name 
     FROM rewards r
     LEFT JOIN skills s ON r.skill_id = s.id
     WHERE r.user_id = ? 
     ORDER BY r.awarded_at DESC`,
    userId
  );
};

export const getUnsyncedSessionLogs = async (userId: string, limit = 50): Promise<UserSessionLog[]> => {
  const db = await openDB();
  return await db.getAllAsync<UserSessionLog>(
    `SELECT * FROM user_session_logs WHERE user_id = ? AND synced = 0 LIMIT ?`,
    userId, limit
  );
};

export const markRowsSynced = async (tableName: 'user_session_logs' | 'user_skill_progress' | 'rewards', ids: string[]) => {
  if (ids.length === 0) return;
  const db = await openDB();
  const placeholders = ids.map(() => '?').join(',');
  // Validate tableName to prevent SQL injection
  if (!['user_session_logs', 'user_skill_progress', 'rewards'].includes(tableName)) return;

  await db.runAsync(
    `UPDATE ${tableName} SET synced = 1 WHERE id IN (${placeholders})`,
    ...ids
  );
};

// Dashboard Stats
export const getUserDashboardStats = async (userId: string) => {
  const db = await openDB();
  
  // Get total stars earned
  const starsResult = await db.getFirstAsync<{ total_stars: number | null }>(
    `SELECT SUM(stars_earned) as total_stars FROM user_skill_progress WHERE user_id = ?`,
    [userId]
  );
  
  // Get completed levels/skills count
  const completedResult = await db.getFirstAsync<{ completed: number }>(
    `SELECT COUNT(*) as completed FROM user_skill_progress WHERE user_id = ? AND is_completed = 1`,
    [userId]
  );
  
  // Get total levels in progress
  const inProgressResult = await db.getFirstAsync<{ in_progress: number }>(
    `SELECT COUNT(*) as in_progress FROM user_skill_progress WHERE user_id = ? AND is_completed = 0 AND sessions_passed > 0`,
    [userId]
  );
  
  // Get subjects with their progress
  const subjectsInProgress = await db.getAllAsync<{
    id: string;
    name: string;
    image_url: string | null;
    total_skills: number;
    completed_skills: number;
    in_progress_skills: number;
    total_stars: number;
  }>(
    `SELECT 
      s.id, 
      s.name, 
      s.image_url,
      COUNT(DISTINCT sk.id) as total_skills,
      SUM(CASE WHEN usp.is_completed = 1 THEN 1 ELSE 0 END) as completed_skills,
      SUM(CASE WHEN usp.is_completed = 0 AND usp.sessions_passed > 0 THEN 1 ELSE 0 END) as in_progress_skills,
      SUM(COALESCE(usp.stars_earned, 0)) as total_stars
     FROM subjects s
     INNER JOIN user_subjects us ON s.id = us.subject_id
     LEFT JOIN skills sk ON sk.subject_id = s.id
     LEFT JOIN user_skill_progress usp ON usp.skill_id = sk.id AND usp.user_id = ?
     WHERE us.user_id = ?
     GROUP BY s.id, s.name, s.image_url
     ORDER BY total_stars DESC`,
    [userId, userId]
  );
  
  // Get recent session logs (last 5)
  const recentSessions = await db.getAllAsync<{
    skill_name: string;
    subject_name: string;
    score: number;
    passed: number;
    created_at: string;
  }>(
    `SELECT 
      sk.name as skill_name,
      s.name as subject_name,
      usl.score,
      usl.passed,
      usl.created_at
     FROM user_session_logs usl
     INNER JOIN skills sk ON usl.skill_id = sk.id
     INNER JOIN subjects s ON sk.subject_id = s.id
     WHERE usl.user_id = ?
     ORDER BY usl.created_at DESC
     LIMIT 5`,
    [userId]
  );
  
  return {
    totalStars: starsResult?.total_stars || 0,
    completedLevels: completedResult?.completed || 0,
    inProgressLevels: inProgressResult?.in_progress || 0,
    subjectsInProgress,
    recentSessions
  };
};

// Get next recommended skill for a user
export const getNextRecommendedSkill = async (userId: string) => {
  const db = await openDB();
  
  // Find the first skill that's not completed, ordered by sessions_passed (prioritize in-progress)
  const nextSkill = await db.getFirstAsync<{
    skill_id: string;
    skill_name: string;
    subject_id: string;
    subject_name: string;
    sessions_passed: number;
    last_unlocked_session: number;
  }>(
    `SELECT 
      sk.id as skill_id,
      sk.name as skill_name,
      s.id as subject_id,
      s.name as subject_name,
      COALESCE(usp.sessions_passed, 0) as sessions_passed,
      COALESCE(usp.last_unlocked_session, 1) as last_unlocked_session
     FROM skills sk
     INNER JOIN subjects s ON sk.subject_id = s.id
     INNER JOIN user_subjects us ON s.id = us.subject_id
     LEFT JOIN user_skill_progress usp ON usp.skill_id = sk.id AND usp.user_id = ?
     WHERE us.user_id = ? AND (usp.is_completed IS NULL OR usp.is_completed = 0)
     ORDER BY COALESCE(usp.sessions_passed, 0) DESC, sk.id ASC
     LIMIT 1`,
    [userId, userId]
  );
  
  return nextSkill;
};

// Utils
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
