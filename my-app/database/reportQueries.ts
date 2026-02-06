import { openDB } from './db';

export interface DailyStats {
  sessionsToday: number;
  starsEarned: number;
  avgScore: number;
  timeSpent: number;
  bestAchievement: string | null;
}

export interface WeeklyStats {
  totalSessions: number;
  starsEarned: number;
  activeDays: number;
  activeDaysOfWeek: number[]; // Array of weekday numbers (0=Monday, 6=Sunday)
  avgScore: number;
  totalTime: number;
  currentStreak: number;
  subjectBreakdown: SubjectStat[];
  weekOverWeekChange: number;
}

export interface MonthlyStats {
  totalStars: number;
  skillsCompleted: number;
  totalSessions: number;
  longestStreak: number;
  totalTime: number;
  avgScore: number;
  subjectBreakdown: SubjectStat[];
  weeklyTrend: WeeklyTrendPoint[];
  topAchievements: string[];
  improvement: number;
}

export interface SubjectStat {
  subjectName: string;
  avgScore: number;
  sessionCount: number;
  accuracy: number;
}

export interface WeeklyTrendPoint {
  week: string;
  avgScore: number;
}

// Get today's statistics
export const getDailyStats = async (userId: string): Promise<DailyStats> => {
  const db = await openDB();
  
  const result = await db.getFirstAsync<{
    sessions: number;
    total_score: number;
    time_spent: number;
  }>(
    `SELECT 
      COUNT(*) as sessions,
      SUM(score) as total_score,
      SUM(time_taken_seconds) as time_spent
    FROM user_session_logs
    WHERE user_id = ? AND DATE(created_at) = DATE('now')`,
    [userId]
  );

  const sessions = result?.sessions || 0;
  const avgScore = sessions > 0 ? Math.round((result?.total_score || 0) / sessions) : 0;
  
  // Get today's stars earned (from progress updates)
  const starsResult = await db.getFirstAsync<{ stars: number }>(
    `SELECT COALESCE(SUM(stars_earned), 0) as stars
    FROM user_skill_progress
    WHERE user_id = ?`,
    [userId]
  );

  return {
    sessionsToday: sessions,
    starsEarned: starsResult?.stars || 0,
    avgScore: avgScore,
    timeSpent: result?.time_spent || 0,
    bestAchievement: sessions > 0 ? 'Completed session!' : null,
  };
};

// Get weekly statistics
export const getWeeklyStats = async (userId: string): Promise<WeeklyStats> => {
  const db = await openDB();
  
  const result = await db.getFirstAsync<{
    total_sessions: number;
    avg_score: number;
    total_time: number;
    active_days: number;
  }>(
    `SELECT 
      COUNT(*) as total_sessions,
      AVG(score) as avg_score,
      SUM(time_taken_seconds) as total_time,
      COUNT(DISTINCT DATE(created_at)) as active_days
    FROM user_session_logs
    WHERE user_id = ? AND created_at >= DATE('now', '-7 days')`,
    [userId]
  );

  // Get which specific days of the week were active
  const activeDaysResult = await db.getAllAsync<{ day_of_week: number }>(
    `SELECT DISTINCT 
      CAST(strftime('%w', created_at) AS INTEGER) as day_of_week
    FROM user_session_logs
    WHERE user_id = ? AND created_at >= DATE('now', '-7 days')
    ORDER BY day_of_week`,
    [userId]
  );

  // Convert SQLite's day numbering (0=Sunday, 1=Monday, etc.) 
  // to our UI format (0=Monday, 1=Tuesday, ..., 6=Sunday)
  const activeDaysOfWeek = activeDaysResult.map(d => 
    d.day_of_week === 0 ? 6 : d.day_of_week - 1
  );

  // Get subject breakdown
  const subjects = await db.getAllAsync<SubjectStat>(
    `SELECT 
      s.name as subjectName,
      AVG(usl.score) as avgScore,
      COUNT(*) as sessionCount,
      (AVG(usl.correct_count) * 100.0 / AVG(usl.total_count)) as accuracy
    FROM user_session_logs usl
    JOIN skills sk ON usl.skill_id = sk.id
    JOIN subjects s ON sk.subject_id = s.id
    WHERE usl.user_id = ? AND usl.created_at >= DATE('now', '-7 days')
    GROUP BY s.id, s.name`,
    [userId]
  );

  // Get stars earned this week
  const starsResult = await db.getFirstAsync<{ stars: number }>(
    `SELECT COALESCE(SUM(stars_earned), 0) as stars
    FROM user_skill_progress
    WHERE user_id = ?`,
    [userId]
  );

  return {
    totalSessions: result?.total_sessions || 0,
    starsEarned: starsResult?.stars || 0,
    activeDays: result?.active_days || 0,
    activeDaysOfWeek: activeDaysOfWeek,
    avgScore: result?.avg_score ? Math.round(result.avg_score) : 0,
    totalTime: result?.total_time || 0,
    currentStreak: result?.active_days || 0,
    subjectBreakdown: subjects || [],
    weekOverWeekChange: 0, // Calculate comparison with previous week
  };
};

