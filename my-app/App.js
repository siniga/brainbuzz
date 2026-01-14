import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native'; // Added Image
import { Asset } from 'expo-asset'; // Import Asset
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomSplashScreen from './screens/SplashScreen';
import { navigationRef } from './service/navigationRef';
import HomeScreen from './screens/home/HomeScreen';
import SubjectSelectionScreen from './screens/home/SubjectSelectionScreen';
import LevelsScreen from './screens/home/LevelsScreen';
import ReadyToQuizScreen from './screens/home/ReadyToQuizScreen';
import QuestionnaireScreen from './screens/home/QuestionnaireScreen';
import MyStarsScreen from './screens/home/MyStarsScreen';
import MyRewardsScreen from './screens/home/MyRewardsScreen';
import ProfileScreen from './screens/home/ProfileScreen';
import SkillsTopicScreen from './screens/home/SkillsTopicScreen';
import DatabaseDebugScreen from './screens/DatabaseDebugScreen';
import SettingsScreen from './screens/SettingsScreen';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegistrationScreen from './screens/auth/RegistrationScreen';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import SelectClassScreen from './screens/auth/SelectClassScreen';
import SelectSubjectScreen from './screens/auth/SelectSubjectScreen';
import GenderScreen from './screens/auth/GenderScreen';
import AgeScreen from './screens/auth/AgeScreen';

// --- DATABASE IMPORTS ---
import { initDB, openDB } from './database/db';
import TempScreen from './screens/auth/TempScreen';

import { AudioProvider } from './context/AudioContext';
import MuteButton from './components/MuteButton';
import { ErrorProvider } from './context/ErrorContext';
import QuestionnaireNew from './screens/home/QuestionnaireNew';
import QuizCompleteScreen from './screens/quiz/QuizCompleteScreen';
// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

const Stack = createNativeStackNavigator();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [currentRouteName, setCurrentRouteName] = useState('Home');
  const [initialRoute, setInitialRoute] = useState('Home');

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Preload Images
        const imageAssets = [
          require('./assets/screens/splash/bg.png'),
          require('./assets/screens/splash/logo.png'),
          require('./assets/screens/splash/splash_main_pannel.png'),
          // Add other critical large background images here if needed
          require('./assets/screens/main_bg.png'), 
        ];

        const cacheImages = imageAssets.map(image => {
          return Asset.fromModule(image).downloadAsync();
        });

        await Promise.all(cacheImages);

        // 2. Initialize Database
        console.log('Initializing Database...');
        await initDB();
        console.log('Database Initialized.');

        // 3. Check for auth token
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          console.log('User token found, setting initial route to SubjectSelection');
          setInitialRoute('SubjectSelection');
        } else {
          console.log('No user token found, setting initial route to Welcome');
          setInitialRoute('Welcome');
        }

        // Artificially delay for a bit to simulate resource loading if needed
        // await new Promise(resolve => setTimeout(resolve, 500)); 
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (showCustomSplash) {
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <CustomSplashScreen 
          onFinish={() => setShowCustomSplash(false)} 
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorProvider>
        <AudioProvider>
          <NavigationContainer
            onStateChange={(state) => {
              const routeName = state?.routes[state.index]?.name;
              setCurrentRouteName(routeName);
            }}
            ref={navigationRef}
          >
            <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="SubjectSelection" component={SubjectSelectionScreen} />
              <Stack.Screen name="Levels" component={LevelsScreen} />
              <Stack.Screen name="SkillsTopic" component={SkillsTopicScreen} />
              <Stack.Screen name="ReadyToQuiz" component={ReadyToQuizScreen} />
              <Stack.Screen name="Questionnaire" component={QuestionnaireNew} />
              <Stack.Screen name="MyStars" component={MyStarsScreen} />
              <Stack.Screen name="MyRewards" component={MyRewardsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="DatabaseDebug" component={DatabaseDebugScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="QuizCompleteScreen" component={QuizCompleteScreen} />

              {/* Auth Screens */}
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Registration" component={RegistrationScreen} />
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="SelectClass" component={SelectClassScreen} />
              <Stack.Screen name="SelectSubject" component={SelectSubjectScreen} />
              <Stack.Screen name="Gender" component={GenderScreen} />
              <Stack.Screen name="Age" component={AgeScreen} />
            </Stack.Navigator>
            
            {currentRouteName !== 'Questionnaire' && <MuteButton />}
            <StatusBar style="auto" />
          </NavigationContainer>
        </AudioProvider>
      </ErrorProvider>
    </SafeAreaProvider>
  );
}
