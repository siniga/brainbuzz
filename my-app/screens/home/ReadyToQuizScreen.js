import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useAudio } from '../../context/AudioContext';

const { width, height } = Dimensions.get('window');
const readyMainPanel = require('../../assets/screens/readytoquiz/ready_main_pannel.png');
const countdownSoundFile = require('../../assets/sound/count-down-1.mp3');

export default function ReadyToQuizScreen({ route, navigation }) {
  // Now we receive specific skill details
  const { skillId, skillName, subjectId, subjectName, level, isPlayAgain, sessionNumber } = route.params || {}; 
  const [count, setCount] = useState(3);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { pauseBackgroundMusic, resumeBackgroundMusic } = useAudio();
  const soundRef = useRef(null);

  // Play Sound & Manage BG Music
  useEffect(() => {
    let mounted = true;
    let soundLoaded = false;

    const initAudio = async () => {
        try {
            // Configure audio mode first
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: false,
            });

            // Pause background music
            await pauseBackgroundMusic();
            
            // Play Countdown sound (not looping, since countdown is only 3 seconds)
            if (mounted) {
                const { sound } = await Audio.Sound.createAsync(
                    countdownSoundFile, 
                    { 
                        isLooping: false, 
                        shouldPlay: true, 
                        volume: 1.0 
                    }
                );
                
                if (mounted) {
                    soundRef.current = sound;
                    soundLoaded = true;
                    console.log("Countdown sound playing...");
                } else {
                    // Component unmounted before sound loaded, clean up immediately
                    await sound.unloadAsync().catch(() => {});
                }
            }
        } catch (e) {
            console.log("Error playing countdown sound:", e);
        }
    };

    initAudio();

    return () => {
        mounted = false;
        // Resume BG music
        resumeBackgroundMusic();
        
        // Unload Countdown sound only if it was successfully loaded
        if (soundRef.current && soundLoaded) {
            soundRef.current.unloadAsync().catch(() => {
                // Silently catch errors during cleanup
            });
            soundRef.current = null;
        }
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    if (count > 0) {
      // Pulse animation for each number
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Navigate when count reaches 0
      navigation.replace('Questionnaire', { skillId, skillName, subjectId, subjectName, level, isPlayAgain, sessionNumber });
    }
  }, [count]);

  return (
    <ImageBackground 
      source={require('../../assets/screens/main_bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <ImageBackground
        source={readyMainPanel}
        style={styles.panel}
        resizeMode="contain"
      >
      
        <Animated.View style={[styles.countdownContainer, { transform: [{ scale: scaleAnim }] }]}>
             <LinearGradient
                colors={['#FFB74D', '#EF6C00']} // Orange/Gold gradient
                style={styles.countdownCircle}
             >
                <View style={styles.innerCircle}>
                    <Text style={styles.countdownText}>{count > 0 ? count : 'Go!'}</Text>
                </View>
             </LinearGradient>
        </Animated.View>

      </ImageBackground>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    width: width * 1.32,
    height: width * 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: -40, // Move text up a bit
  },
  titleText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD54F', // Goldish color
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
    marginBottom: 10,
    fontFamily: 'serif', // Trying to match the style somewhat
  },
  subtitleText: {
    fontSize: 18,
    color: '#5D4037', // Brownish dark color
    textAlign: 'center',
    fontWeight: '600',
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 79,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF8E1',
    elevation: 10, // Shadow for android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  innerCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.1)', // Subtle highlight
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
  },
  countdownText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },


});
