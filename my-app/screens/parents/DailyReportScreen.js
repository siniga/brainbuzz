import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDailyStats, formatTime } from '../../database/reportQueries';

const MAIN_BG = require('../../assets/screens/main_bg.png');

export default function DailyReportScreen({ route, navigation }) {
  const { userId } = route.params;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyData();
  }, []);

  const loadDailyData = async () => {
    try {
      const dailyData = await getDailyStats(userId);
      setStats(dailyData);
    } catch (error) {
      console.error('Error loading daily stats:', error);
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
            <Text style={styles.loadingText}>Loading today's report...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const hasActivity = stats && stats.sessionsToday > 0;

  return (
    <ImageBackground source={MAIN_BG} style={styles.container} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Today's Learning</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Card */}
          <View style={styles.dateCard}>
            <Ionicons name="calendar" size={32} color="#4A90E2" />
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</Text>
              <Text style={styles.dateFull}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            </View>
          </View>

          {hasActivity ? (
            <>
              {/* Today's Stats */}
              <View style={styles.statsCard}>
                <Text style={styles.cardTitle}>📊 Today's Performance</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                    <Text style={styles.statValue}>{stats.sessionsToday}</Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="star" size={28} color="#FFD700" />
                    <Text style={styles.statValue}>{stats.starsEarned}</Text>
                    <Text style={styles.statLabel}>Stars</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="trophy" size={28} color="#8B5CF6" />
                    <Text style={styles.statValue}>{stats.avgScore}/10</Text>
                    <Text style={styles.statLabel}>Avg Score</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="time" size={28} color="#4A90E2" />
                    <Text style={styles.statValue}>{formatTime(stats.timeSpent)}</Text>
                    <Text style={styles.statLabel}>Time</Text>
                  </View>
                </View>
              </View>

              {/* Achievement */}
              {stats.bestAchievement && (
                <View style={styles.achievementCard}>
                  <View style={styles.achievementIcon}>
                    <Ionicons name="trophy" size={32} color="#FFD700" />
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>🎉 Today's Win!</Text>
                    <Text style={styles.achievementText}>{stats.bestAchievement}</Text>
                  </View>
                </View>
              )}

              {/* Encouragement */}
              <View style={styles.encouragementCard}>
                <Ionicons name="heart" size={24} color="#EF4444" />
                <View style={styles.encouragementContent}>
                  <Text style={styles.encouragementTitle}>For Parents</Text>
                  <Text style={styles.encouragementText}>
                    {stats.avgScore >= 8 
                      ? "Excellent work today! Your child is doing great. Keep encouraging their efforts!" 
                      : stats.avgScore >= 6
                      ? "Good progress today! A few more practice sessions will help improve further."
                      : "Your child tried today! Encourage them to keep practicing regularly."}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noActivityCard}>
              <Ionicons name="moon" size={64} color="#9CA3AF" />
              <Text style={styles.noActivityTitle}>No Activity Today</Text>
              <Text style={styles.noActivityText}>
                Your child hasn't completed any sessions yet today.
              </Text>
              <Text style={styles.noActivitySuggestion}>
                💡 Encourage 15 minutes of daily practice for best results!
              </Text>
            </View>
          )}
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
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  dateInfo: {
    marginLeft: 15,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dateFull: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 237, 150, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  achievementIcon: {
    marginRight: 15,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  achievementText: {
    fontSize: 14,
    color: '#666',
  },
  encouragementCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  encouragementContent: {
    flex: 1,
    marginLeft: 15,
  },
  encouragementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noActivityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 40,
    marginTop: 40,
    alignItems: 'center',
  },
  noActivityTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  noActivityText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  noActivitySuggestion: {
    fontSize: 14,
    color: '#4A90E2',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
