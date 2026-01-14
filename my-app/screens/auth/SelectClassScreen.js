import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, ImageBackground, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../service/api';
import { useAudio } from '../../context/AudioContext';
import main_bg from '../../assets/screens/main_bg.png';
import top_layer from '../../assets/screens/levels/top_layer.png';
import st1 from '../../assets/screens/levels/st1.png';
import st2 from '../../assets/screens/levels/st2.png';
import st3 from '../../assets/screens/levels/st3.png';
import st4 from '../../assets/screens/levels/st4.png';
import st5 from '../../assets/screens/levels/st5.png';
import st6 from '../../assets/screens/levels/st6.png';
import st7 from '../../assets/screens/levels/st7.png';
import next_btn from '../../assets/screens/levels/next.png';

const STANDARD_IMAGES = {
  '1st': st1,
  '2nd': st2,
  '3rd': st3,
  '4th': st4,
  '5th': st5,
  '6th': st6,
  '7th': st7,
  // Fallback map if keys are just numbers or different format
  '1': st1,
  '2': st2,
  '3': st3,
  '4': st4,
  '5': st5,
  '6': st6,
  '7': st7,
};

export default function SelectClassScreen({ navigation, route }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { playButtonPressSound } = useAudio();

  // Get name from previous screen or default to empty
  const { name } = route.params || {};

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await authAPI.getStandards();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      Alert.alert('Error', 'Failed to load classes. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleNext = async () => {
    playButtonPressSound();
    if (selectedClass) {
      setIsLoading(true);
      try {
        await authAPI.updateStandard(selectedClass.id);
        // Store the selected standard locally
        await AsyncStorage.setItem('userStandard', String(selectedClass.id));
        
        navigation.navigate('SelectSubject', { name });
      } catch (error) {
        console.error('Error updating standard:', error);
        Alert.alert('Error', 'Failed to update class selection. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderItem = ({ item }) => {
    // Determine image based on item name/standard
    // Assuming item.name or item.standard contains "1st", "2nd", etc. or just "1", "2"
    const standardKey = item.name || item.standard || item.toString();
    // Normalize key to match mapping (e.g. "Standard 1" -> "1") if needed
    // Simple lookup:
    const imageSource = STANDARD_IMAGES[standardKey] || STANDARD_IMAGES[standardKey.replace(/[^0-9]/g, '')];

    return (
    <Pressable 
      style={({ pressed }) => [
        styles.option, 
        selectedClass?.id === item.id && styles.selectedOption,
        pressed && styles.pressedOption
      ]} 
      onPress={() => setSelectedClass(item)}
      disabled={isLoading}
    >
      {imageSource ? (
        <Image source={imageSource} style={styles.standardImage} resizeMode="stretch" />
      ) : (
        <Text style={[styles.optionText, selectedClass?.id === item.id && styles.selectedOptionText]}>{item.name || item.standard || item}</Text>
      )}
      {selectedClass?.id === item.id && (
        <View style={styles.checkContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        </View>
      )}
    </Pressable>
  )};

  if (isFetching) {
    return (
      <ImageBackground source={main_bg} style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={main_bg} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Image source={top_layer} style={styles.topImage} resizeMode="contain" />
        
        <View style={styles.listContainer}>
          <FlatList
            data={classes}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            numColumns={2}
            columnWrapperStyle={styles.row}
            ListEmptyComponent={<Text style={styles.emptyText}>No classes available.</Text>}
          />
           <TouchableOpacity 
          style={[styles.button, (!selectedClass || isLoading) && styles.disabledButton]} 
          onPress={handleNext}
          disabled={!selectedClass || isLoading}
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
  container: {
    flex: 1,
    // backgroundColor: '#fff', // Removed to show background image
  },
  safeArea: {
    flex: 1,
  },
  topImage: {
    width: '100%',
    height: 500,
    marginBottom: 300,
    alignSelf: 'center',
    aspectRatio: 1.03,
    zIndex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    marginTop: 100, // Added margin top to clear the image if needed, or adjust as per design
    textAlign: 'center',
    color: '#333',
    zIndex: 2, // Ensure text is above image if they overlap
  },
  listContainer: {
    padding: 20,
    marginBottom: 40,
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  list: {
    paddingVertical: 10,
    gap:10
  },
  row: {
    justifyContent: 'space-around',
    marginBottom: 10,
    gap:20
  },
  option: {
    // padding: 10, 
    borderRadius: 8,
    width: '45%', // Increased from 26%
    height: 55, // Uncommented to maintain square shape
    alignItems: 'center',
    justifyContent: 'center',
    // Kept commented or removed as per preference, user added it but usually for debug
  },
  pressedOption: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  selectedOption: {
    // transform: [{ scale: 1.1 }], // Removed scale up on select as requested (or to avoid conflict), using checkmark instead
  },
  standardImage: {
    width: '100%',
    height: '100%',
  },
  checkContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    display: 'none',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  button: {
    // backgroundColor: '#007AFF', // Removed background color
    // padding: 15, // Removed padding
    // borderRadius: 8, // Removed border radius
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.5, // Reduced opacity for disabled state instead of background color
    // backgroundColor: '#ccc',
  },
  buttonImage: {
    width: 200, // Adjust size as needed
    height: 60,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

