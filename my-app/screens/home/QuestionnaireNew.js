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
    ActivityIndicator,
    BackHandler,
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
const SUCCESS_MSG_BG = require("../../assets/screens/quiz/messages/success-msg-bg.png");
const WRONG_MSG_BG = require("../../assets/screens/quiz/messages/wrong-msg-bg.png");
const REWARD_MSG_BG = require("../../assets/screens/quiz/messages/reward_claims_bg.png");
const CONTINUE_BTN = require("../../assets/screens/quiz/messages/continue-btn.png");
const CLAIM_BUTTON = require("../../assets/screens/quiz/messages/claim-btn.png");

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
        text: "Good try!",
        sound: require("../../assets/sound/questionnare/wrong-answer/let-give-it-another-shot.mp3"),
    },
    {
        text: "Nice effort!",
        sound: require("../../assets/sound/questionnare/wrong-answer/nice-effort.mp3"),
    },
    {
        text: "That was tricky.",
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
        text: "you can do it",
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
                                coins < 30 &&
                                    !isTimerFrozen &&
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
    onContinue,
    isStreakPlaying,
}) => {
    const translateX = useSharedValue(0);
    const { width } = Dimensions.get('window');
    
    // Reset position when visible changes
    useEffect(() => {
        if (visible) {
            translateX.value = 0;
        }
    }, [visible]);
    
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));
    
    const handleContinuePress = async () => {
        if (isStreakPlaying) return;
        
        // Play swipe/slide sound
        try {
            const { sound } = await Audio.Sound.createAsync(
                require("../../assets/sound/questionnare/long-medium-swish.mp3"),
                { shouldPlay: true, volume: 0.4 }
            );
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) await sound.unloadAsync();
            });
        } catch (e) {
            console.log("Slide sound error:", e);
        }
        
        // Slide out to the left
        translateX.value = withTiming(-width, {
            duration: 300,
            easing: Easing.in(Easing.ease),
        }, (finished) => {
            if (finished) {
                runOnJS(onContinue)();
            }
        });
    };
    
    if (!visible) return null;

  return (
        <View style={styles.popupOverlay}>
            <Animated.View style={[styles.popupContainer, animatedStyle]}>
                <ImageBackground
                    source={isCorrect ? SUCCESS_MSG_BG : WRONG_MSG_BG}
                    style={styles.popupImageBg}
                    resizeMode="contain"
                >

                    {isCorrect ? (
                        <Text
                    style={[
                                styles.sheetTitle,
                                { position: "relative", bottom: 20, left: 40 },
                    ]}
                >
                            {praiseText || "Great!"}
                    </Text>
                    ) : (
                        <Text
                            style={[
                                styles.sheetTitle,
                                { position: "relative", bottom: 35, left: 40 },
                            ]}
                        >
                            {praiseText || "Great!"}
                        </Text>
                    )}

                    {/* Display Correct Answer */}
                    {correctAnswer && (
                        <View style={styles.correctAnswerContainer}>
                            <Text style={styles.correctAnswerLabel}>
                                {isCorrect ? "Your Answer:" : "Correct Answer:"}
                            </Text>
                            {isCorrect ? (
                                <Text style={[styles.correctAnswerText, { position: "relative", bottom: 30, left: 0 }]}>
                                    {correctAnswer}
                                </Text>
                            ) : (
                                <Text style={[styles.correctAnswerText, { position: "relative", bottom: 34, left: 0 }]}>
                                    {correctAnswer}
                        </Text>
                    )}
          </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            isStreakPlaying && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinuePress}
                        activeOpacity={isStreakPlaying ? 1 : 0.8}
                        disabled={isStreakPlaying}
                    >
                        <Image
                            source={CONTINUE_BTN}
                            style={[
                                styles.continueButtonImage,
                                isStreakPlaying &&
                                    styles.continueButtonImageDisabled,
                            ]}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>

                    {isStreakPlaying && (
                        <Text style={styles.streakWaitingText}>
                            🎉 Amazing! Wait for the streak celebration! 🎉
                        </Text>
                    )}
                </ImageBackground>
            </Animated.View>
        </View>
    );
};

// Action Buttons Bottom Sheet Component
const ActionButtonsBottomSheet = ({
    visible,
    onQuit,
    onSubmit,
    isProcessing,
}) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="slide"
            onRequestClose={onQuit}
        >
            <View style={styles.actionSheetOverlay}>
                <Pressable
                    style={styles.actionSheetBackdrop}
                    onPress={onQuit}
                />
                <View style={styles.actionSheetContent}>
                    <View style={styles.actionSheetHandle} />

                    <Text style={styles.actionSheetTitle}>
                        Ready to submit?
                    </Text>

                    <View style={styles.actionSheetButtons}>
                        <TouchableOpacity
                            style={[
                                styles.actionSheetBtn,
                                styles.actionSheetQuitBtn,
                            ]}
                            onPress={onQuit}
                            disabled={isProcessing}
                        >
                            <Ionicons
                                name="close-circle"
                                size={24}
                                color="#F44336"
                            />
                            <Text
                                style={[
                                    styles.actionSheetBtnText,
                                    { color: "#F44336" },
                                ]}
                            >
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionSheetBtn,
                                styles.actionSheetSubmitBtn,
                            ]}
                            onPress={onSubmit}
                            disabled={isProcessing}
                        >
                            <Ionicons
                                name="checkmark-circle"
                                size={24}
                                color="white"
                            />
                            <Text
                                style={[
                                    styles.actionSheetBtnText,
                                    { color: "white" },
                                ]}
                            >
                                Submit Answer
                            </Text>
                        </TouchableOpacity>
                    </View>
          </View>
      </View>
    </Modal>
  );
};

