import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
} from 'react-native-svg';
import { useAudio } from '../../context/AudioContext';
import { getQuestionsForSession, getNextSessionToPlay, saveSessionResult, getLastSessionNumber } from '../../database/db';
import { authAPI, IMAGE_URL } from '../../service/api';
import { syncData } from '../../service/sync';
import { getLocalImageUri } from '../../service/downloadService';

const TOP_LAYER_IMG = require('../../assets/screens/questionnaire/top_layer.png');

const PRAISES = [
  { text: "Well done!", sound: require('../../assets/sound/questionnare/right-answer/well-done.mp3') },
  { text: "Great job!", sound: require('../../assets/sound/questionnare/right-answer/great-job.mp3') },
  { text: "Excellent!", sound: require('../../assets/sound/questionnare/right-answer/excellent.mp3') },
  { text: "You got it right!", sound: require('../../assets/sound/questionnare/right-answer/you-got-it-right.mp3') },
  { text: "Awesome work!", sound: require('../../assets/sound/questionnare/right-answer/awesome-work.mp3') },
  { text: "Keep going!", sound: require('../../assets/sound/questionnare/right-answer/keep-goin.mp3') },
];

const ENCOURAGEMENTS = [
  { text: "Good try! Try again!", sound: require('../../assets/sound/questionnare/wrong-answer/let-give-it-another-shot.mp3') },
  { text: "Nice effort!", sound: require('../../assets/sound/questionnare/wrong-answer/nice-effort.mp3') },
  { text: "Oops! That was tricky.", sound: require('../../assets/sound/questionnare/wrong-answer/oops-that-was-tricky.mp3') },
  { text: "Think again!", sound: require('../../assets/sound/questionnare/wrong-answer/almost-try-again.mp3') },
  { text: "You are getting close!", sound: require('../../assets/sound/questionnare/wrong-answer/you-are-getting-close.mp3') },
  { text: "Not yet!, you can do it", sound: require('../../assets/sound/questionnare/wrong-answer/let-think-again.mp3') },
];

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const { width } = Dimensions.get('window');

// --- Header Component ---
const Header = ({ current, total, timer, coins }) => {
    // Generate star placeholders
    const stars = Array.from({ length: 4 }).map((_, i) => i); // Just showing 4 for visual match
    
    return (
        <View style={styles.headerContainer}>
           <View style={styles.starsBar}>
               <View style={styles.starsRow}>
                   {stars.map((s, i) => (
                       <View key={i} style={[
                           styles.starPlaceholder, 
                           i < 3 && styles.starActive // Mock active state
                       ]}>
                           {i < 3 && <Ionicons name="star" size={16} color="#FFD700" />}
                       </View>
                   ))}
               </View>
               <View style={styles.dotIndicators}>
                   <View style={[styles.dot, styles.dotBlue]} />
                   <View style={[styles.dot, styles.dotBlue]} />
                   <View style={[styles.dot, styles.dotGrey]} />
                   <View style={[styles.dot, styles.dotGrey]} />
               </View>
           </View>

            {/* Coin Counter */}
           <View style={styles.coinContainer}>
                <View style={styles.coinIconCircle}>
                    <Ionicons name="logo-bitcoin" size={18} color="#FFD700" />
                </View>
                <Text style={styles.coinText}>{coins}</Text>
           </View>
        </View>
    );
};

// --- Question Box Component ---
const QuestionBox = ({ question, image }) => {
  const [localUri, setLocalUri] = useState(null);

  useEffect(() => {
    const checkLocal = async () => {
        if (image) {
            const clean = image.split('?')[0];
            const uri = await getLocalImageUri(clean);
            setLocalUri(uri);
        }
    };
    checkLocal();
  }, [image]);

  return (
    <View style={styles.questionCardContainer}>
         <Image source={TOP_LAYER_IMG} style={styles.topLayerDecoration} resizeMode="contain" />
       <View style={styles.questionCard}>
        
           {/* Inner Border/Paper effect */}
           <View style={styles.questionCardInner}>
               <Text style={styles.questionText}>{question}</Text>
               
               {image ? (
                   <Image
                       source={{ uri: localUri || `${IMAGE_URL}${image}` }}
                       style={styles.questionImage}
                       resizeMode="contain"
                   />
               ) : (
                   <View style={styles.imagePlaceholder} />
               )}
           </View>
       </View>
    </View>
  );
};

// --- Answer Button Component ---
const AnswerButton = ({ text, onPress, color, disabled }) => {
    // Map text/index to colors if needed, or pass color prop
    // For the UI match: Yellow, Blue, Green buttons
    
    if (disabled) {
        return (
             <View style={[styles.answerBtn, styles.answerBtnDisabled]}>
                <View style={styles.answerBtnInner}>
                     <Text style={[styles.answerBtnText, styles.answerBtnTextDisabled]}>{text}</Text>
                </View>
            </View>
        );
    }

    return (
        <Pressable 
            onPress={onPress} 
            style={({ pressed }) => [
                styles.answerBtn, 
                { backgroundColor: color },
                pressed && { transform: [{ scale: 0.96 }], opacity: 0.9, elevation: 2 }
            ]}
        >
            <View style={styles.answerBtnInner}>
                 <Text style={styles.answerBtnText}>{text}</Text>
            </View>
            {/* Gloss/Highlight */}
            <View style={styles.btnHighlight} />
        </Pressable>
    );
};


