import React, { useState, useEffect, useRef } from "react";
import {
    View,
    StyleSheet,
    ImageBackground,
    SafeAreaView,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    Pressable,
    Modal,
    Alert,
    FlatList,
    ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import LottieView from "lottie-react-native";
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSequence, 
    runOnJS, 
    withSpring,
    FadeOut,
    Easing,
} from "react-native-reanimated";

import {
    getQuestionsForSession,
    getNextSessionToPlay,
    getLastSessionNumber,
    saveSessionResult,
} from "../../database/db";
import { IMAGE_URL } from "../../service/api";
import { syncData } from "../../service/sync";
import { useAudio } from "../../context/AudioContext";

const MAIN_BG = require("../../assets/screens/main_bg.png");
const MAIN_POWERUP_BG = require("../../assets/screens/quiz/powerup/powerup_bg.png");
const QUIZ_MAIN_PANEL = require("../../assets/screens/quiz/quiz_main_pannel.png");
const QUIZ_MAIN_BANNER = require("../../assets/screens/quiz/quiz_main_banner.png");
const TIMER_BG = require("../../assets/screens/quiz/timer_bg.png");
const COINS_BG = require("../../assets/screens/quiz/coins_bg.png");
const MAIN_POWERUP_PANEL = require("../../assets/screens/quiz/powerup/main_powerup_panel.png");
const POWERUP_BOMB = require("../../assets/screens/quiz/powerup/bomb.png");
const POWERUP_FREEZE = require("../../assets/screens/quiz/powerup/freeze.png");
const POWERUP_HINT = require("../../assets/screens/quiz/powerup/hint.png");
const POWERUP_SKIP = require("../../assets/screens/quiz/powerup/skip.png");

// Button Images
const BTN_BLUE = require("../../assets/screens/quiz/btns/blue.png");
const BTN_GREEN = require("../../assets/screens/quiz/btns/green.png");
const BTN_ORANGE = require("../../assets/screens/quiz/btns/orange.png");
const BTN_YELLOW = require("../../assets/screens/quiz/btns/yelllow.png"); // Note: yelllow with 3 'l's based on directory listing

// Sounds and Praises
const PRAISES = [
    {
        text: "Well done!",
        sound: require("../../assets/sound/questionnare/right-answer/well-done.mp3"),
    },
    {
        text: "Great job!",
        sound: require("../../assets/sound/questionnare/right-answer/great-job.mp3"),
    },
    {
        text: "Excellent!",
        sound: require("../../assets/sound/questionnare/right-answer/excellent.mp3"),
    },
    {
        text: "You got it right!",
        sound: require("../../assets/sound/questionnare/right-answer/you-got-it-right.mp3"),
    },
    {
        text: "Awesome work!",
        sound: require("../../assets/sound/questionnare/right-answer/awesome-work.mp3"),
    },
    {
        text: "Keep going!",
        sound: require("../../assets/sound/questionnare/right-answer/keep-goin.mp3"),
    },
];

const ENCOURAGEMENTS = [
    {
        text: "Good try! Try again!",
        sound: require("../../assets/sound/questionnare/wrong-answer/let-give-it-another-shot.mp3"),
    },
    {
        text: "Nice effort!",
        sound: require("../../assets/sound/questionnare/wrong-answer/nice-effort.mp3"),
    },
    {
        text: "Oops! That was tricky.",
        sound: require("../../assets/sound/questionnare/wrong-answer/oops-that-was-tricky.mp3"),
    },
    {
        text: "Think again!",
        sound: require("../../assets/sound/questionnare/wrong-answer/almost-try-again.mp3"),
    },
    {
        text: "You are getting close!",
        sound: require("../../assets/sound/questionnare/wrong-answer/you-are-getting-close.mp3"),
    },
    {
        text: "Not yet!, you can do it",
        sound: require("../../assets/sound/questionnare/wrong-answer/let-think-again.mp3"),
    },
];

const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// --- Particle Animation Components ---
const AnimatedImageBackground =
    Animated.createAnimatedComponent(ImageBackground);

const Particle = ({ active }) => {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 60 + Math.random() * 50; // Explosion radius
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const color = ["#FFD700", "#FF9800", "#FFFFFF", "#4CAF50"][
        Math.floor(Math.random() * 4)
    ];
    
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        if (active) {
            opacity.value = 1;
            translateX.value = withTiming(x, {
                duration: 600,
                easing: Easing.out(Easing.quad),
            });
            translateY.value = withTiming(y, {
                duration: 600,
                easing: Easing.out(Easing.quad),
            });
            opacity.value = withSequence(
                withTiming(1, { duration: 50 }),
                withTiming(0, { duration: 550 })
            );
            scale.value = withSequence(
                withTiming(Math.random() * 0.5 + 0.5, { duration: 200 }),
                withTiming(0, { duration: 400 })
            );
        }
    }, [active]);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
        backgroundColor: color,
        width: 10,
        height: 10,
        borderRadius: 5,
        position: "absolute",
    }));

    if (!active) return null;
    return <Animated.View style={style} />;
};

const ExplodingMCQButton = ({
    item,
    index,
    onAnswerPress,
    disabled,
    isCorrect,
    buttonImage,
    styles,
    onAnimationComplete,
}) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const [exploded, setExploded] = useState(false);

    // Reset state when item changes (new question)
    useEffect(() => {
        scale.value = 1;
        opacity.value = 1;
        setExploded(false);
    }, [item]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePress = () => {
        if (disabled) return;

        if (isCorrect) {
            // Reward Animation Sequence
            // 1. Press feedback
            scale.value = withSequence(
                withTiming(0.9, { duration: 100 }),
                // 2. Shrink to disappear
                withTiming(
                    0,
                    { duration: 250, easing: Easing.in(Easing.back(1)) },
                    (finished) => {
                    if (finished) {
                        runOnJS(setExploded)(true);
                        // Trigger particles
                        // Wait for particles to finish roughly before moving on
                        runOnJS(onAnswerPress)(item); // Call logic immediately (sound, etc)
                    }
                    }
                )
            );
            opacity.value = withTiming(0, { duration: 300 });
            
            // Wait for full animation before moving to next question
            setTimeout(() => {
                if (onAnimationComplete) runOnJS(onAnimationComplete)();
            }, 1200); // 100 + 250 + ~800 for particles
        } else {
            // Normal press
            onAnswerPress(item);
        }
    };

    return (
        <View
            style={[
                styles.answerWrapper,
                disabled && styles.answerWrapperDisabled,
            ]}
        >
            {exploded && (
                <View
                    style={[
                        styles.answerBtn,
                        {
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backgroundColor: "transparent",
                            justifyContent: "center",
                            alignItems: "center",
                        },
                    ]}
                >
                    <Ionicons
                        name="checkmark-circle"
                        size={40}
                        color="#4CAF50"
                    />
                </View>
            )}
            <Pressable onPress={handlePress} disabled={disabled || exploded}>
                <AnimatedImageBackground
                    source={buttonImage}
                    style={[
                        styles.answerBtn,
                        disabled && { opacity: 0.3 },
                        animatedStyle,
                    ]}
                    imageStyle={styles.answerBtnImage}
                    resizeMode="stretch"
                >
                    <Text style={styles.answerBtnText}>{item}</Text>
                </AnimatedImageBackground>
            </Pressable>
            {exploded && (
                <View
                    pointerEvents="none"
                    style={{ position: "absolute", top: "50%", left: "50%" }}
                >
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Particle key={i} active={true} />
                    ))}
                </View>
            )}
        </View>
    );
};

