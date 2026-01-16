export const SCHEMA_VERSION = 4;

export const CREATE_TABLES = [
  // Subjects
  `CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon_uri TEXT,
    image_url TEXT
  );`,

  // Skills
  `CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    standard TEXT NOT NULL,
    category TEXT,
    total_sessions INTEGER DEFAULT 10,
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  );`,

  // Questions
  `CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY NOT NULL,
    skill_id TEXT NOT NULL,
    session_index INTEGER NOT NULL, -- 1 to 10
    type TEXT DEFAULT 'mcq', -- mcq, selection, image_selection, drag_order, binary
    question_text TEXT NOT NULL,
    options_json TEXT NOT NULL, -- JSON array
    correct_answer TEXT NOT NULL,
    media_uri TEXT,
    audio_url TEXT,
    explanation TEXT,
    FOREIGN KEY(skill_id) REFERENCES skills(id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_questions_skill_session ON questions(skill_id, session_index);`,

  // User Subjects (Local Selection)
  `CREATE TABLE IF NOT EXISTS user_subjects (
    user_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    PRIMARY KEY (user_id, subject_id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  );`,

  // User Progress (Local)
  `CREATE TABLE IF NOT EXISTS user_skill_progress (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    sessions_passed INTEGER DEFAULT 0,
    stars_earned INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    last_unlocked_session INTEGER DEFAULT 1,
    synced INTEGER DEFAULT 0,
    FOREIGN KEY(skill_id) REFERENCES skills(id)
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_user_skill ON user_skill_progress(user_id, skill_id);`,
  `CREATE INDEX IF NOT EXISTS idx_progress_synced ON user_skill_progress(synced);`,

  // Session Logs (History)
  `CREATE TABLE IF NOT EXISTS user_session_logs (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    session_number INTEGER NOT NULL,
    score INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    total_count INTEGER NOT NULL,
    time_taken_seconds INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    synced INTEGER DEFAULT 0,
    FOREIGN KEY(skill_id) REFERENCES skills(id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_logs_user_skill ON user_session_logs(user_id, skill_id);`,
  `CREATE INDEX IF NOT EXISTS idx_logs_synced ON user_session_logs(synced);`,

  // Rewards
  `CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    reward_type TEXT NOT NULL,
    awarded_at TEXT NOT NULL,
    synced INTEGER DEFAULT 0,
    FOREIGN KEY(skill_id) REFERENCES skills(id)
  );`,

  // Migrations
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  );`
];
