export interface Subject {
  id: string;
  name: string;
  icon_uri?: string;
  image_url?: string;
}

export interface Skill {
  id: string;
  subject_id: string;
  name: string;
  standard?: string; // "Standard 1", "Standard 2"...
  standard_id?: number; // Added to match API
  category: string; // "Numbers", "Geometry"...
  total_sessions: number; // default 10
}

export interface Question {
  id: string;
  skill_id: string;
  session_number?: number; // 1-10 (Matches DB)
  session_index?: number; // Legacy or alias
  type?: string; // mcq, selection, image_selection, drag_order, binary
  question_text: string;
  options_json: string; // JSON array of strings
  correct_answer: string;
  media_url?: string; // Matches API
  media_uri?: string;
  explanation?: string;
}


export interface UserSkillProgress {
  id: string; // Added for sync
  user_id: string;
  skill_id: string;
  sessions_passed: number;
  stars_earned: number;
  is_completed: number; // 0 or 1
  last_unlocked_session: number; // 1-10
  synced: number; // 0 or 1
}

export interface UserSessionLog {
  id: string;
  user_id: string;
  skill_id: string;
  session_number: number;
  score: number;
  correct_count: number;
  total_count: number;
  time_taken_seconds: number;
  passed: number; // 0 or 1
  created_at: string; // ISO timestamp
  synced: number; // 0 or 1
}

export interface Reward {
  id: string;
  user_id: string;
  skill_id: string;
  reward_type: string; // "star_5_sessions", "completion_trophy"
  awarded_at: string;
  synced: number; // 0 or 1
}