// --- Power Up Bottom Sheet ---
const PowerUpBottomSheet = ({
    visible,
    coins,
    onUsePowerUp,
    isTimerFrozen,
    currentQuestionIndex,
    answerHistory,
    onClose,
}) => {
  const handleUsePowerUp = (type) => {
    onUsePowerUp(type);
    onClose();
  };

  return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <ImageBackground
                source={MAIN_POWERUP_BG}
                style={styles.sheetOverlay}
                resizeMode="cover"
            >
                <ImageBackground
                    source={MAIN_POWERUP_PANEL}
                    style={styles.powerUpPanel}
                    resizeMode="contain"
                >
                    <View style={styles.powerUpButtonGrid}>
                        <TouchableOpacity
                            style={[
                                styles.powerUpImageBtn,
                                coins < 25 && styles.powerUpImageBtnDisabled,
                            ]}
                            onPress={() => handleUsePowerUp("hint")}
                            disabled={coins < 25}
                        >
                            <Image
                                source={POWERUP_HINT}
                                style={styles.powerUpImage}
                            />
                            <Text style={styles.powerUpCostText}>25</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.powerUpImageBtn,
                                (coins < 30 && !isTimerFrozen) &&
                                    styles.powerUpImageBtnDisabled,
                            ]}
                            onPress={() => handleUsePowerUp("freeze")}
                            disabled={coins < 30 && !isTimerFrozen}
                        >
                            <Image
                                source={POWERUP_FREEZE}
                                style={styles.powerUpImage}
                            />
                            <Text style={styles.powerUpCostText}>30</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.powerUpImageBtn,
                                coins < 50 && styles.powerUpImageBtnDisabled,
                            ]}
                            onPress={() => handleUsePowerUp("bomb")}
                            disabled={coins < 50}
                        >
                            <Image
                                source={POWERUP_BOMB}
                                style={styles.powerUpImage}
                            />
                            <Text style={styles.powerUpCostText}>50</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.powerUpImageBtn,
                                coins < 100 && styles.powerUpImageBtnDisabled,
                            ]}
                            onPress={() => handleUsePowerUp("skip")}
                            disabled={coins < 100}
                        >
                            <Image
                                source={POWERUP_SKIP}
                                style={styles.powerUpImage}
                            />
                            <Text style={styles.powerUpCostText}>100</Text>
                        </TouchableOpacity>
                    </View>
                </ImageBackground>
            </ImageBackground>
    </Modal>
  );
};

// --- Feedback Bottom Sheet ---
const FeedbackBottomSheet = ({
    visible,
    isCorrect,
    correctAnswer,
    praiseText,
}) => {
  return (
    <Modal transparent={true} visible={visible} animationType="slide">
      <View style={styles.sheetOverlay}>
                <View
                    style={[
                        styles.sheetContent,
                        isCorrect ? styles.sheetCorrect : styles.sheetWrong,
                    ]}
                >
                    <Text style={styles.sheetTitle}>
                        {isCorrect ? praiseText || "Correct!" : "Keep Trying!"}
                    </Text>
                    {!isCorrect && (
                        <Text style={styles.sheetSub}>
                            Answer: {correctAnswer}
                        </Text>
                    )}
          </View>
      </View>
    </Modal>
  );
};

import QuizComleteScreen from "../quiz/QuizCompleteScreen";