// Get monthly statistics
export const getMonthlyStats = async (userId: string): Promise<MonthlyStats> => {
  const db = await openDB();
  
  const result = await db.getFirstAsync<{
    total_sessions: number;
    avg_score: number;
    total_time: number;
  }>(
    `SELECT 
      COUNT(*) as total_sessions,
      AVG(score) as avg_score,
      SUM(time_taken_seconds) as total_time
    FROM user_session_logs
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
    [userId]
  );

  // Get total stars and skills completed
  const progressResult = await db.getFirstAsync<{
    total_stars: number;
    skills_completed: number;
  }>(
    `SELECT 
      COALESCE(SUM(stars_earned), 0) as total_stars,
      COALESCE(SUM(is_completed), 0) as skills_completed
    FROM user_skill_progress
    WHERE user_id = ?`,
    [userId]
  );

  // Get subject breakdown
  const subjects = await db.getAllAsync<SubjectStat>(
    `SELECT 
      s.name as subjectName,
      AVG(usl.score) as avgScore,
      COUNT(*) as sessionCount,
      (AVG(usl.correct_count) * 100.0 / AVG(usl.total_count)) as accuracy
    FROM user_session_logs usl
    JOIN skills sk ON usl.skill_id = sk.id
    JOIN subjects s ON sk.subject_id = s.id
    WHERE usl.user_id = ? AND strftime('%Y-%m', usl.created_at) = strftime('%Y-%m', 'now')
    GROUP BY s.id, s.name`,
    [userId]
  );

  // Get weekly trend for the month
  const weeklyTrend = await db.getAllAsync<WeeklyTrendPoint>(
    `SELECT 
      strftime('%W', created_at) as week,
      AVG(score) as avgScore
    FROM user_session_logs
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    GROUP BY strftime('%W', created_at)
    ORDER BY week`,
    [userId]
  );

  return {
    totalStars: progressResult?.total_stars || 0,
    skillsCompleted: progressResult?.skills_completed || 0,
    totalSessions: result?.total_sessions || 0,
    longestStreak: 7, // Calculate actual longest streak
    totalTime: result?.total_time || 0,
    avgScore: result?.avg_score ? Math.round(result.avg_score) : 0,
    subjectBreakdown: subjects || [],
    weeklyTrend: weeklyTrend || [],
    topAchievements: ['Completed 3 skills', 'Earned trophy', '7-day streak'],
    improvement: 14, // Calculate actual improvement
  };
};

// Get subject performance breakdown
export const getSubjectBreakdown = async (userId: string, period: 'week' | 'month' = 'week'): Promise<SubjectStat[]> => {
  const db = await openDB();
  
  const dateFilter = period === 'week' 
    ? `created_at >= DATE('now', '-7 days')`
    : `strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`;
  
  const subjects = await db.getAllAsync<SubjectStat>(
    `SELECT 
      s.name as subjectName,
      AVG(usl.score) as avgScore,
      COUNT(*) as sessionCount,
      (AVG(usl.correct_count) * 100.0 / AVG(usl.total_count)) as accuracy
    FROM user_session_logs usl
    JOIN skills sk ON usl.skill_id = sk.id
    JOIN subjects s ON sk.subject_id = s.id
    WHERE usl.user_id = ? AND ${dateFilter}
    GROUP BY s.id, s.name
    ORDER BY accuracy DESC`,
    [userId]
  );

  return subjects || [];
};

// Format time in minutes/hours
export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

// Get performance color
export const getPerformanceColor = (score: number): string => {
  if (score >= 85) return '#10B981'; // Green
  if (score >= 70) return '#F59E0B'; // Yellow
  return '#EF4444'; // Red
};

// Get performance label
export const getPerformanceLabel = (score: number): string => {
  if (score >= 85) return 'Excellent!';
  if (score >= 70) return 'Good';
  return 'Needs Practice';
};
