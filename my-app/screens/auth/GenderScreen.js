import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ImageBackground, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../service/api';
import { useAudio } from '../../context/AudioContext';
import main_bg from '../../assets/screens/main_bg.png';
import top_layer from '../../assets/screens/gender/top_layer.png';
import boy_img from '../../assets/screens/gender/boy.png';
import girl_img from '../../assets/screens/gender/girl.png';
import boy_btn from '../../assets/screens/gender/boy_btn.png';
import girl_btn from '../../assets/screens/gender/girl_btn.png';
import next_btn from '../../assets/screens/levels/next.png';

const GENDERS = [
  { label: 'Boy', image: boy_img, button: boy_btn },
  { label: 'Girl', image: girl_img, button: girl_btn },
];

export default function GenderScreen({ navigation, route }) {
  const [selectedGender, setSelectedGender] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { playButtonPressSound } = useAudio();

  // Get name from previous screen
  const { name } = route.params || {};

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
  };

  const handleNext = async () => {
    playButtonPressSound();
    if (selectedGender) {
      setIsLoading(true);
      // Map 'Boy' to 'Male' and 'Girl' to 'Female' for backend
      const genderValue = selectedGender === 'Boy' ? 'Male' : 'Female';
      
      try {
        await authAPI.updateGender(genderValue);
        navigation.navigate('Age', { name });
      } catch (error) {
        console.error('Error updating gender:', error);
        Alert.alert('Error', 'Failed to update gender. Please try again.');
      } finally {
        setIsLoading(false); 
      }
    }
  };

  return (
    <ImageBackground source={main_bg} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <Image source={top_layer} style={styles.topImage} resizeMode="contain" />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
             <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        <View style={styles.optionsContainer}>
          <View style={styles.genderRow}>
            {GENDERS.map((genderItem) => (
              <View key={genderItem.label} style={styles.genderWrapper}>
                <Image source={genderItem.image} style={styles.genderImage} resizeMode="contain" />
                <Pressable 
                  onPress={() => handleGenderSelect(genderItem.label)}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    pressed && styles.pressedButton
                  ]}
                >
                   <Image 
                    source={genderItem.button} 
                    style={[styles.genderButtonImage, selectedGender === genderItem.label && styles.selectedGenderButtonImage]} 
                    resizeMode="contain" 
                  />
                  {selectedGender === genderItem.label && (
                    <View style={styles.checkContainer}>
                       <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </Pressable>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.button, (!selectedGender || isLoading) && styles.disabledButton]} 
            onPress={handleNext}
            disabled={!selectedGender || isLoading}
          >
             {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Image source={next_btn} style={styles.buttonImage} resizeMode="contain" />
            )}
          </TouchableOpacity>
        </View>
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
    padding: 20,
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topImage: {
    width: '100%',
    height: 500,
    marginBottom: 300,
    alignSelf: 'center',
    aspectRatio: 1.03,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#333',
    display: 'none',
  },
  optionsContainer: {
    // flexDirection: 'row', // Removed row to allow column layout
    // justifyContent: 'space-around',
    marginBottom: 40,
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    alignItems: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  genderWrapper: {
    alignItems: 'center',
  },
  genderImage: {
    width: 200,
    height: 210,
    marginBottom: 10,
  },
  genderButtonImage: {
    width: 160,
    height: 50,
  },
  selectedGenderButtonImage: {
    // transform: [{ scale: 1.1 }], // Removed scale up
  },
  pressedButton: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  checkContainer: {
    position: 'absolute',
    top: -5,
    right: 15, // Adjusted to be near the right edge of the button image (width 160)
    backgroundColor: 'white',
    borderRadius: 12,
    zIndex: 5,
  },
  button: {
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonImage: {
    width: 200,
    height: 60,
  },
});

