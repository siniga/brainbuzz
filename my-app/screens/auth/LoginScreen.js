import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from "../../service/api";
import { useError } from "../../context/ErrorContext";

const bg = require("../../assets/screens/main_bg.png");
const nameInputBg = require("../../assets/screens/auth/name_input.png");
const registerMainPanel = require("../../assets/screens/auth/login/login_main_panel.png");
const loginBtn = require("../../assets/screens/auth/login/login_btn.png");
const phoneIcon = require("../../assets/screens/auth/phone_icon.png");
const passwordIcon = require("../../assets/screens/auth/lock_icon.png");
const loginBanner = require("../../assets/screens/auth/login/login_banner.png");

import { Audio } from 'expo-av';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { showError } = useError();

  const playButtonSound = async () => {
    try {
        const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sound/ui-sounds-login-register-btn-press.mp3'),
            { shouldPlay: true, volume: 1.0 }
        );
        sound.setOnPlaybackStatusUpdate(async (status) => {
            if (status.didJustFinish) {
                await sound.unloadAsync();
            }
        });
    } catch (e) { console.log("Button sound error", e); }
  };

  const handleLogin = async () => {
    playButtonSound();
    if (!phoneNumber || !password) {
      showError("Please enter phone number and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.login(phoneNumber, password);
      
      console.log('Login Response:', response.data);

      const token = response.data.token || response.data.access_token;
      const user = response.data.user;
      const userName = user ? user.name : "Friend";

      if (token) {
        await AsyncStorage.multiRemove(['userToken', 'userId', 'userStandard', 'userData', 'last_synced_at']);

        await AsyncStorage.setItem('userToken', token);
        if (user) {
            await AsyncStorage.setItem('userId', String(user.id));
            if (user.standard_id) {
              await AsyncStorage.setItem('userStandard', String(user.standard_id));
            }
            await AsyncStorage.setItem('userData', JSON.stringify(user));
        }
        console.log('Token and user info stored successfully. Navigating to sync...');

        navigation.navigate('Welcome', { name: userName, autoSync: true });

      } else {
        showError("Login failed: No token received");
      }

    } catch (error) {
      console.error("Login Error:", error);
      
      if (error.response) {
        // If the backend sends a specific message, show it.
        // Otherwise handle common status codes.
        const serverMessage = error.response.data?.message;
        
        if (serverMessage) {
          showError(serverMessage);
        } else if (error.response.status === 401) {
          showError("Incorrect phone number or password.");
        } else {
          showError("Something went wrong. Please try again.");
        }
      } else {
        showError("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground source={bg} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Image
            source={loginBanner}
            style={styles.banner}
            resizeMode="contain"
          />
          <View style={styles.boardContainer}>
            <Image
              source={registerMainPanel}
              style={styles.boardLayer}
              resizeMode="contain"
            />
            
            <View style={styles.phoneInputWrapper}>
              <View style={styles.labelContainer}>
                <Image source={phoneIcon} style={styles.labelIcon} resizeMode="contain" />
                <Text style={styles.labelText}>Phone Number</Text>
              </View>
              <ImageBackground
                source={nameInputBg}
                style={styles.nameInputBg}
                resizeMode="stretch"
              >
                <View style={styles.phoneContainer}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter Phone Number"
                    placeholderTextColor="#999"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </ImageBackground>
            </View>

            <View style={styles.passwordInputWrapper}>
              <View style={styles.labelContainer}>
                <Image source={passwordIcon} style={styles.labelIcon} resizeMode="contain" /> 
                <Text style={styles.labelText}>Password</Text>
              </View>
              <ImageBackground
                source={nameInputBg}
                style={styles.nameInputBg}
                resizeMode="stretch"
              >
                <View style={styles.phoneContainer}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={isPasswordVisible ? "eye-off" : "eye"}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.loginBtnContainer, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#68371c" size="large" />
            ) : (
              <Image
                source={loginBtn}
                style={styles.loginBtn}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Registration")}
            style={styles.registerLinkContainer}
          >
            <Text style={styles.registerLinkText}>
              Don't have an account? <Text style={styles.registerLinkBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
        
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -100, 
  },
  banner: {
    width: "91%",
    height: 150, 
    marginBottom: -50, 
    zIndex: 3, 
  },
  boardContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  boardLayer: {
    width: "100%",
    height: 500,
    aspectRatio: 1,
    zIndex: 1,
  },
  phoneInputWrapper: {
    position: 'absolute',
    top: '25%', 
    width: '65%', 
    height: 35, 
    zIndex: 2, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  passwordInputWrapper: {
    position: 'absolute',
    top: '40%', 
    width: '65%', 
    height: 35, 
    zIndex: 2, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginLeft: 0, 
  },
  labelIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  labelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#68371c', 
  },
  nameInputBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    paddingRight: 5, 
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  eyeIcon: {
    padding: 5,
    marginRight: 15,
  },
  loginBtnContainer: {
    position: "absolute",
    bottom: "34%", 
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: 180, 
    height: 80,
  },
  loginBtn: {
    width: '100%', 
    height: '100%', 
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerLinkContainer: {
    position: "absolute",
    bottom: "33%", 
    zIndex: 2,
  },
  registerLinkText: {
    color: "#764323",
    fontSize: 14,
    textAlign: "center",
    textShadowRadius: 10
  },
  registerLinkBold: {
    fontWeight: "bold",
    color: "#3a666e", 
  },
});
