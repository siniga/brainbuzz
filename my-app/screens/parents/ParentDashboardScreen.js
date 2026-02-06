import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { getWeeklyStats, getDailyStats } from '../../database/reportQueries';

const MAIN_BG = require('../../assets/screens/main_bg.png');

export default function ParentDashboardScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      
      if (id) {
        const [weekly, daily] = await Promise.all([
          getWeeklyStats(id),
          getDailyStats(id)
        ]);
        setWeeklyStats(weekly);
        setDailyStats(daily);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const StatCard = ({ icon, value, label, color = '#4A90E2' }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <ImageBackground source={MAIN_BG} style={styles.container} resizeMode="cover">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }
  
  return (
    <ImageBackground source={MAIN_BG} style={styles.container} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Progress Reports</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Stats Overview */}
          <View style={styles.quickStatsContainer}>
            <Text style={styles.sectionTitle}>This Week at a Glance</Text>
            <View style={styles.statsRow}>
              <StatCard 
                icon="star" 
                value={weeklyStats?.starsEarned || 0} 
                label="Stars" 
                color="#FFD700"
              />
              <StatCard 
                icon="checkmark-circle" 
                value={weeklyStats?.totalSessions || 0} 
                label="Sessions"
                color="#10B981"
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard 
                icon="flame" 
                value={`${weeklyStats?.activeDays || 0}/7`} 
                label="Active Days"
                color="#F59E0B"
              />
              <StatCard 
                icon="trophy" 
                value={`${weeklyStats?.avgScore || 0}%`} 
                label="Avg Score"
                color="#8B5CF6"
              />
            </View>
          </View>

          {/* Report Cards */}
          <View style={styles.reportsSection}>
            <Text style={styles.sectionTitle}>Detailed Reports</Text>
            
            <TouchableOpacity 
              style={styles.reportCard} 
              onPress={() => navigation.navigate('DailyReport', { userId })}
            >
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.reportGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.reportIcon}>
                  <Ionicons name="today" size={32} color="#FFF" />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>Today's Learning</Text>
                  <Text style={styles.reportSubtitle}>
                    {dailyStats?.sessionsToday || 0} sessions • {dailyStats?.starsEarned || 0} stars
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reportCard} 
              onPress={() => navigation.navigate('WeeklyReport', { userId })}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.reportGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.reportIcon}>
                  <Ionicons name="calendar" size={32} color="#FFF" />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>This Week</Text>
                  <Text style={styles.reportSubtitle}>
                    {weeklyStats?.activeDays || 0} active days • {weeklyStats?.avgScore || 0}% avg
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reportCard} 
              onPress={() => navigation.navigate('MonthlyReport', { userId })}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.reportGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.reportIcon}>
                  <Ionicons name="stats-chart" size={32} color="#FFF" />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>This Month</Text>
                  <Text style={styles.reportSubtitle}>Complete analysis & trends</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick Insights */}
          {weeklyStats && weeklyStats.subjectBreakdown.length > 0 && (
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Quick Insights</Text>
              <View style={styles.insightCard}>
                <Ionicons name="trending-up" size={24} color="#10B981" />
                <Text style={styles.insightText}>
                  {weeklyStats.subjectBreakdown[0]?.subjectName} is going great! ({Math.round(weeklyStats.subjectBreakdown[0]?.accuracy || 0)}%)
                </Text>
              </View>
              {weeklyStats.activeDays >= 5 && (
                <View style={styles.insightCard}>
                  <Ionicons name="flame" size={24} color="#F59E0B" />
                  <Text style={styles.insightText}>
                    Excellent consistency - {weeklyStats.activeDays} days active this week!
                  </Text>
                </View>
              )}
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
  quickStatsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  reportsSection: {
    marginBottom: 20,
  },
  reportCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  reportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  reportIcon: {
    marginRight: 15,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  reportSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  insightsSection: {
    marginBottom: 30,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  insightText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
