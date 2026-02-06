import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMonthlyStats, getPerformanceColor, formatTime } from '../../database/reportQueries';

const MAIN_BG = require('../../assets/screens/main_bg.png');

export default function MonthlyReportScreen({ route, navigation }) {
  const { userId } = route.params;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthlyData();
  }, []);

  const loadMonthlyData = async () => {
    try {
      const monthlyData = await getMonthlyStats(userId);
      setStats(monthlyData);
    } catch (error) {
      console.error('Error loading monthly stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ImageBackground source={MAIN_BG} style={styles.container} resizeMode="cover">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading monthly report...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <ImageBackground source={MAIN_BG} style={styles.container} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Monthly Report</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Month Header */}
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>📅 {currentMonth}</Text>
            <Text style={styles.monthSubtitle}>Complete Learning Summary</Text>
          </View>

          {/* Achievement Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>🎯 Achievement Summary</Text>
            
            <View style={styles.achievementRow}>
              <View style={styles.achievementItem}>
                <View style={styles.achievementCircle}>
                  <Ionicons name="star" size={32} color="#FFD700" />
                </View>
                <Text style={styles.achievementValue}>{stats?.totalStars || 0}</Text>
                <Text style={styles.achievementLabel}>Total Stars</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, (stats?.totalStars / 150) * 100)}%` }]} />
                </View>
              </View>

              <View style={styles.achievementItem}>
                <View style={styles.achievementCircle}>
                  <Ionicons name="checkmark-done" size={32} color="#10B981" />
                </View>
                <Text style={styles.achievementValue}>{stats?.skillsCompleted || 0}</Text>
                <Text style={styles.achievementLabel}>Skills Completed</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, (stats?.skillsCompleted / 15) * 100)}%`, backgroundColor: '#10B981' }]} />
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="book" size={20} color="#4A90E2" />
                <Text style={styles.statItemValue}>{stats?.totalSessions || 0}</Text>
                <Text style={styles.statItemLabel}>Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={20} color="#F59E0B" />
                <Text style={styles.statItemValue}>{stats?.longestStreak || 0}</Text>
                <Text style={styles.statItemLabel}>Best Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={20} color="#8B5CF6" />
                <Text style={styles.statItemValue}>{formatTime(stats?.totalTime || 0)}</Text>
                <Text style={styles.statItemLabel}>Total Time</Text>
              </View>
            </View>
          </View>

          {/* Performance Breakdown */}
          <View style={styles.performanceCard}>
            <Text style={styles.cardTitle}>📊 Performance Breakdown</Text>
            
            <View style={styles.overallScore}>
              <Text style={styles.overallLabel}>Overall Score</Text>
              <Text style={styles.overallValue}>{stats?.avgScore || 0}%</Text>
              {stats?.improvement > 0 && (
                <View style={styles.improvementBadge}>
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                  <Text style={styles.improvementText}>+{stats.improvement}%</Text>
                </View>
              )}
            </View>

            {stats?.subjectBreakdown && stats.subjectBreakdown.length > 0 && (
              <View style={styles.subjectsBreakdown}>
                <Text style={styles.subjectsTitle}>By Subject:</Text>
                {stats.subjectBreakdown.map((subject, index) => {
                  const color = getPerformanceColor(subject.accuracy);
                  return (
                    <View key={index} style={styles.subjectRow}>
                      <View style={[styles.subjectDot, { backgroundColor: color }]} />
                      <Text style={styles.subjectName}>{subject.subjectName}</Text>
                      <Text style={[styles.subjectScore, { color }]}>
                        {Math.round(subject.accuracy)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Top Achievements */}
          {stats?.topAchievements && stats.topAchievements.length > 0 && (
            <View style={styles.achievementsCard}>
              <Text style={styles.cardTitle}>🏆 Top Achievements</Text>
              {stats.topAchievements.map((achievement, index) => (
                <View key={index} style={styles.achievementBadge}>
                  <Ionicons name="medal" size={24} color="#FFD700" />
                  <Text style={styles.achievementBadgeText}>{achievement}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Learning Trend */}
          {stats?.weeklyTrend && stats.weeklyTrend.length > 0 && (
            <View style={styles.trendCard}>
              <Text style={styles.cardTitle}>📈 Learning Trend</Text>
              <View style={styles.trendChart}>
                {stats.weeklyTrend.map((week, index) => (
                  <View key={index} style={styles.trendBar}>
                    <View style={styles.trendBarFill}>
                      <View style={[styles.trendBarInner, { height: `${week.avgScore}%` }]} />
                    </View>
                    <Text style={styles.trendLabel}>W{index + 1}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.trendCaption}>
                {stats.improvement > 0 ? '✅ Improving steadily!' : '📊 Maintaining performance'}
              </Text>
            </View>
          )}

          {/* Parent Insights */}
          <View style={styles.insightsCard}>
            <Text style={styles.cardTitle}>💡 For Parents</Text>
            
            <View style={styles.insightSection}>
              <Text style={styles.insightHeading}>✓ GREAT NEWS:</Text>
              <Text style={styles.insightText}>• Your child completed {stats?.totalSessions || 0} sessions this month</Text>
              {stats?.improvement > 0 && (
                <Text style={styles.insightText}>• Performance improved by {stats.improvement}%</Text>
              )}
              {stats?.skillsCompleted > 0 && (
                <Text style={styles.insightText}>• Mastered {stats.skillsCompleted} new skills</Text>
              )}
            </View>

            <View style={styles.insightSection}>
              <Text style={styles.insightHeading}>🎯 NEXT MONTH GOALS:</Text>
              <Text style={styles.insightText}>• Complete 5 more skills</Text>
              <Text style={styles.insightText}>• Maintain daily practice</Text>
              <Text style={styles.insightText}>• Improve weaker subjects</Text>
            </View>

            <View style={styles.actionBox}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.actionText}>
                Encourage 15 minutes of daily practice for best results!
              </Text>
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
  monthHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  monthSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  achievementRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  achievementItem: {
    flex: 1,
    alignItems: 'center',
  },
  achievementCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  achievementLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statItemLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
  },
  performanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  overallScore: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  overallLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  overallValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  improvementText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
    marginLeft: 5,
  },
  subjectsBreakdown: {
    marginTop: 10,
  },
  subjectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subjectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  subjectName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  subjectScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  achievementBadgeText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  trendCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 120,
    marginBottom: 15,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
  },
  trendBarFill: {
    flex: 1,
    width: 30,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarInner: {
    backgroundColor: '#4A90E2',
    width: '100%',
    borderRadius: 6,
  },
  trendLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
  },
  trendCaption: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  insightsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  insightSection: {
    marginBottom: 20,
  },
  insightHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  insightText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  actionBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});
