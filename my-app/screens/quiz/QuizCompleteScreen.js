import React, { useEffect } from "react";
import {
    View,
    StyleSheet,
    ImageBackground,
    Text,
    SafeAreaView,
    TouchableOpacity,
    Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';

const MAIN_BG = require("../../assets/screens/main_bg.png");
const PANEL_BG = require("../../assets/screens/quiz/session_complete/complete_main_panel.png");
const BANNER_IMG = require("../../assets/screens/quiz/session_complete/complete_main_banner.png");

export default function QuizComleteScreen({ route, navigation }) {
    const {
        score,
        totalQuestions,
        earnedRewards,
        timeTaken,
        subjectName,
        subjectId,
        level,
        skillId,
        skillName,
    } = route.params || {};
    const wrongCount = (totalQuestions || 0) - (score || 0);
    const percentage = (score / totalQuestions) * 100;
    const isPass = percentage >= 50;

    // Play Sound Effect
    useEffect(() => {
        let soundObject = null;
        const playSound = async () => {
            try {
                // Determine pass/fail threshold (e.g. > 50%)
                // Or user said "win sound" if pass, "fail sound" if fail.
                // Assuming pass is > 0 or > some threshold. Let's use > 50% as a generic pass.
                // Or simply if score > 0 ?

                const soundFile = isPass 
                    ? require('../../assets/sound/complete-session-congratutaltion-sound.mp3') 
                    : require('../../assets/sound/game-over-lost-sound.mp3');

                const { sound } = await Audio.Sound.createAsync(
                    soundFile,
                    { shouldPlay: true, volume: 1.0 }
                );
                soundObject = sound;
                sound.setOnPlaybackStatusUpdate(async (status) => {
                    if (status.didJustFinish) {
                        await sound.unloadAsync();
                        soundObject = null;
                    }
                });
            } catch (error) {
                console.log('Error playing result sound:', error);
            }
        };
        
        playSound();

        return () => {
            if (soundObject) {
                soundObject.unloadAsync();
            }
        };
    }, []);

    const formatTime = (seconds) => {
        if (!seconds) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const handleContinue = () => {
        navigation.navigate("SkillsTopic", { subjectId, subjectName, level });
    };

    const handleReplay = () => {
        navigation.replace("ReadyToQuiz", {
            skillId,
            skillName,
            subjectName,
            isPlayAgain: true,
        });
    };

    return (
        <ImageBackground
            source={MAIN_BG}
            style={styles.container}
            resizeMode="cover"
        >
            {isPass && (
                <LottieView
                    source={require('../../assets/screens/questionnaire/correct-answer-stars.json')}
                    autoPlay
                    loop
                    style={styles.congratsLottie}
                    pointerEvents="none"
                />
            )}
            <SafeAreaView style={styles.safeArea}>
                <Image
                    source={BANNER_IMG}
                    style={styles.banner}
                    resizeMode="contain"
                />
                <ImageBackground
                    source={PANEL_BG}
                    style={styles.panel}
                    resizeMode="stretch"
                >
                    <View style={styles.content}>
                        <View style={styles.scoreContainer}>
                            <View style={styles.scoreBadge}>
                                <Text style={styles.scoreText}>
                                    {score}/{totalQuestions}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.statsContainer}>
                            <View style={styles.statRow}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                                </View>
                                <Text style={styles.statLabel}>{score} Correct Answers</Text>
    
                            </View>
                            
                            <View style={styles.statRow}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="close-circle" size={32} color="#F44336" />
                                </View>
                                <Text style={styles.statLabel}>{wrongCount} Wrong Answers</Text>
                                
                            </View>

                            <View style={styles.statRow}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="time" size={32} color="#FFC107" />
                                </View>
                                <Text style={styles.statLabel}>{formatTime(timeTaken)} Time Taken</Text>
                            </View>

                            <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="help-circle" size={32} color="#2196F3" />
                                </View>
                                <Text style={styles.statLabel}>{totalQuestions} Total Questions</Text>
                            </View>
                        </View>
                        
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                onPress={handleReplay}
                                style={[styles.actionBtn, styles.replayBtn]}
                            >
                                <Ionicons
                                    name="refresh"
                                    size={20}
                                    color="white"
                                />
                                <Text style={styles.btnText}>Replay</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleContinue}
                                style={[styles.actionBtn, styles.continueBtn]}
                            >
                                <Text style={styles.btnText}>Continue</Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={20}
                                    color="white"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    congratsLottie: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 1,
    },
    safeArea: {
        flex: 1,
        alignItems: "center",
        // justifyContent: "center",
    },
    banner: {
        width: '100%',
        height: 120,
        marginTop: 60,
        zIndex: 2,
    },
    panel: {
        width: "100%",
        height: 500,
        marginTop: 0, // Negative margin to overlap with banner if desired, or adjust
        alignItems: "center",
        justifyContent: "flex-start", // Start from top to leave room for answers below
        paddingTop: 80, // Push text down into the panel's "content" area
        aspectRatio: 0.82,
    },
    content: {
        flex: 1,
        width: "80%",
        alignItems: "center",
        marginTop: 45,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#5D4037",
        marginBottom: 20,
        textAlign: "center",
    },
    scoreContainer: {
        alignItems: "center",
        marginBottom: 0,
        position: 'absolute',
        top: -8, 
        zIndex: 1,
    },

    scoreBadge: {
        paddingVertical: 10,
        paddingHorizontal: 40,
     
    },
    scoreText: {
        fontSize: 48,
        fontWeight: "bold",
        color: "white",
    },
    statsContainer: {
        width: '80%',
        marginTop: 70,
        // backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 15,
        padding: 10,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        // borderBottomWidth: 1,
        // borderBottomColor: 'rgba(0,0,0,0)',
    },
    statIconContainer: {
        width: 30,
    },
    statLabel: {
        flex: 1,
        fontSize: 16,
        color: '#5D4037',
        fontWeight: '600',
        marginLeft: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3E2723',
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "80%",
        marginTop: "auto",
        marginBottom: 40,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        minWidth: 120,
        elevation: 3,
    },
    replayBtn: {
        backgroundColor: "#2196F3",
        marginRight: 10,
    },
    continueBtn: {
        backgroundColor: "#4CAF50",
    },
    btnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        marginHorizontal: 5,
    },
});
