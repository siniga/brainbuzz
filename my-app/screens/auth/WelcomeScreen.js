import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Image, Animated, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { syncData } from '../../service/sync';
import { useAudio } from '../../context/AudioContext';

const bgImage = require('../../assets/screens/main_bg.png');
const logoImage = require('../../assets/screens/logo.png');
const nextBtn = require('../../assets/screens/welcome/next_btn.png');
const ageMainPanel = require('../../assets/screens/welcome/age_main_pannel.png');

export default function WelcomeScreen({ navigation, route }) {
  // We can pass the name via route params from RegistrationScreen
  const { name, autoSync } = route.params || { name: 'Friend', autoSync: false };
  
  // Animation value for scale
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [isSyncing, setIsSyncing] = useState(true);
  const { playButtonPressSound } = useAudio();

  useEffect(() => {
    // Start syncing data in the background when welcome screen loads
    const performSync = async () => {
      // Only perform sync if autoSync is requested (e.g. coming from Login/Register)
      // This prevents infinite loops if an unauthenticated user lands here
      if (autoSync) {
        console.log('Starting background sync...');
        setIsSyncing(true);
        await syncData();
        setIsSyncing(false);
        console.log('Background sync finished');
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else {
        // If we are not syncing, ensure loading state is false so user can see the button
        setIsSyncing(false);
      }
    };
    performSync();
  }, [autoSync, navigation]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ImageBackground source={bgImage} style={styles.backgroundImage} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <Image source={ageMainPanel} style={styles.panel} resizeMode="contain" />
        
        {/* Sync functionality preserved */}
        {isSyncing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Syncing data...</Text>
          </View>
        ) : (
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              playButtonPressSound();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
              });
            }}
            style={styles.imageButton}
          >
            <Animated.Image 
              source={nextBtn} 
              style={[
                styles.buttonImage, 
                { transform: [{ scale: scaleValue }] }
              ]} 
              resizeMode="contain" 
            />
          </Pressable>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor: '#fff', // Removed to show background image
    justifyContent: 'center', // Center sync loader
    alignItems: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  panel: {
    width: "100%",
    height: 500,
    aspectRatio: 1,
    zIndex: 1,
  },
  imageButton: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  buttonImage: {
    width: 200,
    height: 60,
  },
});

