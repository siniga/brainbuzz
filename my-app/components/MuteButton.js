import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudio } from '../context/AudioContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MuteButton() {
  const { isMuted, toggleMute } = useAudio();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
      <TouchableOpacity onPress={toggleMute} style={styles.button}>
        <Ionicons 
            name={isMuted ? "volume-mute" : "volume-high"} 
            size={24} 
            color="#007AFF" 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 9999, // Ensure it sits on top of everything
    alignItems: 'flex-end',
  },
  button: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    // Add shadow for visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