// --- Welcome Reward Modal ---
const WelcomeRewardModal = ({ visible, onContinue, isButtonDisabled }) => {
    const translateX = useSharedValue(0);
    const { width } = Dimensions.get('window');
    
    // Reset position when visible changes
    useEffect(() => {
        if (visible) {
            translateX.value = 0;
        }
    }, [visible]);
    
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));
    
    const handleContinuePress = async () => {
        // Don't allow press if disabled
        if (isButtonDisabled) return;
        
        // Play swipe/slide sound
        try {
            const { sound } = await Audio.Sound.createAsync(
                require("../../assets/sound/questionnare/long-medium-swish.mp3"),
                { shouldPlay: true, volume: 0.4 }
            );
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) await sound.unloadAsync();
            });
        } catch (e) {
            console.log("Slide sound error:", e);
        }
        
        // Slide out to the left
        translateX.value = withTiming(-width, {
            duration: 300,
            easing: Easing.in(Easing.ease),
        }, (finished) => {
            if (finished) {
                runOnJS(onContinue)();
            }
        });
    };
    
    if (!visible) return null;

    return (
        <View style={styles.popupOverlay}>
            <Animated.View style={[styles.popupContainer, animatedStyle]}>
                <ImageBackground
                    source={REWARD_MSG_BG}
                    style={styles.popupImageBg}
                    resizeMode="contain"
                >

                    <View style={styles.correctAnswerContainer}>
                       <Image source={require("../../assets/screens/quiz/messages/rewards/welcome-reward.png")} style={styles.rewardIcon} />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.continueButton, 
                            { position: "relative", top: 75 },
                            isButtonDisabled && styles.continueButtonDisabled
                        ]}
                        onPress={handleContinuePress}
                        activeOpacity={isButtonDisabled ? 1 : 0.8}
                        disabled={isButtonDisabled}
                    >
                        <Image
                            source={CLAIM_BUTTON}
                            style={[
                                styles.continueButtonImage,
                                isButtonDisabled && styles.continueButtonImageDisabled
                            ]}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </ImageBackground>
            </Animated.View>
        </View>
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
        transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
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
                        <Animated.View
                            style={[styles.pulseDot, pulseDotStyle]}
                        />
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
    const [selectedOption, setSelectedOption] = useState(null);
    const [dragOrderedOptions, setDragOrderedOptions] = useState([]);
    const [shuffledMcqOptions, setShuffledMcqOptions] = useState([]);
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
    
    // Welcome Reward States (First Session Only)
    const [showWelcomeReward, setShowWelcomeReward] = useState(false);
    const [hasTriggeredWelcomeReward, setHasTriggeredWelcomeReward] = useState(false);
    const [isRewardSoundPlaying, setIsRewardSoundPlaying] = useState(false);

    // Power-up States
    const [disabledOptions, setDisabledOptions] = useState([]);
    const [isTimerFrozen, setIsTimerFrozen] = useState(false);
    const [answerHistory, setAnswerHistory] = useState([]);
    const [showPowerUpSheet, setShowPowerUpSheet] = useState(false);
    const [triggeredMilestones, setTriggeredMilestones] = useState({
        50: false,
        110: false,
    });

    // Action Buttons Bottom Sheet State
    const [showActionSheet, setShowActionSheet] = useState(false);

    const processingRef = useRef(false);
    const timeoutTriggeredRef = useRef(false);
    const pendingNavigationRef = useRef(null);
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
    const feedbackSoundRef = useRef(null); // Track feedback sound to stop it when needed
    const pendingQuestionAudioRef = useRef(false);

    // Preloading refs for performance
    const preloadedAudioRef = useRef({}); // Store preloaded audio sounds by question index
    const preloadedImagesRef = useRef(new Set()); // Track preloaded image URIs
    const [preloadedImageComponents, setPreloadedImageComponents] = useState(
        []
    ); // Pre-rendered images
    
    // Image loading states
    const [questionImageLoading, setQuestionImageLoading] = useState(false);
    const [imageSelectionLoading, setImageSelectionLoading] = useState({});

    // Animation values for content slide transitions
    const contentTranslateX = useSharedValue(0);
    const contentOpacity = useSharedValue(1);

    // Reset state when question changes
    useEffect(() => {
        setSelectedOption(null);
        setDragOrderedOptions([]);
        setTimer(30);
        setDisabledOptions([]);
        setIsTimerFrozen(false);
        timeoutTriggeredRef.current = false;
        
        // Shuffle MCQ options when question changes
        if (currentQuestion && currentQuestion.type === "mcq" && currentQuestion.options) {
            setShuffledMcqOptions(shuffleArray(currentQuestion.options));
        } else {
            setShuffledMcqOptions([]);
        }
    }, [currentQuestionIndex, questions]);

    // Slide animation when question changes
    useEffect(() => {
        if (currentQuestionIndex > 0 && !loading) {
            // Start from right with fade
            contentTranslateX.value = 300;
            contentOpacity.value = 0;

            // Slide in with spring animation
            contentTranslateX.value = withSpring(0, {
                damping: 15,
                stiffness: 100,
                mass: 0.8,
            });

            // Fade in
            contentOpacity.value = withTiming(1, {
                duration: 250,
                easing: Easing.out(Easing.ease),
            });
        }
    }, [currentQuestionIndex, loading]);

    // Animated style for content
    const contentAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: contentTranslateX.value }],
        opacity: contentOpacity.value,
    }));

    // Enhanced batch preloading strategy for better performance
    useEffect(() => {
        const preloadResources = async () => {
            if (!questions || questions.length === 0) return;

            let startIndex, endIndex;

            // Strategy: Preload in batches of 5
            if (currentQuestionIndex === 0) {
                // Initial load: Preload first 5 questions (0-4)
                startIndex = 0;
                endIndex = Math.min(5, questions.length);
                console.log("🚀 Initial batch: Preloading questions 1-5");
            } else if (currentQuestionIndex === 3 && questions.length > 5) {
                // At question 4: Start preloading questions 6-10 in background
                startIndex = 5;
                endIndex = Math.min(10, questions.length);
                console.log("🚀 Second batch: Preloading questions 6-10");
            } else if (currentQuestionIndex === 8 && questions.length > 10) {
                // At question 9: Preload questions 11-15 if they exist
                startIndex = 10;
                endIndex = Math.min(15, questions.length);
                console.log("🚀 Third batch: Preloading questions 11-15");
            } else {
                // Regular preload: current + next 3 questions
                startIndex = currentQuestionIndex;
                endIndex = Math.min(startIndex + 4, questions.length);
            }

            const imagesToPreload = [];

            for (let i = startIndex; i < endIndex; i++) {
                const question = questions[i];

                // Preload images
                if (question.media && question.media.length > 0) {
                    question.media.forEach((img, idx) => {
                    const cleanImg = img.replace(/^\//, "");
                    const uri = img.startsWith("http")
                        ? img
                        : `${cleanImg}`;

                        // Add to pre-render list for instant display (only visible range)
                        if (
                            i >= currentQuestionIndex &&
                            i < currentQuestionIndex + 4
                        ) {
                            imagesToPreload.push({ uri, key: `${i}-${idx}` });
                        }

                        if (!preloadedImagesRef.current.has(uri)) {
                            Image.prefetch(uri)
                                .then(() => {
                                    preloadedImagesRef.current.add(uri);
                                    console.log(
                                        `✓ Preloaded image for Q${i + 1}`
                                    );
                                })
                                .catch((e) =>
                                    console.log(
                                        `✗ Image prefetch error Q${i + 1}:`,
                                        e
                                    )
                                );
                        }
                    });
                }

                // Preload audio (skip currently playing question)
                if (
                    i !== currentQuestionIndex &&
                    question.audio_url &&
                    !preloadedAudioRef.current[i]
                ) {
                    try {
                        const cleanAudioPath = question.audio_url.replace(
                            /^\//,
                            ""
                        );
                        const audioUri = question.audio_url.startsWith("http")
                            ? question.audio_url
                            : `${cleanAudioPath}`;

                        // Create sound but don't play yet
                        const { sound } = await Audio.Sound.createAsync(
                            { uri: audioUri },
                            { shouldPlay: false, volume: 1.0 }
                        );

                        preloadedAudioRef.current[i] = sound;
                        console.log(`✓ Preloaded audio for Q${i + 1}`);
                    } catch (error) {
                        console.log(
                            `✗ Error preloading audio Q${i + 1}:`,
                            error
                        );
                    }
                }
            }

            // Update pre-rendered image components for instant display (only visible range)
            setPreloadedImageComponents(imagesToPreload);
        };

        preloadResources();
    }, [currentQuestionIndex, questions]);

    // Reset image loading states when question changes
    useEffect(() => {
        setQuestionImageLoading(false);
        setImageSelectionLoading({});
        
        // Fallback: Force hide loading indicators after 5 seconds
        const timeoutId = setTimeout(() => {
            setQuestionImageLoading(false);
            setImageSelectionLoading({});
        }, 5000);
        
        return () => clearTimeout(timeoutId);
    }, [currentQuestionIndex]);

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
            console.log(
                "Current question audio_url:",
                currentQuestion?.audio_url
            );
            console.log(
                "Feedback audio playing:",
                feedbackAudioPlayingRef.current
            );
            
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
                        if (
                            !feedbackAudioPlayingRef.current &&
                            pendingQuestionAudioRef.current
                        ) {
                            clearInterval(checkInterval);
                            console.log(
                                "Feedback audio finished, playing question audio"
                            );
                            actuallyPlayAudio();
                        }
                    }, 100);
                    
                    // Safety timeout after 5 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        if (pendingQuestionAudioRef.current) {
                            console.log(
                                "Timeout reached, playing question audio anyway"
                            );
                            actuallyPlayAudio();
                        }
                    }, 5000);
                } else {
                    console.log(
                        "No feedback audio playing, playing question audio immediately"
                    );
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

                    // Check if we have a preloaded sound for this question
                    const preloadedSound =
                        preloadedAudioRef.current[currentQuestionIndex];

                    if (preloadedSound) {
                        // Use preloaded audio for instant playback
                        console.log(
                            "🚀 Using preloaded audio for instant playback"
                        );
                        questionAudioRef.current = preloadedSound;
                        await preloadedSound.setPositionAsync(0); // Reset to start
                        await preloadedSound.playAsync();

                        // Remove from preloaded cache since we're using it
                        delete preloadedAudioRef.current[currentQuestionIndex];
                    } else {
                        // Fallback: load on demand (shouldn't happen often if preloading works)
                        console.log(
                            "⏳ Loading audio on demand (not preloaded)"
                        );
                        const cleanAudioPath =
                            currentQuestion.audio_url.replace(/^\//, "");
                        const audioUri = currentQuestion.audio_url.startsWith(
                            "http"
                        )
                        ? currentQuestion.audio_url
                        : `${cleanAudioPath}`;

                        console.log("Loading audio from:", audioUri);

                    const { sound } = await Audio.Sound.createAsync(
                        { uri: audioUri },
                        { shouldPlay: true, volume: 1.0 }
                    );
                    
                    questionAudioRef.current = sound;
                    }

                    // Auto-cleanup when audio finishes
                    questionAudioRef.current.setOnPlaybackStatusUpdate(
                        async (status) => {
                        if (status.didJustFinish) {
                            console.log("Question audio finished playing");
                            setIsPlayingAudio(false);
                        }
                        }
                    );
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
        if (!currentQuestion || !currentQuestion.audio_url || isPlayingAudio)
            return;
        
        setIsPlayingAudio(true);
        
        try {
            if (questionAudioRef.current) {
                // Replay existing sound
                await questionAudioRef.current.setPositionAsync(0);
                await questionAudioRef.current.playAsync();
            } else {
                // Check preloaded audio first
                const preloadedSound =
                    preloadedAudioRef.current[currentQuestionIndex];

                if (preloadedSound) {
                    console.log("🚀 Replaying preloaded audio");
                    questionAudioRef.current = preloadedSound;
                    await preloadedSound.setPositionAsync(0);
                    await preloadedSound.playAsync();
                    delete preloadedAudioRef.current[currentQuestionIndex];
                } else {
                    // Recreate sound if it was cleaned up and not preloaded
                    const cleanAudioPath = currentQuestion.audio_url.replace(
                        /^\//,
                        ""
                    );
                    const audioUri = currentQuestion.audio_url.startsWith(
                        "http"
                    )
                    ? currentQuestion.audio_url
                    : `${cleanAudioPath}`;

                const { sound } = await Audio.Sound.createAsync(
                    { uri: audioUri },
                    { shouldPlay: true, volume: 1.0 }
                );
                
                questionAudioRef.current = sound;
                }

                questionAudioRef.current.setOnPlaybackStatusUpdate(
                    async (status) => {
                    if (status.didJustFinish) {
                        setIsPlayingAudio(false);
                    }
                    }
                );
            }
        } catch (error) {
            console.log("Error replaying question audio:", error);
            setIsPlayingAudio(false);
        }
    };

    // Monitor coins for power-up availability (no longer auto-opens sheet)
    const [shouldAnimatePowerUpBtn, setShouldAnimatePowerUpBtn] =
        useState(false);
    
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

    // Show action sheet when answer is selected (for selection-based questions only)
    useEffect(() => {
        if (!currentQuestion) return;

        const isSelectionType = currentQuestion.type === "selection";

        if (!isSelectionType) return;

        // Show sheet when option is selected
        const hasSelection = selectedOption !== null;

        setShowActionSheet(hasSelection && !isProcessing);
    }, [selectedOption, currentQuestion, isProcessing]);

    // Auto-submit drag_order when all items are ordered
    useEffect(() => {
        if (!currentQuestion || currentQuestion.type !== "drag_order") return;
        if (isProcessing) return;

        // Check if all items are ordered
        const allItemsOrdered = 
            dragOrderedOptions.length > 0 &&
            dragOrderedOptions.length === currentQuestion.options.length;

        if (allItemsOrdered) {
            // Automatically submit after a short delay
            const timer = setTimeout(() => {
                handleAnswer(dragOrderedOptions.join(", "));
            }, 500); // 500ms delay to let user see their final selection

            return () => clearTimeout(timer);
        }
    }, [dragOrderedOptions, currentQuestion, isProcessing]);

    const handleDismissSheet = () => {
        setShowPowerUpSheet(false);
    };

    const handleOpenPowerUpSheet = () => {
        if (coins >= 25) {
            // Only open if they have coins for at least hint
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
    }, [
        loading,
        questions,
        timer,
        isProcessing,
        isTimerFrozen,
        showPowerUpSheet,
    ]);

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

            // Cleanup all preloaded audio on unmount
            Object.values(preloadedAudioRef.current).forEach((sound) => {
                if (sound) {
                    sound.unloadAsync().catch(() => {});
                }
            });
            preloadedAudioRef.current = {};
            preloadedImagesRef.current.clear();
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

        // 🔇 STOP ALL OTHER SOUNDS before playing genius sound
        // Stop feedback sound if playing
        if (feedbackSoundRef.current) {
            try {
                await feedbackSoundRef.current.stopAsync();
                await feedbackSoundRef.current.unloadAsync();
                feedbackSoundRef.current = null;
                feedbackAudioPlayingRef.current = false;
                console.log("🔇 Stopped feedback sound for streak");
            } catch (e) {
                console.log("Error stopping feedback sound:", e);
            }
        }

        // Stop question audio if playing
        if (questionAudioRef.current) {
            try {
                await questionAudioRef.current.stopAsync();
                await questionAudioRef.current.unloadAsync();
                questionAudioRef.current = null;
                setIsPlayingAudio(false);
                console.log("🔇 Stopped question audio for streak");
            } catch (e) {
                console.log("Error stopping question audio:", e);
            }
        }

        // Play "You are a genius" sound and wait for it to finish
        try {
            const { sound } = await Audio.Sound.createAsync(
                require("../../assets/sound/questionnare/right-answer/you-are-a-genius.mp3"),
                { shouldPlay: true, volume: 1.0 }
            );

            // Wait for sound to finish before hiding streak animation
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) {
                    await sound.unloadAsync();
                    // Hide streak animation after sound finishes
                    setShowStreakAnimation(false);
                    console.log(
                        "🎉 'You are a genius' sound finished, hiding streak"
                    );
                }
            });
            console.log("🎉 Playing 'You are a genius' sound for 3-streak!");
        } catch (e) {
            console.log("Streak Sound Error:", e);
            // If sound fails, hide animation after 2 seconds as fallback
        setTimeout(() => {
            setShowStreakAnimation(false);
            }, 2000);
        }
    };

    const playSoundEffect = async (isCorrect, rotatingSoundFile) => {
        feedbackAudioPlayingRef.current = true;
        
        try {
            if (isCorrect) {
                // Play rotating praise sound for correct answers
                if (rotatingSoundFile) {
                 const { sound } = await Audio.Sound.createAsync(
                        rotatingSoundFile,
                     { shouldPlay: true, volume: 1.0 }
                 );
                    feedbackSoundRef.current = sound; // Store ref so it can be stopped
                 sound.setOnPlaybackStatusUpdate(async (status) => {
                     if (status.didJustFinish) {
                         await sound.unloadAsync();
                            feedbackAudioPlayingRef.current = false;
                            feedbackSoundRef.current = null;
                     }
                 });
                } else {
                     feedbackAudioPlayingRef.current = false;
                }
            } else {
                // Play rotating encouragement sound for wrong answers
                if (rotatingSoundFile) {
                    const { sound } = await Audio.Sound.createAsync(
                        rotatingSoundFile,
                        { shouldPlay: true, volume: 1.0 }
                    );
                    feedbackSoundRef.current = sound; // Store ref so it can be stopped
                    sound.setOnPlaybackStatusUpdate(async (status) => {
                        if (status.didJustFinish) {
                            await sound.unloadAsync();
                 feedbackAudioPlayingRef.current = false;
                            feedbackSoundRef.current = null;
                        }
                    });
                } else {
                    feedbackAudioPlayingRef.current = false;
                }
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
        // Explicit cleanup: Stop and unload all audio immediately
        console.log("🧹 Cleaning up audio resources before quiz completion...");

        // Stop current question audio
        if (questionAudioRef.current) {
            try {
                await questionAudioRef.current.stopAsync();
                await questionAudioRef.current.unloadAsync();
                questionAudioRef.current = null;
                console.log("✓ Current question audio cleaned");
            } catch (e) {
                console.log("Error cleaning question audio:", e);
            }
        }

        // Unload all preloaded audio
        const preloadedCount = Object.keys(preloadedAudioRef.current).length;
        if (preloadedCount > 0) {
            for (const [index, sound] of Object.entries(
                preloadedAudioRef.current
            )) {
                if (sound) {
                    try {
                        await sound.unloadAsync();
                    } catch (e) {
                        console.log(
                            `Error unloading preloaded audio ${index}:`,
                            e
                        );
                    }
                }
            }
            preloadedAudioRef.current = {};
            console.log(`✓ Cleaned ${preloadedCount} preloaded audio files`);
        }

        // Clear image tracking (native cache persists, which is good for retries)
        preloadedImagesRef.current.clear();
        setPreloadedImageComponents([]);
        console.log("✓ Cleared image tracking");

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

    // Handle Continue button press in feedback popup
    const handleFeedbackContinue = () => {
        // Don't allow continue if streak animation is playing
        if (showStreakAnimation) {
            console.log("⏸️ Waiting for streak animation to finish...");
            return;
        }

        // Hide feedback
        setFeedback({
            visible: false,
            isCorrect: false,
            correctAnswer: "",
            praiseText: "",
        });

        // Reset processing flags to allow next interaction
        setIsProcessing(false);
        processingRef.current = false;

        // Get stored navigation data
        const navData = pendingNavigationRef.current;
        if (!navData) {
            console.log("⚠️ No pending navigation data");
            return;
        }

        console.log("📍 Continue clicked, navigating...", navData);

        // ALWAYS navigate when Continue is pressed (ignore skipTransition)
        // Since we're waiting for user confirmation, we always want to move forward
        if (navData.shouldFinish) {
            finishQuiz(navData.newScore, navData.newCorrectCount);
        } else {
            goToNextQuestion();
        }

        // Clear pending navigation
        pendingNavigationRef.current = null;
    };
    
    // Handle Welcome Reward Continue
    const handleWelcomeRewardContinue = async () => {
        setShowWelcomeReward(false);
        console.log("✅ Welcome reward dismissed, continuing quiz...");
        
        // Continue with normal quiz flow using stored navigation data
        const navData = pendingNavigationRef.current;
        if (navData) {
            // Reset processing flags
            setIsProcessing(false);
            processingRef.current = false;
            
            // Navigate to next question or finish quiz
            if (navData.shouldFinish) {
                finishQuiz(navData.newScore, navData.newCorrectCount);
            } else {
                goToNextQuestion();
            }
            
            // Clear pending navigation
            pendingNavigationRef.current = null;
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

        // 🔇 STOP QUESTION AUDIO IMMEDIATELY to prevent overlap with feedback sounds
        if (questionAudioRef.current) {
            try {
                await questionAudioRef.current.stopAsync();
                await questionAudioRef.current.unloadAsync();
                questionAudioRef.current = null;
                setIsPlayingAudio(false);
                console.log("🔇 Stopped question audio before feedback");
            } catch (e) {
                console.log("Error stopping question audio:", e);
            }
        }

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

        // Check if welcome reward will trigger (don't show feedback if it will)
        const willTriggerWelcomeReward = isCorrect && sessionNumber === 1 && 
            (correctCount + 1) === 8 && !hasTriggeredWelcomeReward;

        if (!willTriggerWelcomeReward) {
        setFeedback({
            visible: true,
            isCorrect,
            correctAnswer: currentQuestion.correctAnswer,
            praiseText: feedbackText,
        });
        }
        
        // Don't play feedback sounds if welcome reward will trigger
        if (!willTriggerWelcomeReward) {
        if (selectedOption === null) {
            // Timeout sound
            feedbackAudioPlayingRef.current = true;
            try {
                const { sound: toSound } = await Audio.Sound.createAsync(
                    require("../../assets/sound/game-over-lost-sound.mp3"),
                    { shouldPlay: true, volume: 1.0 }
                );
                    feedbackSoundRef.current = toSound; // Store ref so it can be stopped
                toSound.setOnPlaybackStatusUpdate(async (s) => {
                    if (s.didJustFinish) {
                        await toSound.unloadAsync();
                        feedbackAudioPlayingRef.current = false;
                            feedbackSoundRef.current = null;
                    }
                });
            } catch (e) {
                console.log(e);
                feedbackAudioPlayingRef.current = false;
            }
        } else {
            // Only play feedback sound if NOT the last question
            if (currentQuestionIndex < questions.length - 1) {
                    // 🎯 FIX: Check if this will trigger a streak BEFORE playing regular sound
                    const willTriggerStreak = isCorrect && (streak + 1) === 3;
                    
                    if (!willTriggerStreak) {
                playSoundEffect(isCorrect, feedbackSound);
                    } else {
                        console.log("⏭️ Skipping regular praise sound - streak incoming!");
                    }
                }
            }
        }

        // Streak Logic
        if (isCorrect) {
            setShowCoinAnimation(true);
            setTimeout(() => setShowCoinAnimation(false), 2000); // Hide coin animation after 2s

                const newStreak = streak + 1;
                let earnedCoins = 10;
            
                if (newStreak === 3) {
                // 🎯 Trigger streak effect immediately (no delay) to prevent sound overlap
                    triggerStreakEffect();
                    setStreak(0);
                    earnedCoins = 20;
                // Update coins immediately for streak
                setCoins((prev) => prev + earnedCoins);
                } else {
                    setStreak(newStreak);
                // Delay coin increment for non-streak answers to sync with animation
                setTimeout(() => {
                setCoins((prev) => prev + earnedCoins);
                }, 1300);
            }
        } else {
            setStreak(0);
        }

        // Update score and answer history immediately
            let newScore = score;
            let newCorrectCount = correctCount;

            if (isCorrect) {
                 newScore += 1;
                 newCorrectCount += 1;
                    setCorrectCount((prev) => prev + 1);
            
            // 🎉 WELCOME REWARD: First session, 8 correct answers
            if (sessionNumber === 1 && newCorrectCount === 8 && !hasTriggeredWelcomeReward) {
                console.log("🎊 WELCOME REWARD TRIGGERED! First session, 8/10 correct!");
                setHasTriggeredWelcomeReward(true);
                
                // STOP ALL SOUNDS immediately
                if (questionAudioRef.current) {
                    try {
                        await questionAudioRef.current.stopAsync();
                        await questionAudioRef.current.unloadAsync();
                        questionAudioRef.current = null;
                        setIsPlayingAudio(false);
                        console.log("🔇 Stopped question audio for welcome reward");
                    } catch (e) {
                        console.log("Error stopping question audio:", e);
                    }
                }
                
                if (feedbackSoundRef.current) {
                    try {
                        await feedbackSoundRef.current.stopAsync();
                        await feedbackSoundRef.current.unloadAsync();
                        feedbackSoundRef.current = null;
                        feedbackAudioPlayingRef.current = false;
                        console.log("🔇 Stopped feedback audio for welcome reward");
                    } catch (e) {
                        console.log("Error stopping feedback audio:", e);
                    }
                }
                
                // Show welcome reward immediately (no feedback popup)
                setShowWelcomeReward(true);
                
                // Play celebration sound when reward popup shows
                try {
                    setIsRewardSoundPlaying(true); // Disable button
                    const { sound } = await Audio.Sound.createAsync(
                        require("../../assets/sound/questionnare/rewards/welcome-reward-sound.mp3"),
                        { shouldPlay: true, volume: 0.8 }
                    );
                    sound.setOnPlaybackStatusUpdate(async (status) => {
                        if (status.didJustFinish) {
                            await sound.unloadAsync();
                            setIsRewardSoundPlaying(false); // Enable button when sound finishes
                        }
                    });
                    console.log("🎵 Playing celebration sound for welcome reward");
                } catch (e) {
                    console.log("Celebration sound error:", e);
                    setIsRewardSoundPlaying(false); // Enable button even on error
                }
                
                // Store navigation data for later
                pendingNavigationRef.current = {
                    newScore,
                    newCorrectCount,
                    skipTransition,
                    shouldFinish: currentQuestionIndex >= questions.length - 1,
                };
                
            setScore(newScore);
                setAnswerHistory((prev) => [...prev, isCorrect]);

                // Exit early - skip normal feedback flow
                console.log("🎉 Skipping feedback popup, showing welcome reward");
                return;
            }
            }
            setScore(newScore);
                setAnswerHistory((prev) => [...prev, isCorrect]);

        // Store values for use in handleFeedbackContinue
        pendingNavigationRef.current = {
            newScore,
            newCorrectCount,
            skipTransition,
            shouldFinish: currentQuestionIndex >= questions.length - 1,
        };

        console.log(
            "📝 Stored pending navigation:",
            pendingNavigationRef.current
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
                item={item}
                index={index}
                onAnswerPress={(itm) => handleAnswer(itm, false)} // Always use normal flow (wait for Continue button)
                disabled={
                    isProcessing ||
                    isPlayingAudio ||
                    disabledOptions.includes(item)
                }
                isCorrect={isThisCorrect}
                buttonImage={buttonImages[index % buttonImages.length]}
                styles={styles}
                onAnimationComplete={null} // Don't auto-advance; wait for Continue button
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
                    (isDisabled || isPlayingAudio) &&
                        styles.answerWrapperDisabled,
                    pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
                ]}
                onPress={() =>
                    !(isDisabled || isPlayingAudio) && setSelectedOption(item)
                }
                disabled={isProcessing || isPlayingAudio || isDisabled}
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
                                <View key={index} style={styles.dotWrapper}>
                             <View 
                                style={[
                                    styles.dot, 
                                        index < currentQuestionIndex
                                            ? styles.dotPast
                                            : index === currentQuestionIndex
                                            ? styles.dotCurrent
                                            : styles.dotFuture,
                                ]} 
                             />
                                    {index === currentQuestionIndex && (
                                        <Text style={styles.dotNumberText}>
                                            {index + 1}
                                        </Text>
                                    )}
                                </View>
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

                {/* <ImageBackground
                    source={QUIZ_MAIN_PANEL}
                    style={styles.panel}
                    resizeMode="stretch"
                > */}
                <Animated.View style={[styles.content, contentAnimatedStyle]}>
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
                                            name={
                                                isPlayingAudio
                                                    ? "volume-high"
                                                    : "play-circle"
                                            }
                                                size={28}
                                            color={
                                                isPlayingAudio
                                                    ? "#FF9800"
                                                    : "#4CAF50"
                                            }
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                {currentQuestion.type !== "image_selection" &&
                                    currentQuestion.media &&
                                    currentQuestion.media.length > 0 && (
                                        <View style={{ position: 'relative', width: '100%', height: 200 }}>
                                        <Image
                                            source={{
                                                    uri: currentQuestion.media[0].startsWith('http') 
                                                        ? currentQuestion.media[0] 
                                                        : `${IMAGE_URL}${currentQuestion.media[0]}`,
                                                    cache: "force-cache",
                                            }}
                                            style={styles.questionImage}
                                            resizeMode="contain"
                                                onLoadStart={() => setQuestionImageLoading(true)}
                                                onLoadEnd={() => setQuestionImageLoading(false)}
                                                onError={(e) => {
                                                    console.log("Image load error:", e.nativeEvent.error);
                                                    setQuestionImageLoading(false);
                                                }}
                                            />
                                            {questionImageLoading && (
                                                <View style={styles.imageLoadingOverlay}>
                                                    <ActivityIndicator size="large" color="#4A90E2" />
                                                    <Text style={styles.loadingText}>Loading...</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                <View style={styles.answersBody}>
                                    {/* MCQ - Immediate Action */}
                                    {currentQuestion.type === "mcq" && (
                                        <FlatList
                                            data={shuffledMcqOptions}
                                            renderItem={renderMCQItem}
                                            keyExtractor={(item, index) =>
                                                `${currentQuestionIndex}-${index}`
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
                                {currentQuestion.type === "image_selection" && (
                                    <>
                                        <View style={[
                                            styles.imageGrid,
                                            currentQuestion.media.length > 3 && styles.imageGridMultiColumn
                                        ]}>
                                            {currentQuestion.media.map(
                                                (img, index) => {
                                                    const optionValue =
                                                        currentQuestion.options[
                                                            index
                                                        ] || String(index + 1);
                                                    const isSelected =
                                                        selectedOption ===
                                                        optionValue;
                                                const cleanImg = img.replace(
                                                    /^\//,
                                                    ""
                                                );
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
                                                            !(
                                                                isDisabled ||
                                                                isPlayingAudio ||
                                                                isProcessing
                                                            ) &&
                                                                handleAnswer(optionValue)
                                                            }
                                                            disabled={
                                                                isProcessing ||
                                                            isPlayingAudio ||
                                                                isDisabled
                                                            }
                                                            style={[
                                                                styles.imageOption,
                                                                currentQuestion.media.length > 3 && styles.imageOptionGrid,
                                                                isSelected &&
                                                                    styles.imageOptionSelected,
                                                            (isDisabled ||
                                                                isPlayingAudio) && {
                                                                    opacity: 0.3,
                                                                },
                                                            ]}
                                                        >
                                                            <Image
                                                                source={{
                                                                    uri: uri,
                                                                cache: "force-cache",
                                                                }}
                                                                style={
                                                                    styles.imageOptionImg
                                                                }
                                                                resizeMode="contain"
                                                                onLoadStart={() => setImageSelectionLoading(prev => ({ ...prev, [index]: true }))}
                                                                onLoadEnd={() => setImageSelectionLoading(prev => ({ ...prev, [index]: false }))}
                                                                onError={(e) => {
                                                                    console.log(`Image selection ${index} error:`, e.nativeEvent.error);
                                                                    setImageSelectionLoading(prev => ({ ...prev, [index]: false }));
                                                                }}
                                                            />
                                                            {imageSelectionLoading[index] && (
                                                                <View style={styles.imageLoadingOverlay}>
                                                                    <ActivityIndicator size="small" color="#4A90E2" />
                                                                </View>
                                                            )}
                                                            {isSelected && (
                                                                <View
                                                                    style={
                                                                        styles.checkBadge
                                                                    }
                                                                >
                                                                    <Ionicons
                                                                        name="checkmark"
                                                                    size={20}
                                                                        color="white"
                                                                    />
                                                                </View>
                                                            )}
                                                        </Pressable>
                                                    );
                                                }
                                            )}
                                        </View>
                                    </>
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
                                                            isProcessing ||
                                                            isPlayingAudio
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
                                                            isProcessing ||
                                                            isPlayingAudio
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

                                {/* Action buttons moved to bottom sheet */}
                                </View>
                            </>
                        ) : (
                            <Text style={styles.errorText}>
                                No questions found.
                            </Text>
                        )}
                </Animated.View>
                {/* </ImageBackground> */}
                
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

                {/* Hidden preloaded images for instant display - keeps them decoded in memory */}
                <View
                    style={{
                        position: "absolute",
                        opacity: 0,
                        width: 0,
                        height: 0,
                        overflow: "hidden",
                    }}
                    pointerEvents="none"
                >
                    {preloadedImageComponents.map(({ uri, key }) => (
                        <Image
                            key={key}
                            source={{ uri, cache: "force-cache" }}
                            style={{ width: 1, height: 1 }}
                        />
                    ))}
                </View>
            </SafeAreaView>
             
            <FeedbackBottomSheet  
                visible={feedback.visible} 
                isCorrect={feedback.isCorrect} 
                correctAnswer={feedback.correctAnswer} 
                praiseText={feedback.praiseText}
                onContinue={handleFeedbackContinue}
                isStreakPlaying={showStreakAnimation}
            />
            
            {/* Welcome Reward Modal - First Session Only */}
            <WelcomeRewardModal
                visible={showWelcomeReward}
                onContinue={handleWelcomeRewardContinue}
                isButtonDisabled={isRewardSoundPlaying}
            />

            {/* Action Buttons Bottom Sheet - shows when answer is selected */}
            <ActionButtonsBottomSheet
                visible={showActionSheet}
                onQuit={() => setShowActionSheet(false)}
                onSubmit={() => {
                    setShowActionSheet(false);
                    handleSubmit();
                }}
                isProcessing={isProcessing}
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
        backgroundColor: "rgba(255, 255,255, 0.5)",
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
    dotWrapper: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
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
        transform: [{ scale: 2 }],
    },
    dotFuture: {
        backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent dark
        borderColor: "rgba(255,255,255,0.2)",
    },
    dotNumberText: {
        position: "absolute",
        top: -20,
        fontSize: 14,
        fontWeight: "bold",
        color: "#FFEB3B",
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },

    banner: {
        width: "100%",
        height: 120,
        marginTop: 50,
        aspectRatio: 3,
    },
    panel: {
        display: "none",
        width: "100%",
        height: 500,
        marginTop: -0,
        alignItems: "center",
        justifyContent: "flex-start", // Start from top to leave room for answers below
        paddingTop: 80, // Push text down into the panel's "content" area
        aspectRatio: 1.07,
    },
    content: {
        // backgroundColor:"rgba(255, 255,255, 0.5)",
        width: "100%", // Limit width so text doesn't hit edges
        alignItems: "center",
        flex: 1,
        marginTop: 0,
        paddingTop: 40,
        // marginBottom: 0,
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
        height: 200,
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
        fontSize: 26,
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
        flexDirection: "column",
        alignItems: "center",
        marginTop: 10,
        width: "100%",
    },
    imageGridMultiColumn: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
    },
    imageOption: {
        width: "90%",
        height: 150,
        marginBottom: 20,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "transparent",
        backgroundColor: "#f0f0f0",
        elevation: 2,
    },
    imageOptionGrid: {
        width: "45%",
        height: 140,
        marginBottom: 10,
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
    submitAnswerButton: {
        marginTop: 20,
        width: '40%',
        aspectRatio: 1.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    submitAnswerButtonBg: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        gap: 10,
    },
    submitAnswerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 25,
        margin: 8,
        elevation: 3,
        minWidth: 80,
        minHeight: 50,
        justifyContent: "center",
        alignItems: "center",
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
        fontSize: 20,
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
        backgroundColor: "rgba(0,0,0,0.1)", // Transparent background so user sees the quiz behind
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
        overflow: "hidden",
        minHeight: 200,
    },
    sheetContentImage: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    sheetCorrect: {
        // Background color removed - using image instead
        borderTopWidth: 6,
        borderColor: "#4CAF50",
    },
    sheetWrong: {
        // Background color removed - using image instead
        borderTopWidth: 6,
        borderColor: "#F44336",
    },

    // --- Full Screen Feedback Modal ---
    fullScreenModalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    fullScreenModalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    fullScreenMessageBg: {
        width: "120%",
        height: "120%",

        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
    },

    // --- Custom Popup with Image Background ---
    popupOverlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 1000,
        elevation: 1000,
    },
    popupContainer: {
        width: "100%",
        maxWidth: 500,
        // alignItems: "center",
    },
    popupImageBg: {
        width: "100%",
        aspectRatio: 0.9,
        justifyContent: "center",
        alignItems: "center",
        // paddingVertical: 40,
        // paddingHorizontal: 30,
    },
    correctAnswerContainer: {
        position:"relative",
        top: 20,
        // backgroundColor: "rgba(255, 255, 255, 0.9)",
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 15,
   
        // marginBottom: 170,
        maxWidth: "85%",
        alignItems: "center",
        height: 100,

        // borderWidth: 2,
        // borderColor: "#4CAF50",
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.2,
        // shadowRadius: 4,
        // elevation: 3,
    },
    rewardIcon: {
        marginLeft: 60,
        width: 150,
        height: 150,
    },
    correctAnswerLabel: {
        fontSize: 34,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 1,
        display: "none",
    },
    correctAnswerText: {
        fontSize: 70,
        fontWeight: "condensedBold",
        color: "#ffcd00",
        textAlign: "center",
        textShadowColor: "rgba(215, 87, 1, 0.9)",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 2,
    },
    continueButton: {
        marginTop: 30,
    },
    continueButtonDisabled: {
        opacity: 0.4,
    },
    continueButtonImage: {
        width: 200,
        height: 60,
    },
    continueButtonImageDisabled: {
        opacity: 0.5,
    },
    streakWaitingText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FF6B35",
        textAlign: "center",
        marginTop: 15,
        paddingHorizontal: 20,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    customBottomSheetOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        elevation: 1000,
    },
    customBottomSheetBg: {
        width: "100%",
        minHeight: 308,
    },

    sheetTitle: {
        position: "relative",
        bottom: 10,
        left: 40,
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 35,
        color: "yellow",
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
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
        backgroundColor: "red",
    },
    feedbackBox: {
        backgroundColor: "red",
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

    // --- Action Buttons Bottom Sheet ---
    actionSheetOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        // backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    actionSheetBackdrop: {
        flex: 1,
    },
    actionSheetContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingHorizontal: 20,
        paddingBottom: 30,
        paddingTop: 10,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    actionSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#DDD",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 20,
    },
    actionSheetTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 20,
    },
    actionSheetButtons: {
        flexDirection: "row",
        gap: 15,
        width: "100%",
    },
    actionSheetBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 15,
        gap: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    actionSheetQuitBtn: {
        backgroundColor: "#FFEBEE",
        borderWidth: 2,
        borderColor: "#F44336",
    },
    actionSheetSubmitBtn: {
        backgroundColor: "#4CAF50",
    },
    actionSheetBtnText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    imageLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
});
