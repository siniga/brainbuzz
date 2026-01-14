import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, ImageBackground, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { authAPI, IMAGE_URL } from '../../service/api';
import { useAudio } from '../../context/AudioContext';
import { upsertSubjects, upsertUserSubjects } from '../../database/db';
import { downloadSubjectImages } from '../../service/downloadService';
import main_bg from '../../assets/screens/main_bg.png';
import top_layer from '../../assets/screens/levels/top_layer.png'; 
import next_btn from '../../assets/screens/levels/next.png';

export default function SelectSubjectScreen({ navigation, route }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { playButtonPressSound } = useAudio();

  // Params passed from SelectClass
  const { name } = route.params || {};

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await authAPI.getSubjects();
      // Adjust depending on API structure
      const data = response.data.data || response.data; 
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      Alert.alert('Error', 'Failed to load subjects. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleNext = async () => {
    playButtonPressSound();
    if (selectedIds.size < 8) {
      Alert.alert('Selection Required', 'Please select at least 8 subjects.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Get UserId (or use default)
      const userId = await AsyncStorage.getItem('userId') || 'user_default';

      // 2. Save Subjects to DB (so foreign keys work)
      await upsertSubjects(subjects);

      // 3. Save User Selection
      await upsertUserSubjects(userId, Array.from(selectedIds));

      // 4. Trigger Download (Background)
      downloadSubjectImages(userId).catch(e => console.log("Background download failed:", e));

      // 5. Navigate
      navigation.navigate('Gender', { name });
      
    } catch (error) {
      console.error('Error saving subjects:', error);
      Alert.alert('Error', 'Failed to save selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.has(item.id);
    const imageUrl = item.image_url ? `${IMAGE_URL}${item.image_url}` : null;

    return (
      <Pressable 
        style={({ pressed }) => [
          styles.option, 
          isSelected && styles.selectedOption,
          pressed && styles.pressedOption
        ]} 
        onPress={() => toggleSelection(item.id)}
        disabled={isLoading}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.subjectImage} resizeMode="contain" />
        ) : (
          // Fallback icon or empty view
          <View style={[styles.subjectImage, { backgroundColor: '#eee', borderRadius: 10 }]} />
        )}
        
        <Text style={styles.subjectLabel}>{item.name}</Text>

        {isSelected && (
          <View style={styles.checkContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        )}
      </Pressable>
    );
  };

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
        {/* <Image source={top_layer} style={styles.topImage} resizeMode="contain" /> */}
        
        <Text style={styles.title}>Select Subjects</Text>

        <View style={styles.listContainer}>
          <FlatList
            data={subjects}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            numColumns={2}
            columnWrapperStyle={styles.row}
            ListEmptyComponent={<Text style={styles.emptyText}>No subjects available.</Text>}
          />
           <TouchableOpacity 
            style={[styles.button, isLoading && styles.disabledButton]} 
            onPress={handleNext}
            disabled={isLoading}
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
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topImage: {
    width: '100%',
    height: 300, 
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    zIndex: 1,
  },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 90, 
    textAlign: 'center',
    color: '#333',
    zIndex: 2,
    marginBottom: 10,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  list: { paddingVertical: 10, gap: 10 },
  row: { justifyContent: 'space-around', marginBottom: 15, gap: 10 },
  option: {
    borderRadius: 12,
    width: '45%', 
    height: 140, 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)', 
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  pressedOption: { transform: [{ scale: 0.95 }], opacity: 0.8 },
  subjectImage: {
    width: '80%',
    height: '60%',
    marginBottom: 10,
  },
  subjectLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  checkContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 16, marginTop: 20 },
  button: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  disabledButton: { opacity: 0.5 },
  buttonImage: { width: 200, height: 60 },
});