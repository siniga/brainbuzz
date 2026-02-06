export const translations = {
  en: {
    // Weekly Report
    weeklyReport: 'This Week\'s Report',
    weekSummary: 'Week Summary',
    sessions: 'Sessions',
    stars: 'Stars',
    activeDays: 'Active Days',
    averageScore: 'Average Score',
    timeSpent: 'Time Spent',
    weeklyActivity: 'Weekly Activity',
    excellentConsistency: '🎉 Excellent consistency!',
    goodEffort: '👍 Good effort, try for 5 days next week',
    practiceMore: '⚠️ Practice more regularly for better results',
    subjectPerformance: 'Subject Performance',
    insightsForParents: 'Insights for Parents',
    strongestSubject: 'Strongest Subject',
    needsImprovement: 'Needs Improvement',
    recommendation: 'Recommendation',
    encourageDaily: 'Encourage daily practice, especially in',
    celebrateProgress: 'Celebrate their progress in',
    keepItUp: 'Keep it up!',
    accuracy: 'Accuracy',
    loading: 'Loading',
    loadingReport: 'Loading report...',
    
    // Day abbreviations
    days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    daysFull: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    
    // Daily Report
    todayReport: 'Today\'s Report',
    todaySummary: 'Today\'s Summary',
    sessionsToday: 'Sessions Today',
    bestAchievement: 'Best Achievement',
    noActivityToday: 'No activity today',
    encourageChild: 'Encourage your child to practice!',
    completedSession: 'Completed session!',
    
    // Monthly Report
    monthlyReport: 'This Month\'s Report',
    monthSummary: 'Month Summary',
    totalStars: 'Total Stars',
    skillsCompleted: 'Skills Completed',
    longestStreak: 'Longest Streak',
    totalSessions: 'Total Sessions',
    weeklyTrend: 'Weekly Trend',
    improvement: 'Improvement',
    topAchievements: 'Top Achievements',
    
    // Performance levels
    excellent: 'Excellent',
    good: 'Good',
    needsWork: 'Needs Work',
    
    // Common
    back: 'Back',
    close: 'Close',
  },
  
  sw: {
    // Weekly Report (Swahili)
    weeklyReport: 'Ripoti ya Wiki Hii',
    weekSummary: 'Muhtasari wa Wiki',
    sessions: 'Vipindi',
    stars: 'Nyota',
    activeDays: 'Siku za Mazoezi',
    averageScore: 'Wastani wa Alama',
    timeSpent: 'Muda Uliotumika',
    weeklyActivity: 'Shughuli za Wiki',
    excellentConsistency: '🎉 Uthabiti mzuri sana!',
    goodEffort: '👍 Jitihada nzuri, jaribu siku 5 wiki ijayo',
    practiceMore: '⚠️ Zoeza zaidi kwa matokeo bora',
    subjectPerformance: 'Utendaji wa Masomo',
    insightsForParents: 'Maoni kwa Wazazi',
    strongestSubject: 'Somo Bora Zaidi',
    needsImprovement: 'Linahitaji Kuboreshwa',
    recommendation: 'Mapendekezo',
    encourageDaily: 'Himiza mazoezi ya kila siku, hasa katika',
    celebrateProgress: 'Sherehekea maendeleo yao katika',
    keepItUp: 'Endelea hivyo!',
    accuracy: 'Usahihi',
    loading: 'Inapakia',
    loadingReport: 'Inapakia ripoti...',
    
    // Day abbreviations (Swahili)
    days: ['J', 'J', 'J', 'A', 'I', 'J', 'J'], // Jumatatu, Jumanne, Jumatano, Alhamisi, Ijumaa, Jumamosi, Jumapili
    daysFull: ['Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi', 'Jumapili'],
    
    // Daily Report
    todayReport: 'Ripoti ya Leo',
    todaySummary: 'Muhtasari wa Leo',
    sessionsToday: 'Vipindi Leo',
    bestAchievement: 'Mafanikio Bora',
    noActivityToday: 'Hakuna shughuli leo',
    encourageChild: 'Himiza mtoto wako kufanya mazoezi!',
    completedSession: 'Kipindi kimekamilika!',
    
    // Monthly Report
    monthlyReport: 'Ripoti ya Mwezi Huu',
    monthSummary: 'Muhtasari wa Mwezi',
    totalStars: 'Jumla ya Nyota',
    skillsCompleted: 'Ujuzi Uliokamilika',
    longestStreak: 'Mfululizo Mrefu Zaidi',
    totalSessions: 'Jumla ya Vipindi',
    weeklyTrend: 'Mwelekeo wa Kila Wiki',
    improvement: 'Maendeleo',
    topAchievements: 'Mafanikio Bora',
    
    // Performance levels
    excellent: 'Bora Sana',
    good: 'Nzuri',
    needsWork: 'Inahitaji Kufanyiwa Kazi',
    
    // Common
    back: 'Rudi',
    close: 'Funga',
  }
};

// Helper function to get translation
export const t = (key, language = 'en') => {
  const keys = key.split('.');
  let value = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || translations.en[key] || key;
};