// Power-Up Floating Button Component
const PowerUpFloatingButton = ({ onPress, shouldAnimate }) => {
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);
    const pulseOpacity = useSharedValue(1);

    useEffect(() => {
        if (shouldAnimate) {
            // Pulse animation for button (runs once when triggered)
            scale.value = withSequence(
                withTiming(1.15, { duration: 300 }),
                withTiming(1, { duration: 300 }),
                withTiming(1.15, { duration: 300 }),
                withTiming(1, { duration: 300 })
            );
            
            // Shake animation (runs once when triggered)
            rotate.value = withSequence(
                withTiming(-8, { duration: 50 }),
                withTiming(8, { duration: 50 }),
                withTiming(-8, { duration: 50 }),
                withTiming(8, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );

            // Continuous pulse for dot - loop indefinitely
            const loop = () => {
                pulseOpacity.value = withSequence(
                    withTiming(0.3, { duration: 600 }),
                    withTiming(1, { duration: 600 }),
                    withTiming(0.3, { duration: 600 }),
                    withTiming(1, { duration: 600 }, () => {
                        if (shouldAnimate) {
                            runOnJS(loop)();
                        }
                    })
                );
            };
            loop();
        } else {
            // Reset animations when not animating
            scale.value = withTiming(1, { duration: 200 });
            rotate.value = withTiming(0, { duration: 200 });
            pulseOpacity.value = 1;
        }
    }, [shouldAnimate]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}deg` }
        ],
    }));

    const pulseDotStyle = useAnimatedStyle(() => ({
        opacity: pulseOpacity.value,
    }));

    return (
        <Animated.View style={[styles.powerUpFloatingBtn, animatedStyle]}>
            <TouchableOpacity
                style={styles.powerUpBtnTouchable}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={["#FF6B6B", "#FF8E53"]}
                    style={styles.powerUpBtnGradient}
                >
                    <Ionicons name="flash" size={24} color="white" />
                    <Text style={styles.powerUpBtnText}>POWER-UPS</Text>
                    {shouldAnimate && (
                        <Animated.View style={[styles.pulseDot, pulseDotStyle]} />
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function QuestionnaireNew({ route, navigation }) {
    const {
        skillId,
        skillName,
        subjectId,
        subjectName,
        level,
        isPlayAgain,
        sessionNumber: passedSessionNumber,
    } = route.params || {};

    // State
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [cacheBuster] = useState(Date.now());
    const [selectedOption, setSelectedOption] = useState(null);
    const [dragOrderedOptions, setDragOrderedOptions] = useState([]);
    const [timer, setTimer] = useState(30);
    const [coins, setCoins] = useState(0);
    
    // Logic State
    const [score, setScore] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState({
        visible: false,
        isCorrect: false,
        correctAnswer: "",
        praiseText: "",
    });
    // const [congratsVisible, setCongratsVisible] = useState(false); // Removed modal state
    const [totalTimeTaken, setTotalTimeTaken] = useState(0);
    const [earnedRewards, setEarnedRewards] = useState([]);
    const [correctCount, setCorrectCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showStreakAnimation, setShowStreakAnimation] = useState(false);
    const [showCoinAnimation, setShowCoinAnimation] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [sessionNumber, setSessionNumber] = useState(1);
    const [userId, setUserId] = useState("user_default");

    // Power-up States
    const [disabledOptions, setDisabledOptions] = useState([]);
    const [isTimerFrozen, setIsTimerFrozen] = useState(false);
    const [answerHistory, setAnswerHistory] = useState([]);
    const [showPowerUpSheet, setShowPowerUpSheet] = useState(false);
    const [triggeredMilestones, setTriggeredMilestones] = useState({
        50: false,
        110: false,
    });

    const processingRef = useRef(false);
    const timeoutTriggeredRef = useRef(false);
    const [shuffledPraises] = useState(() => shuffleArray(PRAISES));
    const [shuffledEncouragements] = useState(() =>
        shuffleArray(ENCOURAGEMENTS)
    );

    // Audio Context
    const { pauseBackgroundMusic, resumeBackgroundMusic } = useAudio();

    // Question Audio State
    const questionAudioRef = useRef(null);
    const [hasQuestionAudio, setHasQuestionAudio] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const feedbackAudioPlayingRef = useRef(false);
    const pendingQuestionAudioRef = useRef(false);

    // Reset state when question changes
    useEffect(() => {
        setSelectedOption(null);
        setDragOrderedOptions([]);
        setTimer(30);
        setDisabledOptions([]);
        setIsTimerFrozen(false);
        timeoutTriggeredRef.current = false;

        // Preload next question's image(s)
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            const nextQ = questions[nextIndex];
            if (nextQ.media && nextQ.media.length > 0) {
                nextQ.media.forEach((img) => {
                    const cleanImg = img.replace(/^\//, "");
                    const uri = img.startsWith("http")
                        ? img
                        : `${IMAGE_URL}/${cleanImg}`;
                    Image.prefetch(uri).catch((e) =>
                        console.log("Prefetch error", e)
                    );
                });
            }
        }
    }, [currentQuestionIndex, questions]);

    // Play question audio instruction when question changes
    useEffect(() => {
        // Don't try to play audio while loading or if no questions
        if (loading || !questions || questions.length === 0) {
            console.log("Skipping audio: loading or no questions");
            return;
        }

        const playQuestionAudio = async () => {
            console.log("Audio check - Question index:", currentQuestionIndex);
            console.log("Current question:", currentQuestion);
            console.log("Current question audio_url:", currentQuestion?.audio_url);
            console.log("Feedback audio playing:", feedbackAudioPlayingRef.current);
            
            // Update hasQuestionAudio state
            if (!currentQuestion || !currentQuestion.audio_url) {
                console.log("No audio_url found for this question");
                setHasQuestionAudio(false);
                pendingQuestionAudioRef.current = false;
                return;
            }
            
            setHasQuestionAudio(true);
            
            // Wait for feedback audio to finish before playing question audio
            const waitAndPlay = async () => {
                // Check if feedback audio is playing
                if (feedbackAudioPlayingRef.current) {
                    console.log("Waiting for feedback audio to finish...");
                    pendingQuestionAudioRef.current = true;
                    
                    // Poll until feedback audio finishes
                    const checkInterval = setInterval(() => {
                        if (!feedbackAudioPlayingRef.current && pendingQuestionAudioRef.current) {
                            clearInterval(checkInterval);
                            console.log("Feedback audio finished, playing question audio");
                            actuallyPlayAudio();
                        }
                    }, 100);
                    
                    // Safety timeout after 5 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        if (pendingQuestionAudioRef.current) {
                            console.log("Timeout reached, playing question audio anyway");
                            actuallyPlayAudio();
                        }
                    }, 5000);
                } else {
                    console.log("No feedback audio playing, playing question audio immediately");
                    actuallyPlayAudio();
                }
            };
            
            const actuallyPlayAudio = async () => {
                pendingQuestionAudioRef.current = false;
                setIsPlayingAudio(true);
                
                try {
                    // Configure audio mode
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,
                        playsInSilentModeIOS: true,
                        shouldDuckAndroid: true,
                        playThroughEarpieceAndroid: false,
                        staysActiveInBackground: false,
                    });

                    // Construct the audio URL
                    const cleanAudioPath = currentQuestion.audio_url.replace(/^\//, "");
                    const audioUri = currentQuestion.audio_url.startsWith("http")
                        ? currentQuestion.audio_url
                        : `${IMAGE_URL}${cleanAudioPath}`;

                    console.log("Actually playing question audio now:", audioUri);

                    // Play the audio
                    const { sound } = await Audio.Sound.createAsync(
                        { uri: audioUri },
                        { shouldPlay: true, volume: 1.0 }
                    );
                    
                    questionAudioRef.current = sound;

                    // Auto-cleanup when audio finishes
                    sound.setOnPlaybackStatusUpdate(async (status) => {
                        if (status.didJustFinish) {
                            console.log("Question audio finished playing");
                            setIsPlayingAudio(false);
                        }
                    });
                } catch (error) {
                    console.log("Error playing question audio:", error);
                    setIsPlayingAudio(false);
                }
            };
            
            waitAndPlay();
        };

        // Small delay to let the question display first
        const timeoutId = setTimeout(() => {
            playQuestionAudio();
        }, 500); // Increased from 300ms to 500ms

        // Cleanup function
        return () => {
            clearTimeout(timeoutId);
            pendingQuestionAudioRef.current = false;
            if (questionAudioRef.current) {
                questionAudioRef.current.unloadAsync().catch(() => {});
                questionAudioRef.current = null;
            }
            setIsPlayingAudio(false);
        };
    }, [currentQuestionIndex, currentQuestion, loading, questions]);

    // Function to replay question audio
    const replayQuestionAudio = async () => {
        if (!currentQuestion || !currentQuestion.audio_url || isPlayingAudio) return;
        
        setIsPlayingAudio(true);
        
        try {
            if (questionAudioRef.current) {
                // Replay existing sound
                await questionAudioRef.current.setPositionAsync(0);
                await questionAudioRef.current.playAsync();
            } else {
                // Recreate sound if it was cleaned up
                const cleanAudioPath = currentQuestion.audio_url.replace(/^\//, "");
                const audioUri = currentQuestion.audio_url.startsWith("http")
                    ? currentQuestion.audio_url
                    : `${IMAGE_URL}${cleanAudioPath}`;

                const { sound } = await Audio.Sound.createAsync(
                    { uri: audioUri },
                    { shouldPlay: true, volume: 1.0 }
                );
                
                questionAudioRef.current = sound;

                sound.setOnPlaybackStatusUpdate(async (status) => {
                    if (status.didJustFinish) {
                        setIsPlayingAudio(false);
                    }
                });
            }
        } catch (error) {
            console.log("Error replaying question audio:", error);
            setIsPlayingAudio(false);
        }
    };

    // Monitor coins for power-up availability (no longer auto-opens sheet)
    const [shouldAnimatePowerUpBtn, setShouldAnimatePowerUpBtn] = useState(false);
    
    useEffect(() => {
        // Check if user has enough coins for any power-up
        const hasEnoughForAny = coins >= 25; // Minimum is hint at 25 coins
        
        // Trigger animation when reaching milestones
        if (coins >= 50 && !triggeredMilestones[50]) {
            setShouldAnimatePowerUpBtn(true);
            setTriggeredMilestones((prev) => ({ ...prev, 50: true }));
        } else if (coins >= 110 && !triggeredMilestones[110]) {
            setShouldAnimatePowerUpBtn(true);
            setTriggeredMilestones((prev) => ({ ...prev, 110: true }));
        } else if (hasEnoughForAny) {
            setShouldAnimatePowerUpBtn(true);
        } else {
            setShouldAnimatePowerUpBtn(false);
        }
    }, [coins, triggeredMilestones]);

    const handleDismissSheet = () => {
        setShowPowerUpSheet(false);
    };

    const handleOpenPowerUpSheet = () => {
        if (coins >= 25) { // Only open if they have coins for at least hint
            setShowPowerUpSheet(true);
        }
    };

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (
            !loading &&
            questions.length > 0 &&
            timer > 0 &&
            !isProcessing &&
            !isTimerFrozen &&
            !showPowerUpSheet
        ) {
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loading, questions, timer, isProcessing, isTimerFrozen, showPowerUpSheet]);

    // Handle Time Up
    useEffect(() => {
        if (
            timer === 0 &&
            !isProcessing &&
            questions.length > 0 &&
            !timeoutTriggeredRef.current
        ) {
            timeoutTriggeredRef.current = true;
            handleAnswer(null); // Time's up treated as null answer
        }
    }, [timer, isProcessing]);

    // Background Audio Management
    useEffect(() => {
        const stopAudio = async () => {
            if (pauseBackgroundMusic) await pauseBackgroundMusic();
        };
        stopAudio();
        return () => {
            if (resumeBackgroundMusic) resumeBackgroundMusic();
        };
    }, []);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            if (!skillId) return;
            try {
                const storedUserId = await AsyncStorage.getItem("userId");
                const currentUserId = storedUserId || "user_default";
                setUserId(currentUserId);

                let session = 1;
                if (passedSessionNumber) {
                    session = passedSessionNumber;
                } else if (isPlayAgain) {
                    const lastSession = await getLastSessionNumber(
                        currentUserId,
                        skillId
                    );
                    session = lastSession || 1;
                } else {
                    session = await getNextSessionToPlay(
                        currentUserId,
                        skillId
                    );
                }
                setSessionNumber(session);

                const qs = await getQuestionsForSession(skillId, session);

                if (qs && qs.length > 0) {
                    const parsedQs = qs.map((q) => {
                        let options = [];
                        let media = [];
                        try {
                            if (Array.isArray(q.options_json)) {
                                options = q.options_json;
                            } else if (typeof q.options_json === "string") {
                                let raw = q.options_json.trim();
                                if (raw.startsWith('"') && raw.endsWith('"')) {
                                    try {
                                        raw = JSON.parse(raw);
                                    } catch (e) {}
                                }
                                if (
                                    raw.startsWith("[") &&
                                    raw.endsWith("]") &&
                                    !raw.includes('"')
                                ) {
                                    options = raw
                                        .slice(1, -1)
                                        .split(",")
                                        .map((s) => s.trim());
                                } else {
                                    options = JSON.parse(raw);
                                }
                            } else {
                                options = [];
                            }

                            if (q.media_uri) {
                                if (
                                    q.media_uri.trim().startsWith("[") &&
                                    q.media_uri.trim().endsWith("]")
                                ) {
                                    media = JSON.parse(q.media_uri);
                                } else {
                                    media = [q.media_uri];
                                }
                            }
                        } catch (e) {
                            console.log("Parse error", e);
                            if (
                                typeof q.options_json === "string" &&
                                q.options_json.length > 0
                            )
                                options = [q.options_json];
                            if (q.media_uri) media = [q.media_uri];
                        }

                        return {
                            ...q,
                            options: options,
                            media: media,
                            type: q.type || "mcq",
                            question: q.question_text,
                            correctAnswer: q.correct_answer,
                        };
                    });
                    setQuestions(shuffleArray(parsedQs));
                }
                setLoading(false);
                setStartTime(Date.now());
            } catch (e) {
                console.error("Failed to load quiz data", e);
                setLoading(false);
            }
        };
        loadData();
    }, [skillId]);

    const getPraise = (index) =>
        shuffledPraises[index % shuffledPraises.length];
    const getEncouragement = (index) =>
        shuffledEncouragements[index % shuffledEncouragements.length];

    const triggerStreakEffect = async () => {
        setShowStreakAnimation(true);
        try {
            const { sound } = await Audio.Sound.createAsync(
                require("../../assets/sound/3-answers-streak-sound.mp3"),
                { shouldPlay: true, volume: 1.0 }
            );
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) {
                    await sound.unloadAsync();
                }
            });
        } catch (e) {
            console.log("Streak Sound Error:", e);
        }
        
        setTimeout(() => {
            setShowStreakAnimation(false);
        }, 1500);
    };

    const playSoundEffect = async (isCorrect, rotatingSoundFile) => {
        feedbackAudioPlayingRef.current = true;
        
        try {
            if (isCorrect) {
                 // Play genius sound for correct answers
                 const { sound } = await Audio.Sound.createAsync(
                    require("../../assets/sound/genius-sound.mp3"),
                     { shouldPlay: true, volume: 1.0 }
                 );
                 sound.setOnPlaybackStatusUpdate(async (status) => {
                     if (status.didJustFinish) {
                         await sound.unloadAsync();
                     }
                 });
                 
                 // DISABLED: Praise sound (rotatingSoundFile) - not playing anymore
                 // Mark feedback audio as finished after genius sound
                 setTimeout(() => {
                     feedbackAudioPlayingRef.current = false;
                 }, 1000);
            } else {
                 // DISABLED: Wrong answer sound (rotatingSoundFile) - not playing anymore
                 feedbackAudioPlayingRef.current = false;
            }
        } catch (e) {
            console.log("Sound Error:", e);
            feedbackAudioPlayingRef.current = false;
        }
    };

    // --- Helper for Finishing Quiz ---
    const finishQuiz = async (
        finalScore = score,
        finalCorrectCount = correctCount
    ) => {
         const timeTaken = Math.floor((Date.now() - startTime) / 1000);
         try {
              // Note: We use the current state values. Ensure this is called after state updates have propagated.
            const newRewards = await saveSessionResult(
                userId,
                skillId,
                sessionNumber,
                finalScore,
                finalCorrectCount,
                questions.length,
                timeTaken
            );
              setEarnedRewards(newRewards || []);
              syncData();
              
            navigation.replace("QuizCompleteScreen", {
                  score: finalScore,
                  totalQuestions: questions.length,
                  timeTaken: timeTaken,
                  earnedRewards: newRewards || [],
                  subjectId,
                  subjectName,
                  level,
                  skillId,
                  skillName,
                sessionNumber, // Pass session number
              });
        } catch (e) {
            console.error("Failed to save session", e);
        }
         setTotalTimeTaken(timeTaken);
    };

    // --- Next Question Logic ---
    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setTimer(30);
            setIsProcessing(false);
            processingRef.current = false;
        } else {
            finishQuiz();
        }
    };

    const handleAnswer = async (selectedOption, skipTransition = false) => {
        if (processingRef.current && !skipTransition) return;

        // Play button press sound
        if (selectedOption !== null) {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require("../../assets/sound/ui-sound-answer-button-press.mp3"),
                    { shouldPlay: true, volume: 1.0 }
                );
                 sound.setOnPlaybackStatusUpdate(async (status) => {
                     if (status.didJustFinish) await sound.unloadAsync();
                 });
            } catch (e) {
                console.log("Button sound error", e);
            }
        }

        processingRef.current = true;
        setIsProcessing(true);

        const isCorrect =
            selectedOption !== null &&
            String(selectedOption).trim() ===
                String(currentQuestion.correctAnswer).trim();
        let feedbackText = "";
        let feedbackSound = null;

        if (isCorrect) {
            const praise = getPraise(currentQuestionIndex);
            feedbackText = praise.text;
            feedbackSound = praise.sound;
        } else {
            const encouragement = getEncouragement(currentQuestionIndex);
            feedbackText =
                selectedOption === null ? "Time's Up!" : encouragement.text;
            if (selectedOption !== null) {
                feedbackSound = encouragement.sound;
            } else {
                feedbackSound = null;
            }
        }

        setFeedback({
            visible: true,
            isCorrect,
            correctAnswer: currentQuestion.correctAnswer,
            praiseText: feedbackText,
        });
        
        if (selectedOption === null) {
            // Timeout sound
            feedbackAudioPlayingRef.current = true;
            try {
                const { sound: toSound } = await Audio.Sound.createAsync(
                    require("../../assets/sound/game-over-lost-sound.mp3"),
                    { shouldPlay: true, volume: 1.0 }
                );
                toSound.setOnPlaybackStatusUpdate(async (s) => {
                    if (s.didJustFinish) {
                        await toSound.unloadAsync();
                        feedbackAudioPlayingRef.current = false;
                    }
                });
            } catch (e) {
                console.log(e);
                feedbackAudioPlayingRef.current = false;
            }
        } else {
            // Only play feedback sound if NOT the last question
            if (currentQuestionIndex < questions.length - 1) {
                playSoundEffect(isCorrect, feedbackSound);
            }
        }

        // Streak Logic
        if (isCorrect) {
            setShowCoinAnimation(true);
            setTimeout(() => setShowCoinAnimation(false), 2000); // Hide coin animation after 2s

            // Delay coin increment to sync with animation
            setTimeout(() => {
                const newStreak = streak + 1;
                let earnedCoins = 10;
                if (newStreak === 3) {
                    triggerStreakEffect();
                    setStreak(0);
                    earnedCoins = 20;
                } else {
                    setStreak(newStreak);
                }
                setCoins((prev) => prev + earnedCoins);
            }, 1300); // Adjust delay as needed (e.g. 1000ms)
        } else {
            setStreak(0);
        }

        setTimeout(
            async () => {
                setFeedback({
                    visible: false,
                    isCorrect: false,
                    correctAnswer: "",
                    praiseText: "",
                });
            
            let newScore = score;
            let newCorrectCount = correctCount;

            if (isCorrect) {
                 newScore += 1;
                 newCorrectCount += 1;
                    setCorrectCount((prev) => prev + 1);
            }
            setScore(newScore);
                setAnswerHistory((prev) => [...prev, isCorrect]);

            if (currentQuestionIndex < questions.length - 1) {
                if (!skipTransition) {
                    goToNextQuestion();
                }
            } else {
                if (!skipTransition) {
                    finishQuiz(newScore, newCorrectCount);
                }
            }
            },
            skipTransition ? 500 : 1500
        );
    };

    const handleSubmit = () => {
        if (currentQuestion.type === "drag_order") {
            handleAnswer(dragOrderedOptions.join(", "));
        } else {
            handleAnswer(selectedOption);
        }
    };

    // --- Power Up Handlers ---

    const handlePowerUpAction = (type) => {
        switch (type) {
            case "bomb":
                handleUseBomb();
                break;
            case "hint":
                handleUseHint();
                break;
            case "freeze":
                handleFreezeTimer();
                break;
            case "skip":
                handleSkipQuestion();
                break;
            case "retry":
                handleRetryPrevious();
                break;
            default:
                break;
        }
    };

    const handleUseBomb = () => {
        if (coins < 50) {
            Alert.alert(
                "Not enough coins!",
                "You need 50 coins to use a Bomb."
            );
            return;
        }

        const correct = currentQuestion.correctAnswer;
        const wrongOptions = currentQuestion.options.filter(
            (opt) => String(opt).trim() !== String(correct).trim()
        );

        if (wrongOptions.length < 2) {
            Alert.alert(
                "Cannot use Bomb",
                "Not enough wrong options to remove!"
            );
             return;
        }

        setCoins((prev) => prev - 50);

        // Randomly pick 2 to hide
        const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
        const toRemove = shuffled.slice(0, 2);
        setDisabledOptions((prev) => [...prev, ...toRemove]);
    };

    const handleFreezeTimer = () => {
        if (coins < 30) {
            Alert.alert(
                "Not enough coins!",
                "You need 30 coins to Freeze Timer."
            );
            return;
        }
        if (isTimerFrozen) return;

        setCoins((prev) => prev - 30);
        setIsTimerFrozen(true);
    };

    const handleSkipQuestion = () => {
        if (coins < 100) {
            Alert.alert("Not enough coins!", "You need 100 coins to Skip.");
            return;
        }
        setCoins((prev) => prev - 100);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setAnswerHistory((prev) => [...prev, "skipped"]);
        } else {
            // End of quiz via Skip
            finishQuiz();
        }
    };

    const handleRetryPrevious = () => {
        if (coins < 50) {
            Alert.alert("Not enough coins!", "You need 50 coins to Retry.");
            return;
        }
        if (currentQuestionIndex === 0) return;
        
        const lastResult = answerHistory[answerHistory.length - 1];
        if (lastResult === true) {
            Alert.alert(
                "Previous Correct",
                "You got the last one right! No need to retry."
            );
            return;
        }

        setCoins((prev) => prev - 50);
        
        setCurrentQuestionIndex((prev) => prev - 1);
        setAnswerHistory((prev) => prev.slice(0, -1));
        // Reset state handled by useEffect
    };

    const handleUseHint = () => {
        if (coins < 25) {
            Alert.alert("Not enough coins!", "You need 25 coins for a Hint.");
            return;
        }
        
        const correct = currentQuestion.correctAnswer;
        // Find options that are NOT correct AND NOT already disabled
        const availableWrongOptions = currentQuestion.options.filter(
            (opt) =>
                String(opt).trim() !== String(correct).trim() &&
                !disabledOptions.includes(opt)
        );

        if (availableWrongOptions.length < 1) {
            Alert.alert("Cannot use Hint", "No more options to remove!");
            return;
        }

        setCoins((prev) => prev - 25);
        
        // Pick 1 to remove
        const randomWrong =
            availableWrongOptions[
                Math.floor(Math.random() * availableWrongOptions.length)
            ];
        setDisabledOptions((prev) => [...prev, randomWrong]);
    };

    const currentQuestion = questions[currentQuestionIndex];
    const buttonImages = [BTN_BLUE, BTN_GREEN, BTN_ORANGE, BTN_YELLOW];

    const renderMCQItem = ({ item, index }) => {
        const isThisCorrect =
            String(item).trim() ===
            String(currentQuestion.correctAnswer).trim();
        return (
            <ExplodingMCQButton
                key={`${currentQuestionIndex}-${item}`} // Force remount on question change
                item={item}
                index={index}
                onAnswerPress={(itm) => handleAnswer(itm, isThisCorrect)} // only skip transition if correct (animation handles it)
                disabled={isProcessing || disabledOptions.includes(item)}
                isCorrect={isThisCorrect}
                buttonImage={buttonImages[index % buttonImages.length]}
                styles={styles}
                onAnimationComplete={goToNextQuestion}
            />
        );
    };

    const renderSelectionItem = ({ item, index }) => {
        const isSelected = selectedOption === item;
        const isDisabled = disabledOptions.includes(item);
        
        return (
            <Pressable
                style={({ pressed }) => [
                    styles.answerWrapper,
                    isDisabled && styles.answerWrapperDisabled,
                    pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
                ]}
                onPress={() => !isDisabled && setSelectedOption(item)}
                disabled={isProcessing || isDisabled}
            >
                <ImageBackground
                    source={buttonImages[index % buttonImages.length]}
                    style={[
                        styles.answerBtn, 
                        isSelected && styles.selectedScale,
                        isDisabled && { opacity: 0.3 },
                    ]}
                    imageStyle={styles.answerBtnImage}
                    resizeMode="stretch"
                >
                    <Text style={styles.selectionBtnText}>{item}</Text>
                    {isSelected && (
                        <View style={styles.selectedOverlay}>
                            <Ionicons
                                name="checkmark-circle"
                                size={30}
                                color="white"
                            />
                        </View>
                    )}
                </ImageBackground>
            </Pressable>
        );
    };

    return (
        <ImageBackground
            source={MAIN_BG}
            style={styles.container}
            resizeMode="cover"
        >
               {showCoinAnimation && (
                <View
                    style={styles.coinAnimationContainer}
                    pointerEvents="none"
                >
                    <LottieView
                        source={require("../../assets/screens/quiz/coin-animation-1.json")}
                        autoPlay
                        loop={false}
                        style={styles.coinLottie}
                    />
                </View>
            )}
        
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <ImageBackground
                        source={TIMER_BG}
                        style={styles.statBadge}
                        resizeMode="stretch"
                    >
                        <Text
                            style={[
                                styles.statText,
                                isTimerFrozen && { color: "#2196F3" },
                            ]}
                        >
                             {isTimerFrozen ? "||" : `${timer}s`}
                        </Text>
                    </ImageBackground>

                    {/* Progress Dots */}
                    <View style={styles.progressContainer}>
                        {questions.length > 0 &&
                            questions.map((_, index) => (
                             <View 
                                key={index} 
                                style={[
                                    styles.dot, 
                                        index < currentQuestionIndex
                                            ? styles.dotPast
                                            : index === currentQuestionIndex
                                            ? styles.dotCurrent
                                            : styles.dotFuture,
                                ]} 
                             />
                         ))}
                    </View>

                    <ImageBackground
                        source={COINS_BG}
                        style={styles.statBadge}
                        resizeMode="stretch"
                    >
                        <Text style={[styles.statText, { marginRight: 25 }]}>
                            {coins}
                        </Text>
                    </ImageBackground>
                </View>

                <Image
                    source={QUIZ_MAIN_BANNER}
                    style={styles.banner}
                    resizeMode="contain"
                />

                <ImageBackground
                    source={QUIZ_MAIN_PANEL}
                    style={styles.panel}
                    resizeMode="stretch"
                >
                    <View style={styles.content}>
                        {loading ? (
                            <Text style={styles.loadingText}>Loading...</Text>
                        ) : currentQuestion ? (
                            <>
                                <View style={styles.questionHeader}>
                                <Text style={styles.questionText}>
                                    {currentQuestion.question}
                                </Text>
                                    {hasQuestionAudio && (
                                        <TouchableOpacity
                                            style={styles.replayButton}
                                            onPress={replayQuestionAudio}
                                            disabled={isPlayingAudio}
                                        >
                                            <Ionicons
                                                name={isPlayingAudio ? "volume-high" : "play-circle"}
                                                size={28}
                                                color={isPlayingAudio ? "#FF9800" : "#4CAF50"}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                {currentQuestion.type !== "image_selection" &&
                                    currentQuestion.media &&
                                    currentQuestion.media.length > 0 && (
                                        <Image
                                            source={{
                                                uri: `${IMAGE_URL}${currentQuestion.media[0]}?v=${cacheBuster}`,
                                            }}
                                            style={styles.questionImage}
                                            resizeMode="contain"
                                        />
                                    )}

                                <View style={styles.answersBody}>
                                    {/* MCQ - Immediate Action */}
                                    {currentQuestion.type === "mcq" && (
                                        <FlatList
                                            data={currentQuestion.options}
                                            renderItem={renderMCQItem}
                                            keyExtractor={(item, index) =>
                                                index.toString()
                                            }
                                            numColumns={2}
                                            contentContainerStyle={
                                                styles.listContainer
                                            }
                                            columnWrapperStyle={
                                                styles.columnWrapper
                                            }
                                            showsVerticalScrollIndicator={false}
                                            style={{ flex: 1, width: "100%" }}
                                        />
                                    )}

                                    {/* Selection - Requires Submit */}
                                    {currentQuestion.type === "selection" && (
                                        <FlatList
                                            data={currentQuestion.options}
                                            renderItem={renderSelectionItem}
                                            keyExtractor={(item, index) =>
                                                index.toString()
                                            }
                                            numColumns={2}
                                            contentContainerStyle={
                                                styles.listContainer
                                            }
                                            columnWrapperStyle={
                                                styles.columnWrapper
                                            }
                                            showsVerticalScrollIndicator={false}
                                            style={{ flex: 1, width: "100%" }}
                                        />
                                    )}

                                    {/* Image Selection - Requires Submit */}
                                    {currentQuestion.type ===
                                        "image_selection" && (
                                        <View style={styles.imageGrid}>
                                            {currentQuestion.media.map(
                                                (img, index) => {
                                                    const optionValue =
                                                        currentQuestion.options[
                                                            index
                                                        ] || String(index + 1);
                                                    const isSelected =
                                                        selectedOption ===
                                                        optionValue;
                                                    const cleanImg =
                                                        img.replace(/^\//, "");
                                                    const uri = img.startsWith(
                                                        "http"
                                                    )
                                                        ? img
                                                        : `${IMAGE_URL}/${cleanImg}`;
                                                    const isDisabled =
                                                        disabledOptions.includes(
                                                            optionValue
                                                        );

                                                    return (
                                                        <Pressable
                                                            key={index}
                                                            onPress={() =>
                                                                !isDisabled &&
                                                                setSelectedOption(
                                                                    optionValue
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing ||
                                                                isDisabled
                                                            }
                                                            style={[
                                                                styles.imageOption,
                                                                isSelected &&
                                                                    styles.imageOptionSelected,
                                                                isDisabled && {
                                                                    opacity: 0.3,
                                                                },
                                                            ]}
                                                        >
                                                            <Image
                                                                source={{
                                                                    uri: uri,
                                                                }}
                                                                style={
                                                                    styles.imageOptionImg
                                                                }
                                                                resizeMode="contain"
                                                            />
                                                            {isSelected && (
                                                                <View
                                                                    style={
                                                                        styles.checkBadge
                                                                    }
                                                                >
                                                                    <Ionicons
                                                                        name="checkmark"
                                                                        size={
                                                                            20
                                                                        }
                                                                        color="white"
                                                                    />
                                                                </View>
                                                            )}
                                                        </Pressable>
                                                    );
                                                }
                                            )}
                                        </View>
                                    )}

                                    {/* Drag Order */}
                                    {currentQuestion.type === "drag_order" && (
                                        <View style={styles.dragContainer}>
                                            <Text style={styles.dragLabel}>
                                                Your Order:
                                            </Text>
                                            <View style={styles.dragTargetArea}>
                                                {dragOrderedOptions.map(
                                                    (item, index) => (
                                                        <TouchableOpacity
                                                            key={`target-${index}`}
                                                            onPress={() =>
                                                                setDragOrderedOptions(
                                                                    (prev) =>
                                                                        prev.filter(
                                                                            (
                                                                                _,
                                                                                i
                                                                            ) =>
                                                                                i !==
                                                                                index
                                                                        )
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                        >
                                                            <View
                                                                style={[
                                                                    styles.dragItem,
                                                                    styles.dragItemTarget,
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.dragItemText
                                                                    }
                                                                >
                                                                    {item}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    )
                                                )}
                                                {dragOrderedOptions.length ===
                                                    0 && (
                                                    <Text
                                                        style={
                                                            styles.dragPlaceholder
                                                        }
                                                    >
                                                        Tap items below to order
                                                    </Text>
                                                )}
                                            </View>

                                            <Text
                                                style={[
                                                    styles.dragLabel,
                                                    { marginTop: 20 },
                                                ]}
                                            >
                                                Tap to Add:
                                            </Text>
                                            <View style={styles.dragPool}>
                                                {currentQuestion.options
                                                    .filter(
                                                        (opt) =>
                                                            !dragOrderedOptions.includes(
                                                                opt
                                                            )
                                                    )
                                                    .map((item, index) => (
                                                        <TouchableOpacity
                                                            key={`pool-${index}`}
                                                            onPress={() =>
                                                                setDragOrderedOptions(
                                                                    (prev) => [
                                                                        ...prev,
                                                                        item,
                                                                    ]
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                        >
                                                            <View
                                                                style={[
                                                                    styles.dragItem,
                                                                    styles.dragItemPool,
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.dragItemText
                                                                    }
                                                                >
                                                                    {item}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Action Buttons: Only for selection, image_selection and drag_order */}
                                    {(currentQuestion.type === "selection" ||
                                        currentQuestion.type ===
                                            "image_selection" ||
                                        currentQuestion.type ===
                                            "drag_order") && (
                                        <View
                                            style={
                                                styles.actionButtonsContainer
                                            }
                                        >
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionBtn,
                                                    styles.quitBtn,
                                                ]}
                                                onPress={() =>
                                                    navigation.goBack()
                                                }
                                                disabled={isProcessing}
                                            >
                                                <Text
                                                    style={styles.actionBtnText}
                                                >
                                                    QUIT
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[
                                                    styles.actionBtn,
                                                    styles.submitBtn,
                                                    ((!selectedOption &&
                                                        currentQuestion.type !==
                                                            "drag_order") ||
                                                        (currentQuestion.type ===
                                                            "drag_order" &&
                                                            dragOrderedOptions.length ===
                                                                0)) &&
                                                        styles.disabledBtn,
                                                ]}
                                                onPress={handleSubmit}
                                                disabled={
                                                    (!selectedOption &&
                                                        currentQuestion.type !==
                                                            "drag_order") ||
                                                    (currentQuestion.type ===
                                                        "drag_order" &&
                                                        dragOrderedOptions.length ===
                                                            0) ||
                                                    isProcessing
                                                }
                                            >
                                                <Text
                                                    style={styles.actionBtnText}
                                                >
                                                    SUBMIT
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </>
                        ) : (
                            <Text style={styles.errorText}>
                                No questions found.
                            </Text>
                        )}
                    </View>
                </ImageBackground>
                
                {/* Power-Up Button at Bottom */}
                {coins >= 25 && !feedback.visible && (
                    <PowerUpFloatingButton 
                        onPress={handleOpenPowerUpSheet}
                        shouldAnimate={shouldAnimatePowerUpBtn}
                    />
                )}

                {/* Power Up Sheet instead of Dock */}
                <PowerUpBottomSheet 
                    visible={showPowerUpSheet}
                    coins={coins}
                    onUsePowerUp={handlePowerUpAction}
                    isTimerFrozen={isTimerFrozen}
                    currentQuestionIndex={currentQuestionIndex}
                    answerHistory={answerHistory}
                    onClose={handleDismissSheet}
                />
            </SafeAreaView>
             
            <FeedbackBottomSheet  
                visible={feedback.visible} 
                isCorrect={feedback.isCorrect} 
                correctAnswer={feedback.correctAnswer} 
                praiseText={feedback.praiseText}
            />

            {showStreakAnimation && (
                <View style={styles.streakContainer} pointerEvents="none">
                    <LottieView
                        source={require("../../assets/screens/quiz/frame-streak.json")}
                        autoPlay
                        loop={false}
                        style={styles.streakLottie}
                    />
                    <View style={styles.streakTextWrapper}>
                        {/* <Text style={styles.streakText}>3 IN A ROW!</Text> */}
                        {/* <Text style={styles.streakSubText}>STREAK!</Text> */}
                    </View>
                </View>
            )}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        alignItems: "center",
    },
    header: {
        position: "absolute",
        top: 20,
        left: 0,
        right: 0,
        flexDirection: "row",
        width: "90%",
        justifyContent: "space-between",
        marginTop: 30,
        zIndex: 10,
    },
    statBadge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: 90,
        height: 35,
    },
    statText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        marginLeft: 35,
        marginBottom: 5,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    
    // --- Progress Dots ---
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    dotPast: {
        backgroundColor: "#4CAF50", // Green
        borderColor: "#4CAF50",
    },
    dotCurrent: {
        backgroundColor: "#FFEB3B", // Yellow
        borderColor: "#FFF",
        transform: [{ scale: 1.3 }],
    },
    dotFuture: {
        backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent dark
        borderColor: "rgba(255,255,255,0.2)",
    },

    banner: {
        width: "100%",
        height: 120,
        marginTop: 50,
        aspectRatio: 3,
    },
    panel: {
        width: "100%",
        height: 500,
        marginTop: -0,
        alignItems: "center",
        justifyContent: "flex-start", // Start from top to leave room for answers below
        paddingTop: 80, // Push text down into the panel's "content" area
        aspectRatio: 1.07,
    },
    content: {
        width: "54%", // Limit width so text doesn't hit edges
        alignItems: "center",
        flex: 1,
        marginBottom: 20,
    },
    questionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        position: "relative",
    },
    questionText: {
        fontSize: 26,
        color: "#4E342E",
        fontWeight: "bold",
        textAlign: "center",
        flex: 1,
        lineHeight: 34,
        textShadowColor: "rgba(255, 255, 255, 0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    replayButton: {
        position: "absolute",
        right: -0,
        top: -38,
        padding: 5,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    loadingText: {
        fontSize: 18,
        color: "#666",
        fontWeight: "bold",
    },
    errorText: {
        fontSize: 18,
        color: "#D32F2F",
        fontWeight: "bold",
    },
    questionImage: {
        width: "100%",
        height: 150,
        marginTop: 10,
        borderRadius: 10,
    },
    answersBody: {
        width: "100%",
        marginTop: 10,
        flex: 1, // Allow scrolling area
    },
    // Updated/New Grid Styles
    listContainer: {
        paddingBottom: 20,
        alignItems: "center",
    },
    columnWrapper: {
        
        justifyContent: "center",
        gap: 5, // Adds space between columns (React Native 0.71+)
    },
    answerWrapper: {
        margin: 6,
        width: "40%", // Fixed width for 2 columns
        borderRadius: 10,
        // elevation: 4,
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.25,
        // shadowRadius: 3.84,
        backgroundColor: "transparent",
        
    },
    answerWrapperDisabled: {
        opacity: 0.5,
        elevation: 0,
        // backgroundColor: 'red',
    },
    answerBtn: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
        minWidth: "100%",
        height: 70,
    },
    answerBtnImage: {
        borderRadius: 15,
    },
    answerBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    selectionBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    selectedScale: {
        transform: [{ scale: 1.02 }],
    },
    selectedOverlay: {
        position: "absolute",
        right: 15,
    },
    imageGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-around",
        marginTop: 10,
    },
    imageOption: {
        width: "45%",
        height: 130,
        // aspectRatio: 1.8,
        marginBottom: 15,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "transparent",
        backgroundColor: "#f0f0f0",
        elevation: 2,
    },
    imageOptionSelected: {
        borderColor: "#4CAF50",
        borderWidth: 4,
    },
    imageOptionImg: {
        width: "100%",
        height: "100%",
    },
    checkBadge: {
        position: "absolute",
        top: 5,
        right: 5,
        backgroundColor: "#4CAF50",
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    dragContainer: {
        width: "100%",
    },
    dragLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#4E342E",
        marginBottom: 8,
    },
    dragTargetArea: {
        minHeight: 60,
        borderWidth: 2,
        borderColor: "#8D6E63",
        borderStyle: "dashed",
        borderRadius: 10,
        padding: 10,
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "rgba(255,255,255,0.5)",
        alignItems: "center",
    },
    dragPool: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 10,
    },
    dragItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        margin: 4,
        elevation: 2,
    },
    dragItemTarget: {
        backgroundColor: "#FF7043", // Orange/Deep for placed items
    },
    dragItemPool: {
        backgroundColor: "#8D6E63", // Brown for pool items
    },
    dragItemText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
    dragPlaceholder: {
        color: "#8D6E63",
        fontStyle: "italic",
        width: "100%",
        textAlign: "center",
    },
    actionButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 60,
        marginBottom: 20,
    },
    actionBtn: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        minWidth: 120,
        alignItems: "center",
        elevation: 3,
    },
    quitBtn: {
        backgroundColor: "#F44336",
    },
    submitBtn: {
        backgroundColor: "#4CAF50",
    },
    disabledBtn: {
        backgroundColor: "#BDBDBD",
        elevation: 0,
    },
    actionBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    
    // --- Bottom Sheet Styles ---
    sheetOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0)", // Transparent background so user sees the quiz behind
    },
    sheetContent: {
        width: "100%",
        padding: 30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        alignItems: "center",
        paddingBottom: 50,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    sheetCorrect: {
        backgroundColor: "#E8F5E9",
        borderTopWidth: 6,
        borderColor: "#4CAF50",
    },
    sheetWrong: {
        backgroundColor: "#FFEBEE",
        borderTopWidth: 6,
        borderColor: "#F44336",
    },
    sheetTitle: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#333",
    },
    sheetSub: {
        fontSize: 18,
        color: "#555",
        textAlign: "center",
    },
    
    // --- Modals ---
    feedbackOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    feedbackBox: {
        padding: 30,
        borderRadius: 20,
        alignItems: "center",
        minWidth: 200,
    },
    feedbackCorrect: {
        backgroundColor: "#E8F5E9",
        borderWidth: 3,
        borderColor: "#4CAF50",
    },
    feedbackWrong: {
        backgroundColor: "#FFEBEE",
        borderWidth: 3,
        borderColor: "#F44336",
    },
    feedbackTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    feedbackSub: {
        fontSize: 18,
        color: "#555",
    },
    
    modalMainBg: {
      flex: 1,
    },
    congratsOverlay: {
      flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    congratsLottie: {
        position: "absolute",
        width: "100%",
        height: "100%",
      zIndex: 1,
    },
    congratsContent: {
        width: "90%",
        alignItems: "center",
      zIndex: 10,
    },
    
    // --- Banner Styles ---
    bannerContainer: {
        width: "100%",
      height: 60,
        alignItems: "center",
      zIndex: 10,
      marginBottom: 30,
    },
    bannerRibbon: {
        width: "95%",
      height: 50,
      borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
      elevation: 5,
      zIndex: 2,
    },
    bannerText: {
        color: "white",
      fontSize: 26,
        fontWeight: "900",
      letterSpacing: 1,
        textShadowColor: "rgba(0,0,0,0.3)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    ribbonEnd: {
        position: "absolute",
      width: 40,
      height: 40,
        backgroundColor: "#D84315",
      zIndex: 1,
      top: 15,
    },
    ribbonLeft: {
      left: 0,
        transform: [{ rotate: "45deg" }],
    },
    ribbonRight: {
      right: 0,
        transform: [{ rotate: "45deg" }],
    },
    
    // --- Stars Styles ---
    congratsStarsRow: {
        flexDirection: "row",
        alignItems: "center",
      gap: 5,
      marginBottom: 10,
    },
    modalStar: {
        textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
  
    // --- Card Styles ---
    congratsCard: {
        width: "100%",
        backgroundColor: "#F3E5AB", // Parchment
      borderRadius: 25,
      padding: 20,
        alignItems: "center",
      borderWidth: 8,
        borderColor: "#FFF8E1",
        shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    },
    congratsLabel: {
      fontSize: 22,
        fontWeight: "bold",
        color: "#8D6E63",
      marginBottom: 10,
    },
    scorePill: {
      paddingHorizontal: 30,
      paddingVertical: 10,
      borderRadius: 25,
      marginBottom: 20,
      elevation: 5,
    },
    scoreText: {
        color: "white",
      fontSize: 36,
        fontWeight: "900",
    },
    
    // --- Stats Styles ---
    statsContainer: {
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.5)",
      borderRadius: 15,
      padding: 15,
      marginBottom: 20,
    },
    statLine: {
        flexDirection: "row",
        alignItems: "center",
      marginBottom: 10,
    },
    statIconCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
      marginRight: 10,
    },
    statValue: {
      fontSize: 18,
        fontWeight: "bold",
        color: "#4E342E",
    },
    
    // --- Mascot ---
    congratsMascot: {
      width: 180,
      height: 180,
        position: "absolute",
      bottom: -45,
      right: -38,
      zIndex: 20,
    },
    
    // --- Buttons ---
    congratsButtons: {
        flexDirection: "row",
      gap: 15,
        width: "100%",
        justifyContent: "center",
    },
    modalBtn: {
      flex: 1,
      height: 55,
      borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
      maxWidth: 160,
    },
    modalBtnText: {
        color: "white",
      fontSize: 18,
        fontWeight: "bold",
    },
  
    // --- Coin Animation ---
    coinAnimationContainer: {
        position: "absolute",
        top: 35,
        left: 90,
        right: 0,
        bottom: 0,
        zIndex: 999999999, // Ensure it's on top of everything
    },
    coinLottie: {
        width: 300,
        height: 300,
    },

    // --- Streak Animation ---
    streakContainer: {
        position: "absolute",
        bottom: 0,
      left: 0,
      right: 0,
        justifyContent: "center",
        alignItems: "center",
      zIndex: 99999999999999,
        backgroundColor: "rgba(0,0,0,0.2)",
    },
    streakLottie: {
      width: 300,
      height: 300,
        shadowColor: "red",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    },
    streakTextWrapper: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
      bottom: 220,
    },
    streakText: {
      fontSize: 42,
        fontWeight: "900",
        color: "#FFD700",
        textShadowColor: "rgba(0,0,0,0.8)",
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 5,
    },
    streakSubText: {
      fontSize: 24,
        fontWeight: "bold",
        color: "#FFF",
        textShadowColor: "rgba(0,0,0,0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    
    // --- Awards ---
    awardsContainer: {
      marginTop: 20,
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.9)",
      borderRadius: 15,
      padding: 10,
        alignItems: "center",
    },
    awardsTitle: {
      fontSize: 16,
        fontWeight: "bold",
        color: "#333",
      marginBottom: 8,
    },
    awardsRow: {
        flexDirection: "row",
        justifyContent: "center",
      gap: 15,
    },
    awardItem: {
        alignItems: "center",
    },
    awardIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
        backgroundColor: "gold",
        justifyContent: "center",
        alignItems: "center",
      marginBottom: 4,
      elevation: 2,
    },
    awardLabel: {
      fontSize: 12,
        fontWeight: "600",
        color: "#555",
    },

    // --- Power Up Sheet Styles ---
    powerUpPanel: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        aspectRatio: 0.58,
    },
    powerUpButtonGrid: {
        marginTop: 110,
        width: "75%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 0,
    },
    powerUpImageBtn: {
        width: "46%",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    powerUpImageBtnDisabled: {
        opacity: 0.4,
    },
    powerUpImage: {
        width: "90%",
        height: "100%",
        resizeMode: "contain",
    },
    powerUpCostText: {
        marginTop: -8,
        fontSize: 16,
        fontWeight: "bold",
        color: "#5D4037",
        textAlign: "center",
    },
    powerUpSheetContent: {
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        paddingBottom: 40,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
        paddingBottom: 10,
    },
    sheetHeaderRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    sheetCoinBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF8E1",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#FFD700",
    },
    sheetCoinText: {
        fontWeight: "bold",
        color: "#F57F17",
        marginLeft: 5,
    },
    closeBtn: {
        padding: 4,
    },
    powerUpGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-around",
        gap: 15,
    },
    powerUpItem: {
        alignItems: "center",
        width: "30%", // 3 per row approx
        marginBottom: 15,
        padding: 10,
        borderRadius: 15,
        backgroundColor: "#FAFAFA",
        borderWidth: 1,
        borderColor: "#EEE",
    },
    powerUpItemDisabled: {
        opacity: 0.4,
        backgroundColor: "#F5F5F5",
    },
    powerUpItemActive: {
        backgroundColor: "#E3F2FD",
        borderColor: "#2196F3",
        borderWidth: 2,
    },
    powerUpIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    powerUpLabel: {
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    powerUpCost: {
        fontSize: 12,
        color: "#666",
        fontWeight: "600",
    },

    // --- Floating Power-Up Button ---
    powerUpFloatingBtn: {
        position: "absolute",
        bottom: 60,
        left: "50%",
        marginLeft: -75, // Half of button width for centering
        zIndex: 100,
        elevation: 10,
    },
    powerUpBtnTouchable: {
        borderRadius: 30,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    powerUpBtnGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        gap: 8,
        minWidth: 150,
    },
    powerUpBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
    pulseDot: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#4CAF50",
        borderWidth: 2,
        borderColor: "white",
    },
});
