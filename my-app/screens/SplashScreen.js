import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ImageBackground, Animated, Dimensions, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current; // New progress animation

  useEffect(() => {
    // Logo Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false, // Changed to false for width interpolation if needed elsewhere, but mainly consistent
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Loading Text Fade In
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Progress Bar Animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000, // 3 seconds matching the timer
      useNativeDriver: false, // Width property doesn't support native driver
    }).start();

    // Finish after 3 seconds
    const timer = setTimeout(() => {
      onFinish && onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [scaleAnim, fadeAnim, progressAnim, onFinish]);

  return (
    <ImageBackground 
      source={require('../assets/screens/splash/bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.logoContainer}>
        <Animated.Image 
          source={require('../assets/screens/splash/splash_banner.png')} 
          style={[
            styles.logo,
            { transform: [{ scale: scaleAnim }] }
          ]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.panelContainer}>
        <ImageBackground
           source={require('../assets/screens/splash/splash_main_pannel.png')}
           style={styles.panel}
           resizeMode="contain"
        >
             <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
              <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBarFill, { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }) 
                }]} />
              </View>
              <Text style={styles.loadingText}>Loading ...</Text>
            </Animated.View>
        </ImageBackground>
      </View>
      
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: height * -0.2, // Position from top
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: width * 0.85,  
    height: height * 0.8, 
  },
  panelContainer: {
    flex: 2,
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  panel: {
    width: width * 1,
    height: 570, 
    alignItems: 'center',
    justifyContent: 'flex-end', // Align children to bottom
    paddingBottom: 20, // Add padding to position content inside the panel area
  },
  loadingContainer: {
    position:'relative',
    bottom: 60,
    alignItems: 'center',
    width: '60%',
    
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#cc732d',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#cc732d',
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4e2813', // Gold/Yellow
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
  },
});
