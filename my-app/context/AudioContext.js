import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Audio } from 'expo-av';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  // Use refs to track sound objects so cleanup functions can access them reliably
  // without stale closures issues.
  const bgSoundRef = useRef(null);
  const clickSoundRef = useRef(null);
  const btnPressSoundRef = useRef(null);
  
  const [isMuted, setIsMuted] = useState(false);

  // --- 1. Load Background Music ---
  useEffect(() => {
    async function loadBgMusic() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        console.log('Loading Background Music');
        const { sound } = await Audio.Sound.createAsync(
           require('../assets/sound/all-fall-down.mp3'),
           { isLooping: true, shouldPlay: true, volume: 0.1 }
        );
        bgSoundRef.current = sound;
        
        // Apply initial mute state
        if (isMuted) {
          await sound.setIsMutedAsync(true);
        }
      } catch (error) {
        console.log('Error loading background sound:', error);
      }
    }

    loadBgMusic();

    // SAFE CLEANUP
    return () => {
      if (bgSoundRef.current) {
        // We use catch here to swallow errors if the player is already released natively
        bgSoundRef.current.unloadAsync().catch(err => {
           console.log('Error unloading bg sound:', err); 
        });
        bgSoundRef.current = null;
      }
    };
  }, []); // Run once on mount

  // --- 2. Load Click Sound ---
  useEffect(() => {
    async function loadClickSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sound/ui-sound-click.mp3')
        );
        clickSoundRef.current = sound;
      } catch (error) {
        console.log('Error loading click sound:', error);
      }
    }
    loadClickSound();

    async function loadBtnPressSound() {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sound/ui-sounds-login-register-btn-press.mp3')
          );
          btnPressSoundRef.current = sound;
        } catch (error) {
          console.log('Error loading btn press sound:', error);
        }
    }
    loadBtnPressSound();

    // SAFE CLEANUP
    return () => {
      if (clickSoundRef.current) {
        clickSoundRef.current.unloadAsync().catch(err => {});
        clickSoundRef.current = null;
      }
      if (btnPressSoundRef.current) {
        btnPressSoundRef.current.unloadAsync().catch(err => {});
        btnPressSoundRef.current = null;
      }
    };
  }, []);

  // --- 3. Handle Mute Toggling ---
  useEffect(() => {
    // Only mute the background music
    if (bgSoundRef.current) {
      bgSoundRef.current.setIsMutedAsync(isMuted).catch(err => {});
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const playClickSound = async () => {
    if (clickSoundRef.current) {
      try {
        await clickSoundRef.current.setPositionAsync(0);
        await clickSoundRef.current.playAsync();
      } catch (error) {
        console.log('Error playing click sound:', error);
      }
    }
  };

  const playButtonPressSound = async () => {
    if (btnPressSoundRef.current) {
        try {
            await btnPressSoundRef.current.replayAsync();
        } catch (error) {
            console.log('Error playing btn press sound:', error);
        }
    } else {
        // Fallback if not loaded yet
        try {
             const { sound } = await Audio.Sound.createAsync(
                 require('../assets/sound/ui-sounds-login-register-btn-press.mp3'),
                 { shouldPlay: true }
             );
             sound.setOnPlaybackStatusUpdate(async (status) => {
                 if (status.didJustFinish) {
                     await sound.unloadAsync();
                 }
             });
        } catch (e) { console.log(e); }
    }
  };

  const pauseBackgroundMusic = async () => {
    if (bgSoundRef.current) {
      try {
        await bgSoundRef.current.pauseAsync();
      } catch (e) { console.log('Error pausing bg music', e); }
    }
  };

  const resumeBackgroundMusic = async () => {
    if (bgSoundRef.current && !isMuted) {
      try {
        await bgSoundRef.current.playAsync();
      } catch (e) { console.log('Error resuming bg music', e); }
    }
  };

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, playClickSound, playButtonPressSound, pauseBackgroundMusic, resumeBackgroundMusic }}>
      {children}
    </AudioContext.Provider>
  );
};
