import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserDashboardStats, getNextRecommendedSkill } from '../../database/db';
import { useAudio } from '../../context/AudioContext';
import { IMAGE_URL } from '../../service/api';

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
    const [stats, setStats] = useState(null);
    const [nextSkill, setNextSkill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Friend');
    const [dailyStreak, setDailyStreak] = useState(0);
    const { playClickSound } = useAudio();

    // Map subject names to their image files
    const getSubjectImage = (subjectName) => {
        const subjectMap = {
            'mathematics': require('../../assets/screens/dashboard/subjects/mathematics.png'),
            'math': require('../../assets/screens/dashboard/subjects/mathematics.png'),
            'science': require('../../assets/screens/dashboard/subjects/mathematics.png'), // Add more as needed
            'english': require('../../assets/screens/dashboard/subjects/mathematics.png'),
            // Add more subject mappings as you create more images
        };

        const key = subjectName?.toLowerCase().trim();
        return subjectMap[key] || subjectMap['mathematics']; // Default to mathematics if not found
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            const userData = await AsyncStorage.getItem('userData');

            if (userData) {
                const user = JSON.parse(userData);
                setUserName(user.name || 'Friend');
            }

            if (userId) {
                const dashboardStats = await getUserDashboardStats(userId);
                const recommended = await getNextRecommendedSkill(userId);

                setStats(dashboardStats);
                setNextSkill(recommended);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateToSubjects = () => {
        playClickSound();
        navigation.navigate('SubjectSelection');
    };

    const handleNavigateToProfile = () => {
        playClickSound();
        navigation.navigate('Profile');
    };

    const handleNavigateToRewards = () => {
        playClickSound();
        navigation.navigate('MyRewards');
    };

    const handleNavigateToStars = () => {
        playClickSound();
        navigation.navigate('MyStars');
    };

    const handleContinueLearning = () => {
        playClickSound();
        if (nextSkill) {
            // Navigate to the subject's levels screen
            navigation.navigate('Levels', {
                subjectId: nextSkill.subject_id,
                subjectName: nextSkill.subject_name
            });
        } else {
            // If no next skill, go to subject selection
            navigation.navigate('SubjectSelection');
        }
    };

    if (loading) {
        return (
            <ImageBackground
                source={require('../../assets/screens/main_bg.png')}
                style={styles.container}
                resizeMode="cover"
            >
                <SafeAreaView style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>Loading your progress...</Text>
                </SafeAreaView>
            </ImageBackground>
        );
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <ImageBackground
            source={require('../../assets/screens/main_bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header Banner with Image */}
                <ImageBackground
                    source={require('../../assets/screens/dashboard/header.png')}
                    style={styles.headerBanner}
                    resizeMode="stretch"
                >
                    <View style={styles.headerContent}>
                        <View style={styles.avatarCircle}>
                            <Ionicons name="person" size={32} color="#FFF" />
                        </View>
                        <Text style={styles.headerGreeting}>Hi, {userName} 👋</Text>
                        <View style={styles.headerIcons}>
                            <TouchableOpacity
                                style={styles.headerIconButton}
                                onPress={() => {
                                    playClickSound();
                                    navigation.navigate('Settings');
                                }}
                            >
                                <Image
                                    source={require('../../assets/screens/dashboard/settings.png')}
                                    style={styles.headerIconImage}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerIconButton}
                                onPress={() => {
                                    playClickSound();
                                    // Add notification functionality
                                }}
                            >
                                <Image
                                    source={require('../../assets/screens/dashboard/notification_bell.png')}
                                    style={styles.headerIconImage}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>

                {/* Daily Streak Badge */}
                <View style={styles.streakBadgeContainer}>
                    <Image
                        source={require('../../assets/screens/dashboard/streak_img.png')}
                        style={styles.streakBadgeImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.streakNumber}>{dailyStreak}</Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Total Stats Panel */}
                    <ImageBackground
                        source={require('../../assets/screens/dashboard/total_stats_bg.png')}
                        style={styles.statsPanel}
                        resizeMode="stretch"
                    >
                        <View style={styles.statsPanelHeader}>
                            <Text style={styles.panelTitle}></Text>
                            <TouchableOpacity onPress={() => {
                                playClickSound();
                                // Navigate to detailed stats
                            }}>
                                {/* <Text style={styles.viewMoreText}>View More go›</Text> */}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.statsRow}>
                            <TouchableOpacity
                                style={styles.statButtonContainer}
                                onPress={handleNavigateToStars}
                                activeOpacity={0.8}
                            >
                                <ImageBackground
                                    source={require('../../assets/screens/dashboard/total_points.png')}
                                    style={styles.statButtonImage}
                                    resizeMode="contain"
                                >
                                    <Text style={styles.statButtonValue}>{stats?.totalStars || 0}</Text>
                                </ImageBackground>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statButtonContainer}
                                onPress={handleNavigateToSubjects}
                                activeOpacity={0.8}
                            >
                                <ImageBackground
                                    source={require('../../assets/screens/dashboard/in_completed.png')}
                                    style={styles.statButtonImage}
                                    resizeMode="contain"
                                >
                                    <Text style={styles.statButtonValue}>{stats?.completedLevels || 0}</Text>
                                </ImageBackground>
                            </TouchableOpacity>

                            {/* <TouchableOpacity 
                style={styles.statButtonContainer}
                onPress={handleNavigateToSubjects}
                activeOpacity={0.8}
              >
                <ImageBackground
                  source={require('../../assets/screens/dashboard/in_progress.png')}
                  style={styles.statButtonImage}
                  resizeMode="contain"
                >
                  <Text style={styles.statButtonValue}>{stats?.inProgressLevels || 0}</Text>
                </ImageBackground>
              </TouchableOpacity> */}
                        </View>
                    </ImageBackground>

                    {/* Continue Learning Section */}
                    {nextSkill && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.continueLearningContainer}
                        >
                            <ImageBackground
                                source={require('../../assets/screens/dashboard/continue_learning.png')}
                                style={styles.continueLearningImage}
                                resizeMode="stretch"
                            >
                                {/* Continue Button - Top Right */}
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={handleContinueLearning}
                                    activeOpacity={0.8}
                                >
                                    <Image
                                        source={require('../../assets/screens/dashboard/continue.png')}
                                        style={styles.continueButtonImage}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>

                                <View style={styles.continueLearningOverlay}>
                                    {/* Subject Image Button */}
                                    <Image
                                        source={getSubjectImage(nextSkill.subject_name)}
                                        style={styles.subjectButtonImage}
                                        resizeMode="contain"
                                    />

                                    {/* Progress Bar */}
                                    <View style={styles.progressBarSection}>
                                        <View style={[styles.progressBarContainer,
                                        {
                                            width: '90%', backgroundColor: '#536215',
                                            height: 20, alignItems: 'center',
                                            justifyContent: 'space-between', borderRadius: 10
                                        }]}>
                                            <ImageBackground
                                                source={require('../../assets/screens/dashboard/progress.png')}
                                                style={[
                                                    styles.progressBarFill,
                                                    { width: `${(nextSkill.sessions_passed / 10) * 100}%`, height: 15 }
                                                ]}
                                            />
                                            <Text style={styles.continueProgressText}>
                                                {Math.round((nextSkill.sessions_passed / 10) * 100)}%
                                            </Text>

                                        </View>

                                    </View>

                                    {/* Skill Name */}
                                    <View style={{ flexDirection: 'row', marginTop: 10, marginLeft: 5 }}>
                                        <Text style={styles.skillNameText}>session {nextSkill.last_unlocked_session}</Text>
                                        <Text style={styles.skillNameText}> / {nextSkill.skill_name}</Text>
                                    </View>

                                </View>
                            </ImageBackground>
                        </TouchableOpacity>
                    )}

                    {/* My Subjects Section */}
                    {/* {stats?.subjectsInProgress && stats.subjectsInProgress.length > 0 && (
                        <View style={styles.subjectsPanel}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.panelTitle}>My Subjects</Text>
                            </View>
                            <View style={styles.subjectsGrid}>
                                {stats.subjectsInProgress.slice(0, 2).map((subject, index) => {
                                    const progress = subject.total_skills > 0
                                        ? (subject.completed_skills / subject.total_skills) * 100
                                        : 0;
                                    const colors = [
                                        { bg: '#FF8C42', btn: '#FF6B35' },
                                        { bg: '#6BCB77', btn: '#4CAF50' }
                                    ];
                                    const color = colors[index % 2];

                                    return (
                                        <View
                                            key={subject.id}
                                            style={[styles.subjectCardNew, { backgroundColor: color.bg }]}
                                        >
                                            <View style={styles.subjectCardHeader}>
                                                <View style={styles.subjectIconCircle}>
                                                    {subject.image_url ? (
                                                        <Image
                                                            source={{ uri: IMAGE_URL + subject.image_url }}
                                                            style={styles.subjectIconImage}
                                                            resizeMode="cover"
                                                        />
                                                    ) : (
                                                        <Ionicons name="book" size={28} color="#FFF" />
                                                    )}
                                                </View>
                                                <Text style={styles.subjectCardTitle}>{subject.name}</Text>
                                            </View>

                                            <Text style={styles.subjectLevelsText}>
                                                Levels: {subject.completed_skills}/{subject.total_skills}
                                            </Text>

                                            <TouchableOpacity
                                                style={[styles.subjectActionButton, { backgroundColor: color.btn }]}
                                                onPress={async () => {
                                                    playClickSound();
                                                    const userStandard = await AsyncStorage.getItem('userStandard');
                                                    navigation.navigate('SkillsTopic', {
                                                        subjectId: subject.id,
                                                        subjectName: subject.name,
                                                        level: userStandard || '1'
                                                    });
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.subjectActionText}>Practice</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )} */}

                    {/* Quick Actions */}
                    <ImageBackground 
                        source={require('../../assets/screens/dashboard/quick_action_bg.png')}
                        style={styles.quickActionsPanel}
                        resizeMode="stretch"
                    >
                        {/* <Text style={styles.panelTitle}>Quick Actions</Text> */}
                        <View style={styles.quickActionsGrid}>
                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={handleNavigateToSubjects}
                                activeOpacity={0.8}
                            >
                                <Image 
                                    source={require('../../assets/screens/dashboard/subjects.png')}
                                    style={styles.quickActionIcon}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={handleNavigateToRewards}
                                activeOpacity={0.8}
                            >
                                <Image 
                                    source={require('../../assets/screens/dashboard/rewards.png')}
                                    style={styles.quickActionIcon}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={handleNavigateToProfile}
                                activeOpacity={0.8}
                            >
                                <Image 
                                    source={require('../../assets/screens/dashboard/proile.png')}
                                    style={styles.quickActionIcon}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={() => {
                                    playClickSound();
                                    navigation.navigate('ParentDashboard');
                                }}
                                activeOpacity={0.8}
                            >
                                <Image 
                                    source={require('../../assets/screens/dashboard/reports.png')}
                                    style={styles.quickActionIcon}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        </View>
                    </ImageBackground>

                    {/* Bottom Padding */}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },

    // Header Banner Styles
    headerBanner: {
        marginHorizontal: 15,
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 90,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    headerContent: {
        marginTop: 25,
        marginLeft: 17,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#c87929',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    headerGreeting: {
        flex: 1,
        fontSize: 19,
        fontWeight: 'bold',
        color: '#5D4037',
        marginLeft: 12,
        marginBottom: 6,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 6,
    },
    headerIconButton: {
        width: 25,
        height: 25,
        borderRadius: 20,
        // backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIconImage: {
        width: 25,
        height: 25,
    },

    // Streak Badge
    streakBadgeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        marginBottom: 10,
        position: 'relative',
    },
    streakBadgeImage: {
        width: width * 0.5,
        height: 50,
    },
    streakNumber: {
        position: 'absolute',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        right: '30%',
        bottom: '32%',
    },

    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingTop: 20,
    },

    // Stats Panel
    statsPanel: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    statsPanelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    panelTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#5D4037',
    },
    viewMoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8B4513',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    statButtonContainer: {
        flex: 1,
        aspectRatio: 1.8,
    },
    statButtonImage: {
        position: 'relative',
        bottom: 15,
        left: 0,
        flex: 1,
        alignItems: 'center',
        paddingTop: 18,
        // marginBottom: 15,
        // justifyContent: 'center',
    },
    statButtonValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },

    // Continue Learning Panel
    continueLearningContainer: {
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    continueLearningImage: {
        width: '100%',
        minHeight: 120,
        justifyContent: 'center',
        // alignItems: 'center',
    },
    continueLearningOverlay: {

        paddingHorizontal: 15,        // padding: 20,
    },
    subjectButtonImage: {
        width: 120,
        height: 30,
        marginBottom: 0,
        position: 'relative',
        top: 25

    },
    continueProgressText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
        width: 45,
        textAlign: 'center',

    },
    skillNameText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#50310c',
        marginTop: 0,
        // textShadowColor: 'rgba(0, 0, 0, 0.5)',
        // textShadowOffset: { width: 1, height: 1 },
        // textShadowRadius: 2,
    },
    continueButton: {
        position: 'absolute',
        top: 24.5,
        right: 10,
        zIndex: 10,
    },
    continueButtonImage: {
        width: 90,
        height: 50,
    },
    progressBarSection: {
        position: 'relative',
        top: 12,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 15,
        justifyContent: 'space-between',
        height: 30,
    },
    progressBarContainer: {
        // height: 24,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#43600a',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',

    },
    progressBarFill: {
        height: '100%',
        // backgroundColor: '#79a714',
        minWidth: 2,
    },

    // Subjects Panel
    subjectsPanel: {
        backgroundColor: '#F5E6D3',
        borderRadius: 20,
        padding: 16,
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#D2B48C',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8B4513',
    },
    subjectsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    subjectCardNew: {
        flex: 1,
        borderRadius: 16,
        padding: 14,
        borderWidth: 3,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    subjectCardHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    subjectIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    subjectIconImage: {
        width: 54,
        height: 54,
        borderRadius: 27,
    },
    subjectCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    subjectLevelsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    subjectActionButton: {
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    subjectActionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },

    // Quick Actions
    quickActionsPanel: {
        // padding: 16,
        paddingTop: 30,
        marginBottom: 0,
        overflow: 'hidden',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        // justifyContent: 'space-between',
        rowGap: 1,
        columnGap: 14,
    },
    quickActionButton: {
        width: '38%',
        aspectRatio: 1.3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
    },
    quickActionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    quickActionIcon: {
        width: '100%',
        height: '100%',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F5E6D3',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: height * 0.85,
        paddingBottom: 20,
        borderTopWidth: 4,
        borderColor: '#D2B48C',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#D2B48C',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#5D4037',
    },
    modalCloseButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#D2B48C',
    },
    modalScrollView: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    modalSubjectCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#D2B48C',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    subjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    subjectImagePlaceholder: {
        backgroundColor: '#4D96FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subjectInfo: {
        flex: 1,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#5D4037',
        marginBottom: 2,
    },
    subjectStats: {
        fontSize: 12,
        color: '#8B4513',
    },


});

export default DashboardScreen;
