import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, ImageBackground, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../service/api';
import { useAudio } from '../../context/AudioContext';
import main_bg from '../../assets/screens/main_bg.png';

import age_5 from '../../assets/screens/age/age_5.png';
import age_6 from '../../assets/screens/age/age_6.png';
import age_7 from '../../assets/screens/age/age_7.png';
import age_8 from '../../assets/screens/age/age_8.png';
import age_9 from '../../assets/screens/age/age_9.png';
import age_10 from '../../assets/screens/age/age_10.png';
import age_11 from '../../assets/screens/age/age_11.png';
import age_12 from '../../assets/screens/age/age_12.png';
import age_13 from '../../assets/screens/age/age_13.png';
import age_14 from '../../assets/screens/age/age_14.png';
import age_15 from '../../assets/screens/age/age_15.png';
import top_layer from '../../assets/screens/age/top_layer.png';
import next_btn from '../../assets/screens/levels/next.png';

// Generating ages 5 to 15
const AGE_IMAGES = {
  '5': age_5,
  '6': age_6,
  '7': age_7,
  '8': age_8,
  '9': age_9,
  '10': age_10,
  '11': age_11,
  '12': age_12,
  '13': age_13,
  '14': age_14,
  '15': age_15,
};

const AGES = Array.from({ length: 11 }, (_, i) => (i + 5).toString());

export default function AgeScreen({ navigation, route }) {
  const [selectedAge, setSelectedAge] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { playButtonPressSound } = useAudio();

  // Get name from previous screen
  const { name } = route.params || {};

  const handleFinish = async () => {
    playButtonPressSound();
    if (selectedAge) {
      setIsLoading(true);
      try {
        await authAPI.updateAge(parseInt(selectedAge));
        // Finalize registration logic here
        // Navigate to Welcome Screen
        navigation.navigate('Welcome', { name });
      } catch (error) {
        console.error('Error updating age:', error);
        Alert.alert('Error', 'Failed to update age. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderItem = ({ item }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.ageOption, 
        selectedAge === item && styles.selectedAgeOption,
        pressed && styles.pressedOption
      ]} 
      onPress={() => setSelectedAge(item)}
      disabled={isLoading}
    >
      <Image source={AGE_IMAGES[item]} style={styles.ageImage} resizeMode="contain" />
      {selectedAge === item && (
        <View style={styles.checkContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        </View>
      )}
    </Pressable>
  );

  return (
    <ImageBackground source={main_bg} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <Image source={top_layer} style={styles.topImage} resizeMode="contain" />
        {/* <Text style={styles.title}>How old are you?</Text> */}
        
        <View style={styles.gridContainer}>
          <FlatList
            data={AGES}
            renderItem={renderItem}
            keyExtractor={item => item}
            numColumns={3}
            contentContainerStyle={styles.list}
          />

          <TouchableOpacity 
            style={[styles.button, (!selectedAge || isLoading) && styles.disabledButton]} 
            onPress={handleFinish}
            disabled={!selectedAge || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
               <Image source={next_btn} style={styles.buttonImage} resizeMode="contain" />
            )}
          </TouchableOpacity>
        </View>

        {/* Removed button from here as it's now inside gridContainer for better layout control or kept outside if preferred, but usually next button is below list */}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    // padding: 20,
    // backgroundColor: '#fff', // Removed for background image
  },
  topImage: {
    width: '100%',
    height: 500,
    marginBottom: 300,
    alignSelf: 'center',
    aspectRatio: 1.06,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 30,
    textAlign: 'center',
    color: '#333',
  },
  gridContainer: {
    padding: 0,
    marginBottom: 0,
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    alignItems: 'center', // Center content horizontally if needed, or remove if full width list
  },
  list: {
    paddingVertical: 10,
  },
  ageOption: {
    borderRadius: 8,
    width: '33%', // Increased from 26%
    height: 50, // Uncommented to maintain square shape
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6
  },
  selectedAgeOption: {
    // backgroundColor: '#e6f2ff',
    // borderColor: '#007AFF',
    // borderWidth: 2,
    // transform: [{ scale: 1.1 }], // Removed scale up
  },
  pressedOption: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  checkContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
    zIndex: 5,
  },
  ageImage: {
    width: '100%',
    height: '100%',
  },

  button: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 120,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonImage: {
    width: 200,
    height: 60,
  },
});

