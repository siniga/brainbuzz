import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ImageBackground, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRewards, getUserStats } from '../../database/db';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyRewardsScreen({ navigation }) {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStars, setTotalStars] = useState(0);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId') || 'user_default';
      const [userRewards, stats] = await Promise.all([
        getUserRewards(userId),
        getUserStats(userId)
      ]);
      setRewards(userRewards);
      setTotalStars(stats.totalStars);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRewardIcon = (type) => {
    // Placeholder logic for icons based on reward type
    // You can replace these with actual image assets later
    switch (type) {
      case 'star_5_sessions':
        return { icon: 'ribbon', color: '#FFD700', label: 'High Five' };
      case 'completion_trophy':
        return { icon: 'trophy', color: '#C0C0C0', label: 'Course Master' };
      case 'speed_demon':
        return { icon: 'flash', color: '#FF4500', label: 'Speed Demon' };
      default:
        return { icon: 'medal', color: '#CD7F32', label: 'Achievement' };
    }
  };

  const renderRewardItem = ({ item }) => {
    const { icon, color, label } = getRewardIcon(item.reward_type);
    
    return (
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={['#ffffff', '#f0f0f0']}
          style={styles.card}
        >
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={40} color={color} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.rewardTitle}>{label}</Text>
            {item.skill_name && (
              <Text style={styles.skillName}>{item.skill_name}</Text>
            )}
            <Text style={styles.dateText}>
              Earned: {new Date(item.awarded_at).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.shine} />
        </LinearGradient>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/screens/main_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>My Rewards</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        ) : (
          <View style={{flex: 1}}>
             {/* Total Stars Header */}
            <View style={styles.statsContainer}>
              <LinearGradient colors={['#FFca28', '#FF6F00']} style={styles.statCard}>
                <View style={styles.starsWrapper}>
                  {Array.from({ length: Math.min(totalStars, 50) }).map((_, index) => (
                    <Image
                      key={index}
                      source={require('../../assets/screens/my_stars/reward_1.png')}
                      style={styles.headerStarImage}
                      resizeMode="contain"
                    />
                  ))}
                  {totalStars > 50 && <Text style={styles.moreStarsText}>+{totalStars - 50}</Text>}
                </View>
                <Text style={styles.statLabel}>Total Stars Won: {totalStars}</Text>
              </LinearGradient>
            </View>

            <FlatList
              data={rewards}
              renderItem={renderRewardItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="trophy-outline" size={80} color="#ccc" />
                  <Text style={styles.emptyText}>No special trophies yet!</Text>
                  <Text style={styles.emptySubText}>Keep earning stars to unlock trophies.</Text>
                </View>
              }
            />
          </View>
        )}
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
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  statCard: {
    flexDirection: 'column',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  starsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 2,
  },
  headerStarImage: {
    width: 24,
    height: 24,
  },
  moreStarsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  cardContainer: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  skillName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  shine: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ rotate: '45deg' }],
  },
});
