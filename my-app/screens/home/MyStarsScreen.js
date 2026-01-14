import React, { useEffect, useState } from 'react';
import { StyleSheet, ImageBackground, View, Image, Dimensions, Text, ScrollView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getUserStats, getAllSessionLogs } from '../../database/db';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const bg = require('../../assets/screens/main_bg.png'); // Use main bg for consistency

export default function MyStarsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalCorrect: 0,
    totalTimeMinutes: 0,
    totalStars: 0,
    skillsCompleted: 0
  });
  const [history, setHistory] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const storedUserId = await AsyncStorage.getItem('userId');
      const userId = storedUserId || 'user_default';
      
      const s = await getUserStats(userId);
      const h = await getAllSessionLogs(userId, 20); // Last 20 items
      setStats(s);
      setHistory(h);
    } catch (e) {
      console.error("Error loading stats", e);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => {
    const isPass = item.passed === 1;
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyLeft}>
          <Text style={styles.historySkill}>{item.skill_name || 'Unknown Skill'}</Text>
          <Text style={styles.historySession}>Session {item.session_number}</Text>
        </View>
        <View style={styles.historyRight}>
          <Text style={[styles.historyScore, { color: isPass ? '#2E7D32' : '#C62828' }]}>
             {item.score} / {item.total_count}
          </Text>
          <Text style={styles.historyDate}>
             {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
        </View>
    );
  }

  return (
    <ImageBackground source={bg} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity 
          style={styles.settingsIcon} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-sharp" size={32} color="#FFF" style={styles.shadowIcon}/>
        </TouchableOpacity>

        <View style={styles.header}>
            <Text style={styles.title}>MY PROGRESS</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
            <LinearGradient colors={['#FFca28', '#FF6F00']} style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalStars}</Text>
                <Text style={styles.statLabel}>Total Stars</Text>
            </LinearGradient>

            <LinearGradient colors={['#42A5F5', '#1565C0']} style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Quizzes Played</Text>
            </LinearGradient>

             <LinearGradient colors={['#66BB6A', '#2E7D32']} style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalTimeMinutes}m</Text>
                <Text style={styles.statLabel}>Time Spent</Text>
            </LinearGradient>

             <LinearGradient colors={['#AB47BC', '#6A1B9A']} style={styles.statCard}>
                <Text style={styles.statValue}>{stats.skillsCompleted}</Text>
                <Text style={styles.statLabel}>Skills Mastered</Text>
            </LinearGradient>
        </View>

        {/* Recent Activity */}
        <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <FlatList
                data={history}
                renderItem={renderHistoryItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyText}>No quizzes played yet!</Text>}
            />
        </View>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    resizeMode: 'cover',
  },
  loadingContainer: {
      flex: 1, 
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0'
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  settingsIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 20,
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  shadowIcon: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  header: {
      marginTop: 20,
      marginBottom: 20,
      alignItems: 'center'
  },
  title: {
      fontSize: 28,
      fontWeight: '900',
      color: '#fff',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
  },
  statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 15,
      width: '90%',
      marginBottom: 30,
  },
  statCard: {
      width: '45%',
      paddingVertical: 20,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.3,
       shadowRadius: 3,
  },
  statValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: 'white',
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
  },
  statLabel: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '600',
      marginTop: 5,
  },
  listContainer: {
      flex: 1,
      width: '90%',
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 15,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#333'
  },
  historyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#eee',
      elevation: 1,
  },
  historyLeft: {
      flex: 1,
  },
  historyRight: {
      alignItems: 'flex-end',
  },
  historySkill: {
      fontWeight: 'bold',
      color: '#333',
      fontSize: 16,
  },
  historySession: {
      color: '#666',
      fontSize: 12,
  },
  historyScore: {
      fontWeight: '900',
      fontSize: 16,
  },
  historyDate: {
      color: '#999',
      fontSize: 10,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 30,
      color: '#777',
      fontStyle: 'italic'
  }
});
