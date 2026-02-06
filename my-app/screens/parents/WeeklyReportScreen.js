import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getWeeklyStats, getPerformanceColor, getPerformanceLabel, formatTime } from '../../database/reportQueries';
import { useLanguage } from '../../context/LanguageContext';

const MAIN_BG = require('../../assets/screens/main_bg.png');

export default function WeeklyReportScreen({ route, navigation }) {
  const { userId } = route.params;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language, changeLanguage, t } = useLanguage();

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      const weeklyData = await getWeeklyStats(userId);
      setStats(weeklyData);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = ({ value, maxValue, color = '#4A90E2' }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
      </View>
    );
  };

  const SubjectCard = ({ subject }) => {
    const color = getPerformanceColor(subject.accuracy);
    const label = getPerformanceLabel(subject.accuracy);
    
    return (
      <View style={styles.subjectCard}>
        <View style={styles.subjectHeader}>
          <Text style={styles.subjectName}>{subject.subjectName}</Text>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>
        <View style={styles.subjectStats}>
          <View style={styles.subjectStat}>
            <Text style={styles.subjectStatValue}>{Math.round(subject.accuracy)}%</Text>
            <Text style={styles.subjectStatLabel}>Accuracy</Text>
          </View>
          <View style={styles.subjectStat}>
            <Text style={styles.subjectStatValue}>{subject.sessionCount}</Text>
            <Text style={styles.subjectStatLabel}>Sessions</Text>
          </View>
        </View>
        <ProgressBar value={subject.accuracy} maxValue={100} color={color} />
      </View>
    );
  };

  if (loading) {
    return (
      <ImageBackground source={MAIN_BG} style={styles.container} resizeMode="cover">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading weekly report...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const bestSubject = stats?.subjectBreakdown?.[0];
  const weakestSubject = stats?.subjectBreakdown?.[stats.subjectBreakdown.length - 1];

  return (
    <ImageBackground source={MAIN_BG} style={styles.container} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('weeklyReport')}</Text>
          
          {/* Language Toggle Button */}
          <TouchableOpacity 
            onPress={() => changeLanguage(language === 'en' ? 'sw' : 'en')}
            style={styles.languageButton}
          >
            <Text style={styles.languageButtonText}>
              {language === 'en' ? '🇰🇪 SW' : '🇬🇧 EN'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📅 {t('weekSummary')}</Text>
            <Text style={styles.summaryDate}>{new Date().toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{stats?.totalSessions || 0}</Text>
                <Text style={styles.summaryStatLabel}>{t('sessions')}</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{stats?.starsEarned || 0}</Text>
                <Text style={styles.summaryStatLabel}>{t('stars')}</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{stats?.activeDays || 0}/7</Text>
                <Text style={styles.summaryStatLabel}>{t('activeDays')}</Text>
              </View>
            </View>

            <View style={styles.performanceRow}>
              <View style={styles.performanceItem}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.performanceLabel}>{t('averageScore')}</Text>
                <Text style={styles.performanceValue}>{stats?.avgScore || 0}%</Text>
              </View>
              <View style={styles.performanceItem}>
                <Ionicons name="time" size={20} color="#4A90E2" />
                <Text style={styles.performanceLabel}>{t('timeSpent')}</Text>
                <Text style={styles.performanceValue}>{formatTime(stats?.totalTime || 0)}</Text>
              </View>
            </View>
          </View>

          {/* Activity Tracker */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>🔥 {t('weeklyActivity')}</Text>
            <View style={styles.activityDays}>
              {t('days').map((day, index) => {
                // Check if this specific day of the week is in the active days array
                const isActive = stats?.activeDaysOfWeek?.includes(index) || false;
                
                return (
                  <View key={index} style={styles.dayContainer}>
                    <View style={[
                      styles.dayCircle,
                      isActive && styles.dayActive
                    ]}>
                      <Text style={[
                        styles.dayText,
                        isActive && styles.dayTextActive
                      ]}>{day}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <Text style={styles.activitySubtext}>
              {stats?.activeDays >= 5 
                ? t('excellentConsistency')
                : stats?.activeDays >= 3
                ? t('goodEffort')
                : t('practiceMore')}
            </Text>
          </View>

          {/* Subject Performance */}
          {stats?.subjectBreakdown && stats.subjectBreakdown.length > 0 && (
            <View style={styles.subjectsSection}>
              <Text style={styles.sectionTitle}>📚 {t('subjectPerformance')}</Text>
              {stats.subjectBreakdown.map((subject, index) => (
                <SubjectCard key={index} subject={subject} />
              ))}
            </View>
          )}

          {/* Insights & Recommendations */}
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>💡 {t('insightsForParents')}</Text>
            
            {stats?.avgScore >= 80 && (
              <View style={[styles.insightCard, { borderLeftColor: '#10B981' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Great Progress!</Text>
                  <Text style={styles.insightText}>Your child is performing excellently with an average of {stats.avgScore}%</Text>
                </View>
              </View>
            )}

            {bestSubject && (
              <View style={[styles.insightCard, { borderLeftColor: '#4A90E2' }]}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Strongest Subject</Text>
                  <Text style={styles.insightText}>
                    {bestSubject.subjectName} ({Math.round(bestSubject.accuracy)}%) - Keep encouraging this!
                  </Text>
                </View>
              </View>
            )}

            {weakestSubject && weakestSubject.accuracy < 70 && (
              <View style={[styles.insightCard, { borderLeftColor: '#F59E0B' }]}>
                <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Needs Attention</Text>
                  <Text style={styles.insightText}>
                    {weakestSubject.subjectName} needs more practice ({Math.round(weakestSubject.accuracy)}%)
                  </Text>
                </View>
              </View>
            )}

            {stats?.activeDays < 3 && (
              <View style={[styles.insightCard, { borderLeftColor: '#EF4444' }]}>
                <Ionicons name="warning" size={24} color="#EF4444" />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Consistency Needed</Text>
                  <Text style={styles.insightText}>
                    Only {stats.activeDays} days active. Aim for daily 15-minute sessions.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Items */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>🎯 Goals for Next Week</Text>
            <View style={styles.actionCard}>
              <Ionicons name="flag" size={20} color="#4A90E2" />
              <Text style={styles.actionText}>Complete at least 5 sessions</Text>
            </View>
            {weakestSubject && (
              <View style={styles.actionCard}>
                <Ionicons name="flag" size={20} color="#4A90E2" />
                <Text style={styles.actionText}>Practice {weakestSubject.subjectName} daily</Text>
              </View>
            )}
            <View style={styles.actionCard}>
              <Ionicons name="flag" size={20} color="#4A90E2" />
              <Text style={styles.actionText}>Maintain 15 minutes of daily learning</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    padding: 8,
  },
  languageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  languageButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFF',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  summaryDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  summaryStatDivider: {
    width: 1,
    backgroundColor: '#DDD',
  },
  performanceRow: {
    flexDirection: 'row',
    gap: 15,
  },
  performanceItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  activitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  activityDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayActive: {
    backgroundColor: '#10B981',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  dayTextActive: {
    color: '#FFF',
  },
  activitySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  subjectsSection: {
    marginBottom: 20,
  },
  subjectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  subjectStat: {
    alignItems: 'center',
  },
  subjectStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subjectStatLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 40,
    textAlign: 'right',
  },
  insightsSection: {
    marginBottom: 20,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  insightContent: {
    flex: 1,
    marginLeft: 15,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  insightText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  actionSection: {
    marginBottom: 30,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  actionText: {
    marginLeft: 15,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});