// --- Feedback Modal ---
const FeedbackModal = ({ visible, isCorrect, correctAnswer, praiseText }) => {
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.feedbackOverlay}>
          <View style={[styles.feedbackBox, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Text style={styles.feedbackTitle}>{isCorrect ? (praiseText || "Correct!") : "Keep Trying!"}</Text>
              {!isCorrect && <Text style={styles.feedbackSub}>Answer: {correctAnswer}</Text>}
          </View>
      </View>
    </Modal>
  );
};


// REDESIGNED MODAL
const CongratulationModal = ({ visible, score, totalQuestions, timeTaken, onContinue, onPlayAgain, earnedRewards }) => {
  const wrongCount = totalQuestions - score;
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  useEffect(() => {
    let soundObject = null;
    if (visible) {
      const playSound = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sound/complete-session-congratutaltion-sound.mp3'),
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
          console.log('Error playing congratulation sound:', error);
        }
      };
      playSound();
    }
    return () => {
      if (soundObject) {
        soundObject.unloadAsync();
      }
    };
  }, [visible]);


  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <ImageBackground 
        source={require('../../assets/screens/main_bg.png')} 
        style={styles.modalMainBg}
        resizeMode="cover"
      >
        <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)']}
            style={styles.congratsOverlay}
        >
            <LottieView
                source={require('../../assets/screens/questionnaire/correct-answer-stars.json')}
                autoPlay
                loop
                style={styles.congratsLottie}
                pointerEvents="none"
            />
            <View style={styles.congratsContent}>
            {/* Ribbon Banner */}
            <View style={styles.bannerContainer}>
                <LinearGradient
                    colors={['#FF9800', '#F44336']}
                    style={styles.bannerRibbon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.bannerText}>QUIZ COMPLETE!</Text>
                </LinearGradient>
                <View style={[styles.ribbonEnd, styles.ribbonLeft]} />
                <View style={[styles.ribbonEnd, styles.ribbonRight]} />
            </View>

            {/* Stars Row */}
            <View style={styles.congratsStarsRow}>
                 {[1, 2, 3, 4, 5].map((starIdx) => {
                    const active = score >= starIdx * 2;
                    const isCenter = starIdx === 3;
                    return (
                        <Ionicons 
                            key={`modal-star-${starIdx}`} 
                            name={active ? "star" : "star-outline"} 
                            size={isCenter ? 40 : 25} 
                            color="#FFD700" 
                            style={[styles.modalStar, isCenter && { marginTop: -15 }]} 
                        />
                    );
                 })}
            </View>

            <View style={styles.congratsCard}>

             <Text style={styles.congratsLabel}>Final Score!</Text>
                 
                 <LinearGradient
                    colors={['#42A5F5', '#66BB6A']}
                    style={styles.scorePill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                 >
                    <Text style={styles.scoreText}>{score}/{totalQuestions}</Text>
                 </LinearGradient>

                 <View style={styles.statsContainer}>
                    <View style={styles.statLine}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#4CAF50' }]}>
                            <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                        <Text style={styles.statValue}>{score} Correct</Text>
                    </View>
                    
                    <View style={styles.statLine}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#F44336' }]}>
                            <Ionicons name="close" size={16} color="white" />
                        </View>
                        <Text style={styles.statValue}>{wrongCount} Wrong</Text>
                    </View>

                    <View style={styles.statLine}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#FFB300' }]}>
                            <Ionicons name="time-outline" size={16} color="white" />
                        </View>
                        <Text style={styles.statValue}>{formatTime(timeTaken)}</Text>
                    </View>
                 </View>

                 <Image 
                    source={require('../../assets/screens/questionnaire/quiz_mascot.png')}
                    style={styles.congratsMascot}
                    resizeMode="contain"
                 />
            </View>

            <View style={[styles.congratsButtons, { marginTop: 20 }]}>
                <TouchableOpacity onPress={onPlayAgain} style={[styles.modalBtn, { backgroundColor: '#4285F4' }]}>
                    <Text style={styles.modalBtnText}>Replay</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onContinue} style={[styles.modalBtn, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.modalBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>

            {/* Awards Section */}
            {earnedRewards && earnedRewards.length > 0 && (
                <View style={styles.awardsContainer}>
                    <Text style={styles.awardsTitle}>New Awards!</Text>
                    <View style={styles.awardsRow}>
                        {earnedRewards.map((r, i) => {
                            let label = "Award";
                            let icon = "star";
                            let color = "#FFD700";
                            
                            if (r === 'first_session_trophy') { label = "First Win!"; icon = "trophy"; color = "#FFC107"; }
                            else if (r === 'star_5_sessions') { label = "High 5!"; icon = "ribbon"; color = "#E91E63"; }
                            else if (r === 'completion_trophy') { label = "Skill Master!"; icon = "medal"; color = "#9C27B0"; }

                            return (
                                <View key={i} style={styles.awardItem}>
                                    <View style={[styles.awardIconCircle, { backgroundColor: color }]}>
                                        <Ionicons name={icon} size={20} color="white" />
                                    </View>
                                    <Text style={styles.awardLabel}>{label}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

        </View>
        </LinearGradient>
      </ImageBackground>
    </Modal>
  );
};







export default function QuestionnaireScreen({ route, navigation }) {
  const { skillId, skillName, subjectId, subjectName, level, isPlayAgain, sessionNumber: passedSessionNumber } = route.params || {}; 
  const [questions, setQuestions] = useState([]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(20);
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, isCorrect: false, correctAnswer: '', praiseText: '' });
  const [congratsVisible, setCongratsVisible] = useState(false);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [earnedRewards, setEarnedRewards] = useState([]);
  
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [answerHistory, setAnswerHistory] = useState([]); // Array of booleans: true for correct, false for wrong
  const [startTime, setStartTime] = useState(Date.now());
  const [sessionNumber, setSessionNumber] = useState(1);
  const [userId, setUserId] = useState('user_default');
  
  // Coin & Power-up State
  const [sessionCoins, setSessionCoins] = useState(0);
  const [disabledOptions, setDisabledOptions] = useState([]);
  const [isTimerFrozen, setIsTimerFrozen] = useState(false);
  
  // New Type States
  const [selectedOption, setSelectedOption] = useState(null);
  const [dragOrderedOptions, setDragOrderedOptions] = useState([]); 

  const { pauseBackgroundMusic, resumeBackgroundMusic } = useAudio();
  const [cacheBuster] = useState(Date.now());
  const [shuffledPraises] = useState(() => shuffleArray(PRAISES));
  const [shuffledEncouragements] = useState(() => shuffleArray(ENCOURAGEMENTS));
  const processingRef = React.useRef(false);

  const triggerStreakEffect = async () => {
    setShowStreakAnimation(true);
    try {
        const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sound/3-answers-streak-sound.mp3'),
            { shouldPlay: true, volume: 1.0 }
        );
        sound.setOnPlaybackStatusUpdate(async (status) => {
            if (status.didJustFinish) {
                await sound.unloadAsync();
            }
        });
    } catch (e) { console.log("Streak Sound Error:", e); }
    
    setTimeout(() => {
        setShowStreakAnimation(false);
    }, 3000); // Animation duration
  };

  // Timer Countdown Logic
  useEffect(() => {
    let interval = null;
    if (!isProcessing && !congratsVisible && !isTimerFrozen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 51000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, congratsVisible, isTimerFrozen, timer > 0]); // Depend on boolean, not value

  // Handle Time Up
  useEffect(() => {
    if (timer === 0 && !isProcessing && !congratsVisible) {
        handleAnswer(null);
    }
  }, [timer, isProcessing, congratsVisible]);

  // Reset timer when question changes
  useEffect(() => {
    setTimer(20);
    setIsTimerFrozen(false);
    setSelectedOption(null);
    setDragOrderedOptions([]);
  }, [currentQuestionIndex]);

  useEffect(() => {
    // Ensure Audio Mode is set correctly for playback
    const configureAudio = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: false,
            });
        } catch (e) {
            console.log("Error configuring audio mode", e);
        }
    };
    configureAudio();

    const stopAudio = async () => { await pauseBackgroundMusic(); };
    stopAudio();
    return () => { resumeBackgroundMusic(); };
  }, []);

  // Handle Back Button - Allow free navigation
  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('beforeRemove', (e) => {
  //     if (congratsVisible) return;
  //     e.preventDefault();
  //     Alert.alert(
  //       'Quit Quiz?',
  //       'Progress will be lost.',
  //       [
  //         { text: "No", style: 'cancel', onPress: () => {} },
  //         { text: 'Yes', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
  //       ]
  //     );
  //   });
  //   return unsubscribe;
  // }, [navigation, congratsVisible]);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      if (!skillId) return;
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const currentUserId = storedUserId || 'user_default';
        setUserId(currentUserId);

        let session = 1;
        if (passedSessionNumber) {
          session = passedSessionNumber;
        } else if (isPlayAgain) {
          const lastSession = await getLastSessionNumber(currentUserId, skillId);
          session = lastSession || 1;
        } else {
          session = await getNextSessionToPlay(currentUserId, skillId);
        }
        setSessionNumber(session);
        
        const qs = await getQuestionsForSession(skillId, session);
        
        if (qs && qs.length > 0) {
          const parsedQs = qs.map(q => {
            let options = [];
            let media = [];
            try {
                // Parse Options
                if (Array.isArray(q.options_json)) {
                    options = q.options_json;
                } else if (typeof q.options_json === 'string') {
                    let raw = q.options_json.trim();
                    if (raw.startsWith('"') && raw.endsWith('"')) {
                         try { raw = JSON.parse(raw); } catch (e) {}
                    }
                    if (raw.startsWith('[') && raw.endsWith(']') && !raw.includes('"')) {
                         options = raw.slice(1, -1).split(',').map(s => s.trim());
                    } else {
                         options = JSON.parse(raw);
                    }
                } else {
                    options = [];
                }

                // Parse Media
                if (q.media_uri) {
                    if (q.media_uri.trim().startsWith('[') && q.media_uri.trim().endsWith(']')) {
                         media = JSON.parse(q.media_uri);
                    } else {
                         media = [q.media_uri];
                    }
                }
            } catch (e) {
                if (typeof q.options_json === 'string' && q.options_json.length > 0) {
                    options = [q.options_json]; 
                } else {
                    options = ["Option A", "Option B", "Option C"]; 
                }
                if (q.media_uri) media = [q.media_uri];
            }
            // Shuffle options for each question ONLY if it's MCQ or Selection
            // For drag_order, we shuffle the options so the user has to order them
            // For image_selection, we might want to shuffle visuals?
            // Let's rely on the seeder order or shuffle here if needed.
            // const shuffledOptions = shuffleArray(options);
            
            return { 
                ...q, 
                options: options, 
                media: media,
                type: q.type || 'mcq',
                question: q.question_text, 
                correctAnswer: q.correct_answer 
            };
          });
          // Shuffle the entire questions list
          const finalQs = shuffleArray(parsedQs);
          setQuestions(finalQs);
        }
        setStartTime(Date.now());
      } catch (e) {
        console.error("Failed to load quiz data", e);
      }
    };
    loadData();
  }, [skillId]);

  const currentQuestion = questions[currentQuestionIndex];

  const getPraise = (index) => shuffledPraises[index % shuffledPraises.length];
  const getEncouragement = (index) => shuffledEncouragements[index % shuffledEncouragements.length];

  const playSoundEffect = async (isCorrect, rotatingSoundFile) => {
    try {
        if (isCorrect) {
             const { sound } = await Audio.Sound.createAsync(
                 require('../../assets/sound/genius-sound.mp3'), 
                 { shouldPlay: true, volume: 1.0 }
             );
             sound.setOnPlaybackStatusUpdate(async (status) => {
                 if (status.didJustFinish) {
                     await sound.unloadAsync();
                 }
             });
             
             if (rotatingSoundFile) {
                // Play praise sound after genius sound
                setTimeout(async () => {
                    try {
                        const { sound: exc } = await Audio.Sound.createAsync(
                            rotatingSoundFile, 
                            { shouldPlay: true, volume: 1.0 }
                        );
                        exc.setOnPlaybackStatusUpdate(async (status) => {
                            if (status.didJustFinish) {
                                await exc.unloadAsync();
                            }
                        });
                    } catch (e) { console.log(e); }
                }, 800); 
             }
        } else {
             // Play wrong answer sound/rotating sound
             if (rotatingSoundFile) {
                const { sound: exc } = await Audio.Sound.createAsync(
                    rotatingSoundFile, 
                    { shouldPlay: true, volume: 1.0 }
                );
                exc.setOnPlaybackStatusUpdate(async (status) => {
                    if (status.didJustFinish) {
                        await exc.unloadAsync();
                    }
                });
             }
        }
    } catch (e) { console.log("Sound Error:", e); }
  };

  const handleSubmit = () => {
      if (currentQuestion.type === 'drag_order') {
          handleAnswer(dragOrderedOptions.join(', '));
      } else {
          handleAnswer(selectedOption);
      }
  };

  const handleUseBomb = () => {
    if (sessionCoins < 50) {
      Alert.alert("Not enough coins!", "You need 50 coins to use a Bomb.");
      return;
    }
    
    const correct = currentQuestion.correctAnswer;
    const wrongOptions = currentQuestion.options.filter(
        opt => String(opt).trim() !== String(correct).trim()
    );

    if (wrongOptions.length < 2) {
         Alert.alert("Cannot use Bomb", "Not enough wrong options to remove!");
         return;
    }

    // 1. Deduct Cost
    setSessionCoins(prev => prev - 50);

    // 2. Randomly pick 2 to hide
    // Simple shuffle then slice
    const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
    const toRemove = shuffled.slice(0, 2);
    
    // 3. Update UI to disable/hide these buttons
    setDisabledOptions(prev => [...prev, ...toRemove]);
  };

  const handleFreezeTimer = () => {
      if (sessionCoins < 30) {
          Alert.alert("Not enough coins!", "You need 30 coins to Freeze Timer.");
          return;
      }
      if (isTimerFrozen) return;

      setSessionCoins(prev => prev - 30);
      setIsTimerFrozen(true);
  };

  const handleSkipQuestion = () => {
      if (sessionCoins < 100) {
          Alert.alert("Not enough coins!", "You need 100 coins to Skip.");
          return;
      }
      setSessionCoins(prev => prev - 100);

      // Move to next question without scoring
      if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setTimer(20);
          setIsTimerFrozen(false);
          setDisabledOptions([]);
          setAnswerHistory(prev => [...prev, 'skipped']); // Mark as skipped
      } else {
          // Last question skipped? Just finish
          setCongratsVisible(true);
      }
  };

  const handleRetryPrevious = () => {
      if (sessionCoins < 50) {
          Alert.alert("Not enough coins!", "You need 50 coins to Retry.");
          return;
      }
      if (currentQuestionIndex === 0) return;
      
      const lastResult = answerHistory[answerHistory.length - 1];
      if (lastResult === true) {
          Alert.alert("Previous Correct", "You got the last one right! No need to retry.");
          return;
      }

      setSessionCoins(prev => prev - 50);
      
      // Go back
      setCurrentQuestionIndex(prev => prev - 1);
      setAnswerHistory(prev => prev.slice(0, -1));
      // Reset state for re-attempt
      setTimer(20);
      setIsTimerFrozen(false);
      setDisabledOptions([]);
      // Score and streak are already handled (wrong answer reset streak to 0, didn't add score)
  };

  const handleAnswer = async (selectedOption) => {
    if (processingRef.current) return;

    // Play button press sound if it's a user action (not timeout)
    if (selectedOption !== null) {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/sound/ui-sound-answer-button-press.mp3'),
                { shouldPlay: true, volume: 1.0 }
            );
             sound.setOnPlaybackStatusUpdate(async (status) => {
                 if (status.didJustFinish) {
                     await sound.unloadAsync();
                 }
             });
        } catch (e) { console.log("Button sound error", e); }
    }

    processingRef.current = true;
    setIsProcessing(true);

    const isCorrect = selectedOption !== null && String(selectedOption).trim() === String(currentQuestion.correctAnswer).trim();
    let feedbackText = '';
    let feedbackSound = null;

    if (isCorrect) {
        const praise = getPraise(currentQuestionIndex);
        feedbackText = praise.text;
        feedbackSound = praise.sound;
    } else {
        const encouragement = getEncouragement(currentQuestionIndex);
        feedbackText = selectedOption === null ? "Time's Up!" : encouragement.text;
        
        // Only set feedbackSound if it's NOT a timeout
        if (selectedOption !== null) {
            feedbackSound = encouragement.sound;
        } else {
            feedbackSound = null; // Don't play default wrong sound for timeout
        }
    }

    setFeedback({ visible: true, isCorrect, correctAnswer: currentQuestion.correctAnswer, praiseText: feedbackText });
    
    // Play sound based on condition
    if (selectedOption === null) {
        // Play timeout sound specifically
        try {
            const { sound: toSound } = await Audio.Sound.createAsync(
                require('../../assets/sound/game-over-lost-sound.mp3'), 
                { shouldPlay: true, volume: 1.0 }
            );
            toSound.setOnPlaybackStatusUpdate(async (s) => { if(s.didJustFinish) await toSound.unloadAsync(); });
        } catch (e) { console.log(e); }
    } else {
        // Play normal feedback sounds
        playSoundEffect(isCorrect, feedbackSound);
    }

    // Streak Logic
    if (isCorrect) {
        const newStreak = streak + 1;
        let earnedCoins = 10;

        if (newStreak === 3) {
            triggerStreakEffect();
            setStreak(0);
            earnedCoins = 20; // Bonus for streak
        } else {
            setStreak(newStreak);
        }
        setSessionCoins(prev => prev + earnedCoins);
    } else {
        setStreak(0);
    }

    setTimeout(async () => {
        setFeedback({ visible: false, isCorrect: false, correctAnswer: '', praiseText: '' });
        
        let newScore = score;
        if (isCorrect) {
             newScore += 1;
             setCorrectCount(prev => prev + 1);
        }
        setScore(newScore);
        setAnswerHistory(prev => [...prev, isCorrect]);
        setDisabledOptions([]); // Reset power-ups

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimer(20); // Reset timer immediately to prevent double-trigger
            setIsProcessing(false);
            processingRef.current = false;
        } else {
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);
            const finalScore = isCorrect ? score + 1 : score;
            
            try {
              const newRewards = await saveSessionResult(userId, skillId, sessionNumber, finalScore, isCorrect ? correctCount + 1 : correctCount, questions.length, timeTaken);
              setEarnedRewards(newRewards || []);
              syncData();
            } catch (e) { console.error("Failed to save session", e); }
            setTotalTimeTaken(timeTaken);
            setCongratsVisible(true);
        }
    }, 1500);
  };

  if (!currentQuestion) return <View style={styles.container}><Text>Loading...</Text></View>;

  // Colors for answer buttons
  const buttonColors = ['#9C27B0', '#4285F4', '#4CAF50', '#E91E63']; // Purple instead of Yellow
  return (
    <ImageBackground
      source={require('../../assets/screens/main_bg.png')} // Or a specific forest BG if available
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header (Stars/Dots) */}
          <View style={styles.headerBar}>
              <View style={styles.timerContainer}>
                  <Ionicons name="timer-outline" size={24} color="#FF5722" />
                  <Text style={[styles.timerText, timer <= 5 && styles.timerLow]}>{timer}s</Text>
              </View>

              {/* Coin Display */}
              <View style={styles.coinDisplay}>
                  <View style={styles.coinIconCircle}>
                     <Ionicons name="logo-bitcoin" size={20} color="#FFD700" />
                  </View>
                  <Text style={styles.coinCountText}>{sessionCoins}</Text>
              </View>

              <View style={styles.progressBarContainer}>
                  {/* Performance stars: 1 star for every 2 correct answers, up to 5 stars */}
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                      // User gets a star for every 2 correct answers
                      const active = score >= starIdx * 2;
                      return (
                        <Ionicons 
                            key={`star-${starIdx}`} 
                            name={active ? "star" : "star-outline"} 
                            size={18} 
                            color={active ? "#FFD700" : "#ccc"} 
                            style={styles.headerIcon} 
                        />
                      );
                  })}
              </View>
          </View>

          {/* Question Card */}
          <QuestionBox 
            question={currentQuestion.question} 
            image={(currentQuestion.type === 'selection' || currentQuestion.type === 'image_selection') ? null : (currentQuestion.media_uri ? `${currentQuestion.media_uri}?v=${cacheBuster}` : null)} 
          />

          {/* Answer Section */}
          <View style={styles.answersBody}>
            
            {/* MCQ (Classic) */}
            {currentQuestion.type === 'mcq' && (
                <View style={styles.answersContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <AnswerButton
                            key={index}
                            text={option}
                            onPress={() => handleAnswer(option)}
                            color={buttonColors[index % buttonColors.length]}
                            disabled={disabledOptions.includes(option)}
                        />
                    ))}
                </View>
            )}

            {/* Selection (Text Buttons, Confirmation) */}
            {currentQuestion.type === 'selection' && (
                <View style={styles.answersContainer}>
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedOption === option;
                        return (
                            <Pressable
                                key={index}
                                onPress={() => setSelectedOption(option)}
                                style={({ pressed }) => [
                                    styles.selectionBtn,
                                    { backgroundColor: buttonColors[index % buttonColors.length] },
                                    isSelected && styles.selectionBtnSelected,
                                    pressed && { opacity: 0.9 }
                                ]}
                            >
                                <Text style={styles.selectionBtnText}>{option}</Text>
                                {isSelected && (
                                    <View style={styles.selectedOverlay}>
                                        <Ionicons name="checkmark-circle" size={30} color="white" />
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            )}

            {/* Image Selection */}
            {currentQuestion.type === 'image_selection' && (
                <View style={styles.imageGrid}>
                    {currentQuestion.media.map((img, index) => {
                        // Option value is string '1', '2' etc.
                        const optionValue = currentQuestion.options[index] || String(index + 1);
                        const isSelected = selectedOption === optionValue;
                        
                        // Construct URI robustly
                        const cleanImg = img.replace(/^\//, ''); // Remove leading slash
                        // Check if IMAGE_URL already has trailing slash or not (usually safe to add one or rely on cleanImg not having one)
                        // Ideally: IMAGE_URL should be "http://domain.com"
                        const uri = img.startsWith('http') ? img : `${IMAGE_URL}/${cleanImg}`;
                        
                        return (
                            <Pressable
                                key={index}
                                onPress={() => setSelectedOption(optionValue)}
                                style={[styles.imageOption, isSelected && styles.imageOptionSelected]}
                            >
                                <Image 
                                    source={{ uri: uri }} 
                                    style={styles.imageOptionImg}
                                    resizeMode="contain"
                                    onError={(e) => console.log(`Failed to load image: ${uri}`, e.nativeEvent.error)}
                                />
                                {isSelected && (
                                    <View style={styles.checkBadge}>
                                        <Ionicons name="checkmark" size={20} color="white" />
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            )}

            {/* Drag Order */}
            {currentQuestion.type === 'drag_order' && (
                <View style={styles.dragContainer}>
                    <Text style={styles.dragLabel}>Your Order:</Text>
                    <View style={styles.dragTargetArea}>
                        {dragOrderedOptions.map((item, index) => (
                            <TouchableOpacity key={`target-${index}`} onPress={() => setDragOrderedOptions(prev => prev.filter((_, i) => i !== index))}>
                                <View style={[styles.dragItem, styles.dragItemTarget]}>
                                    <Text style={styles.dragItemText}>{item}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {dragOrderedOptions.length === 0 && <Text style={styles.dragPlaceholder}>Tap items below to order</Text>}
                    </View>

                    <Text style={[styles.dragLabel, {marginTop: 20}]}>Tap to Add:</Text>
                    <View style={styles.dragPool}>
                        {currentQuestion.options.filter(opt => !dragOrderedOptions.includes(opt)).map((item, index) => (
                            <TouchableOpacity key={`pool-${index}`} onPress={() => setDragOrderedOptions(prev => [...prev, item])}>
                                <View style={[styles.dragItem, styles.dragItemPool]}>
                                    <Text style={styles.dragItemText}>{item}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Submit Button (Non-MCQ) */}
            {currentQuestion.type !== 'mcq' && (
                <TouchableOpacity 
                    style={[styles.submitBtn, (!selectedOption && (currentQuestion.type !== 'drag_order' || dragOrderedOptions.length === 0)) && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!selectedOption && (currentQuestion.type !== 'drag_order' || dragOrderedOptions.length === 0)}
                >
                    <Text style={styles.submitBtnText}>SUBMIT</Text>
                </TouchableOpacity>
            )}

          </View>
          
           {/* Power-ups Dock */}
           <View style={styles.powerUpRow}>
               
               {/* Bomb */}
               <TouchableOpacity 
                    style={[styles.powerUpBtn, sessionCoins < 50 && styles.powerUpBtnDisabled]} 
                    onPress={handleUseBomb}
                    activeOpacity={sessionCoins < 50 ? 1 : 0.7}
               >
                   <Ionicons name="flash" size={24} color={sessionCoins < 50 ? "#999" : "#FF9800"} />
                   <View style={styles.costBadge}>
                       <Text style={styles.costText}>50</Text>
                   </View>
               </TouchableOpacity>

               {/* Freeze */}
               <TouchableOpacity 
                    style={[
                        styles.powerUpBtn, 
                        sessionCoins < 30 && !isTimerFrozen && styles.powerUpBtnDisabled,
                        isTimerFrozen && styles.powerUpBtnActive
                    ]} 
                    onPress={handleFreezeTimer}
                    activeOpacity={sessionCoins < 30 ? 1 : 0.7}
               >
                   <Ionicons name={isTimerFrozen ? "snow" : "time"} size={24} color={isTimerFrozen ? "#2196F3" : (sessionCoins < 30 ? "#999" : "#03A9F4")} />
                   <View style={styles.costBadge}>
                       <Text style={styles.costText}>{isTimerFrozen ? "Active" : "30"}</Text>
                   </View>
               </TouchableOpacity>

               {/* Retry Previous - Only visible if previous was wrong */}
               {currentQuestionIndex > 0 && answerHistory[answerHistory.length - 1] !== true && (
                    <TouchableOpacity 
                            style={[styles.powerUpBtn, sessionCoins < 50 && styles.powerUpBtnDisabled]} 
                            onPress={handleRetryPrevious}
                            activeOpacity={sessionCoins < 50 ? 1 : 0.7}
                    >
                        <Ionicons name="refresh-circle" size={28} color={sessionCoins < 50 ? "#999" : "#4CAF50"} />
                        <View style={styles.costBadge}>
                            <Text style={styles.costText}>50</Text>
                        </View>
                    </TouchableOpacity>
               )}

               {/* Skip */}
               <TouchableOpacity 
                    style={[styles.powerUpBtn, sessionCoins < 100 && styles.powerUpBtnDisabled]} 
                    onPress={handleSkipQuestion}
                    activeOpacity={sessionCoins < 100 ? 1 : 0.7}
               >
                   <Ionicons name="play-skip-forward" size={24} color={sessionCoins < 100 ? "#999" : "#9C27B0"} />
                   <View style={styles.costBadge}>
                       <Text style={styles.costText}>100</Text>
                   </View>
               </TouchableOpacity>

           </View>

        </ScrollView>
      </SafeAreaView>
      
      <FeedbackModal  
        visible={feedback.visible} 
        isCorrect={feedback.isCorrect} 
        correctAnswer={feedback.correctAnswer} 
        praiseText={feedback.praiseText}
      />

      {showStreakAnimation && (
        <View style={styles.streakContainer} pointerEvents="none">
           <LottieView
              source={require('../../assets/screens/questionnaire/streak-ightning.json')}
              autoPlay
              loop={false}
              style={styles.streakLottie}
           />
           <View style={styles.streakTextWrapper}>
                <Text style={styles.streakText}>3 IN A ROW!</Text>
                <Text style={styles.streakSubText}>STREAK!</Text>
           </View>
        </View>
      )}

      <CongratulationModal
        visible={congratsVisible}
        score={score}
        totalQuestions={questions.length}
        timeTaken={totalTimeTaken}
        onContinue={() => {
          setCongratsVisible(false);
          navigation.navigate('SkillsTopic', { subjectId, subjectName, level });
        }}
        onPlayAgain={() => {
          setCongratsVisible(false);
          navigation.replace('ReadyToQuiz', { skillId, skillName, subjectName, isPlayAgain: true });
        }}
        earnedRewards={earnedRewards}
      />

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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    alignItems: 'center',
  },
  
  // --- Header ---
  headerBar: {
    width: '90%',
    height: 60,
    backgroundColor: '#FFF8E1', // Light beige
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 15,
      marginRight: 15,
      borderWidth: 1,
      borderColor: '#FFD180',
  },
  timerText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginLeft: 5,
      minWidth: 35,
  },
  timerLow: {
      color: '#FF5722',
  },
  progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  headerIcon: {
      marginHorizontal: 1,
  },

  // Awards
  awardsContainer: {
      marginTop: 20,
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: 15,
      padding: 10,
      alignItems: 'center',
  },
  awardsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
  },
  awardsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 15,
  },
  awardItem: {
      alignItems: 'center',
  },
  awardIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'gold',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
      elevation: 2,
  },
  awardLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#555',
  },
  progressDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginHorizontal: 2,
  },

  // --- Question Card ---
  questionCardContainer: {
    flex:1,
    backgroundColor:"blue",
    //   width: '90%',
    //   marginBottom: 30,
      // alignItems: 'center',
      // display:"none",
  },
  questionCard: {
    display:"none",
      width: '100%',
      aspectRatio: 1, // Square-ish
      backgroundColor: '#F3E5AB', // Parchment color
      borderRadius: 20,
      padding: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 6,
      display:"none",
      borderWidth: 2,
      borderColor: '#D4AF37', // Gold border
      marginTop: 25, // Make room for top_layer if it sticks out
      overflow: 'visible', // Allow top_layer to stick out
  },
  topLayerDecoration: {
    // backgroundColor:"red",
    width: '100%',
    height:300,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    aspectRatio: 2,

  },
  questionCardInner: {
      flex: 1,
      zIndex: 2, // Content on top
      borderWidth: 2,
      borderColor: 'rgba(139, 69, 19, 0.1)', // Subtle inner border
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
  },
  questionImage: {
    aspectRatio:1.5,
      width: '90%',
      height: '60%',
      marginBottom: 20,
  },
  imagePlaceholder: {
      width: '80%',
      height: '60%',
      backgroundColor: 'rgba(255,255,255,0.5)',
      marginBottom: 20,
      borderRadius: 10,
  },
  questionText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#4E342E',
      textAlign: 'center',
  },

  // --- Answers ---
  answersContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 20,
      width: '100%',
      paddingHorizontal: 20,
  },
  answerBtn: {
      minWidth: 80,
      minHeight: 80,
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
      position: 'relative',
      overflow: 'hidden',
  },
  answerBtnInner: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  answerBtnText: {
      color: 'white',
      fontSize: 24, // Slightly reduced to better fit dynamic text
      fontWeight: 'bold',
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
  },
  btnHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '40%',
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
  },

  // --- Modals ---
  feedbackOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  feedbackBox: {
      padding: 30,
      borderRadius: 20,
      alignItems: 'center',
      minWidth: 200,
  },
  feedbackCorrect: {
      backgroundColor: '#E8F5E9',
      borderWidth: 3,
      borderColor: '#4CAF50',
  },
  feedbackWrong: {
      backgroundColor: '#FFEBEE',
      borderWidth: 3,
      borderColor: '#F44336',
  },
  feedbackTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
  },
  feedbackSub: {
      fontSize: 18,
      color: '#555',
  },
  
  modalMainBg: {
    flex: 1,
  },
  congratsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  congratsLottie: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  congratsContent: {
    width: '90%',
    alignItems: 'center',
    zIndex: 10,
  },
  
  // --- Banner Styles ---
  bannerContainer: {
    width: '100%',
    height: 60,
    alignItems: 'center',
    zIndex: 10,
    marginBottom: 30,
  },
  bannerRibbon: {
    width: '95%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 2,
  },
  bannerText: {
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  ribbonEnd: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#D84315',
    zIndex: 1,
    top: 15,
  },
  ribbonLeft: {
    left: 0,
    transform: [{ rotate: '45deg' }],
  },
  ribbonRight: {
    right: 0,
    transform: [{ rotate: '45deg' }],
  },
  
  // --- Stars Styles ---
  congratsStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  modalStar: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // --- Card Styles ---
  congratsCard: {
    width: '100%',
    backgroundColor: '#F3E5AB', // Parchment
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#FFF8E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  congratsLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8D6E63',
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
    color: 'white',
    fontSize: 36,
    fontWeight: '900',
  },
  
  // --- Stats Styles ---
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E342E',
  },
  
  // --- Mascot ---
  congratsMascot: {
    width: 180,
    height: 180,
    position: 'absolute',
    bottom: -45,
    right: -38,
    zIndex: 20,
  },
  
  // --- Buttons ---
  congratsButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    justifyContent: 'center',
  },
  modalBtn: {
    flex: 1,
    height: 55,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    maxWidth: 160,
  },
  modalBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // --- Streak Animation ---
  streakContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999999999999,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  streakLottie: {
    width: 300,
    height: 300,
  },
  streakTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  streakSubText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  
  // --- Coin Header ---
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  coinIconCircle: {
      marginRight: 5,
  },
  coinCountText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#F57F17',
  },

  // --- Power Ups ---
  powerUpRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      marginTop: 40,
      paddingHorizontal: 20,
      marginBottom: 30,
  },
  powerUpBtn: {
      width: 55,
      height: 55,
      borderRadius: 30,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      position: 'relative',
  },
  powerUpBtnDisabled: {
      backgroundColor: '#F0F0F0',
      elevation: 0,
      borderWidth: 1,
      borderColor: '#DDD',
  },
  powerUpBtnActive: {
      backgroundColor: '#E3F2FD',
      borderWidth: 2,
      borderColor: '#2196F3',
      elevation: 2,
  },
  costBadge: {
      position: 'absolute',
      bottom: -10,
      backgroundColor: '#37474F',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#FFF',
  },
  costText: {
      color: '#FFD700',
      fontSize: 10,
      fontWeight: 'bold',
  },

  // --- Disabled Button ---
  answerBtnDisabled: {
      backgroundColor: '#E0E0E0',
      elevation: 0,
      shadowOpacity: 0,
  },
  answerBtnTextDisabled: {
      color: '#9E9E9E',
  },
  
  // --- New Types Styles ---
  answersBody: {
      width: '100%',
      alignItems: 'center',
  },
  selectionBtn: {
      width: '45%',
      aspectRatio: 1.5,
      marginBottom: 20,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      position: 'relative',
      overflow: 'hidden',
  },
  selectionBtnSelected: {
      borderWidth: 4,
      borderColor: '#FFD700',
      transform: [{scale: 1.02}],
  },
  selectionBtnText: {
      color: 'white',
      fontSize: 28,
      fontWeight: 'bold',
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
  },
  selectedOverlay: {
      position: 'absolute',
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  
  // Image Selection
  imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 15,
      width: '100%',
  },
  imageOption: {
      width: '45%',
      aspectRatio: 1,
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 10,
      borderWidth: 2,
      borderColor: '#E0E0E0',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
  },
  imageOptionSelected: {
      borderColor: '#4CAF50',
      borderWidth: 4,
      backgroundColor: '#E8F5E9',
  },
  imageOptionImg: {
      width: '100%',
      height: '100%',
  },
  checkBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: '#4CAF50',
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
  },

  // Drag Order
  dragContainer: {
      width: '100%',
      paddingHorizontal: 20,
  },
  dragLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#5D4037',
      marginBottom: 10,
  },
  dragTargetArea: {
      minHeight: 80,
      backgroundColor: 'rgba(255,255,255,0.6)',
      borderWidth: 2,
      borderColor: '#8D6E63',
      borderStyle: 'dashed',
      borderRadius: 15,
      padding: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      alignItems: 'center',
  },
  dragPool: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 10,
  },
  dragItem: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      elevation: 2,
  },
  dragItemTarget: {
      backgroundColor: '#FF9800',
  },
  dragItemPool: {
      backgroundColor: '#2196F3',
  },
  dragItemText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 18,
  },
  dragPlaceholder: {
      color: '#8D6E63',
      fontStyle: 'italic',
      width: '100%',
      textAlign: 'center',
  },

  // Submit Button
  submitBtn: {
      backgroundColor: '#4CAF50',
      width: '80%',
      paddingVertical: 15,
      borderRadius: 30,
      alignItems: 'center',
      marginTop: 30,
      marginBottom: 10,
      alignSelf: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
  },
  submitBtnDisabled: {
      backgroundColor: '#BDBDBD',
      elevation: 0,
  },
  submitBtnText: {
      color: 'white',
      fontSize: 22,
      fontWeight: 'bold',
      letterSpacing: 1,
  },
});
