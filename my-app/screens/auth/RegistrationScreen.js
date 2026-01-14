import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
const registerMainPanel = require("../../assets/screens/auth/registration/register_main_panel.png");
const registerBtn = require("../../assets/screens/auth/registration/register_btn.png");
const phoneIcon = require("../../assets/screens/auth/phone_icon.png");
const nameIcon = require("../../assets/screens/auth/registration/name_icon.png");
const passwordIcon = require("../../assets/screens/auth/lock_icon.png");
const registrationBanner = require("../../assets/screens/auth/registration/registration_banner.png");

import { Audio } from 'expo-av';

export default function RegistrationScreen({ navigation }) {
  const [name, setName] = useState("");
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

  const handleRegister = async () => {
    playButtonSound();
    if (!name || !phoneNumber || !password) {
      showError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // Assuming api.js authAPI.register needs to be updated to accept password
      // or we pass it here if already updated.
      // Based on previous turn, api.js might not support password in register yet.
      // We'll update the call here first.
      const response = await authAPI.register(name, phoneNumber, password);

      console.log("Registration Response:", response.data);

      const token = response.data.token || response.data.access_token;
      const user = response.data.user;

      if (token) {
        // Clear any previous session data to avoid pollution
        await AsyncStorage.multiRemove(['userToken', 'userId', 'userStandard', 'userData']);

        await AsyncStorage.setItem("userToken", token);
        if (user) {
          await AsyncStorage.setItem('userId', String(user.id));
          await AsyncStorage.setItem('userData', JSON.stringify(user));
          
          if (user.standard_id) {
             await AsyncStorage.setItem('userStandard', String(user.standard_id));
          }
        }
        console.log("Token and user info stored successfully");
      }

      navigation.navigate("SelectClass", { name });
    } catch (error) {
      console.error("Registration Error:", error);

      let displayMessage = "Registration failed. Please try again.";

      if (error.response) {
        // Check for 'message' field (Standard Laravel error response)
        if (error.response.data?.message) {
           displayMessage = error.response.data.message;
        } 
        
        // If there are validation errors, they often come in 'errors' object
        // e.g. { errors: { phone_number: ["The phone number has already been taken."] } }
        if (error.response.data?.errors) {
            const errorData = error.response.data.errors;
            const errorMessages = Object.values(errorData).flat();
            if (errorMessages.length > 0) {
                // Join multiple errors with a newline or just show the first one
                displayMessage = errorMessages[0]; 
            }
        }
      } else if (error.message) {
        displayMessage = error.message;
      }
      
      showError(displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground source={bg} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Image
            source={registrationBanner}
            style={styles.banner}
            resizeMode="contain"
          />
          <View style={styles.boardContainer}>
            <Image
              source={registerMainPanel}
              style={styles.boardLayer}
              resizeMode="contain"
            />
            
            <View style={styles.formContainer}>
              <View style={styles.nameInputWrapper}>
                <View style={styles.labelContainer}>
                  <Image source={nameIcon} style={styles.labelIcon} resizeMode="contain" />
                  <Text style={styles.labelText}>Username</Text>
                </View>
                <ImageBackground
                  source={nameInputBg}
                  style={styles.nameInputBg}
                  resizeMode="stretch"
                >
                  <View style={styles.inputContentContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter Username"
                      placeholderTextColor="#a58a6e"
                      value={name}
                      onChangeText={setName}
                      maxLength={20}
                    />
                  </View>
                </ImageBackground>
              </View>

              <View style={styles.phoneInputWrapper}>
                <View style={styles.labelContainer}>
                  <Image source={passwordIcon} style={styles.labelIcon} resizeMode="contain" />
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
                  <Image source={phoneIcon} style={styles.labelIcon} resizeMode="contain" />
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
                        size={24}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            style={styles.registerBtnContainer}
          >
            <Image
              source={registerBtn}
              style={styles.registerBtn}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.loginLinkContainer}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
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
    marginTop: -100, // Adjusted margin since banner takes space
  },
  banner: {
    width: "91%",
    height: 150, // Adjust height as needed
    marginBottom: -50, // Pull closer to the board
    zIndex: 3, // Ensure it's on top
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
  formContainer: {
    position: 'absolute',
    top: '25%', // Controls vertical position of the entire form group
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
    gap: 40, // Adds consistent spacing between input fields
  },
  nameInputWrapper: {
    width: '65%', 
    height: 35, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  phoneInputWrapper: {
    width: '65%', 
    height: 35, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  passwordInputWrapper: {
    width: '65%', 
    height: 35, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginLeft: 0, // Adjust alignment
  },
  labelIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  labelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#68371c', // Brownish color for label
  },
  nameInputBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  inputContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    paddingRight: 15, 
  },
  countryCode: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    marginRight: 10,
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
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    height: '100%',
    paddingLeft: 0,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  registerBtnContainer: {
    position: "absolute",
    bottom: 230, // Adjust to position below the board
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: 180, 
    height: 80,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginLinkContainer: {
    position: "absolute",
    bottom: 225, // Positioned below register button
    zIndex: 2,
  },
  loginLinkText: {
    color: "#764323",
    fontSize: 14,
    textAlign: "center",
    textShadowRadius: 10
  },
  loginLinkBold: {
    fontWeight: "bold",
    color: "#3a666e", 
  },
  registerBtn: {
    width: '100%', 
    height: '100%', 
  },
  boyCharacter: {
    position: 'absolute',
    bottom: 170,
    right: -20,
    width: 150, // Adjust size as needed
    height: 180, // Adjust size as needed
    zIndex: 2,
  },
  boardFoxCharacter: {
    position: 'absolute',
    bottom: 170,
    left: 0, // Position on the left side
    width: 280, // Adjust size relative to boy character
    height: 180, // Adjust size relative to boy character
    zIndex: 1, // Ensure layering is correct relative to boy if they overlap
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    color: "#333",
  },
  inputContainer: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 15,

  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  // New styles for Image Background Input
  imageInputWrapper: {
    width: "100%",
    height: 90, // Adjust based on your image aspect ratio
    justifyContent: "center",
    paddingLeft: 50,
  },
  inputImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  imageInput: {
    paddingHorizontal: 15,
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    height: "100%",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#a0c4ff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  linkText: {
    marginTop: 20,
    textAlign: "center",
    color: "#007AFF",
    fontSize: 16,
  },
});
