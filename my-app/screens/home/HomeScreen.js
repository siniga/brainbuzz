import React from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudio } from "../../context/AudioContext";
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

const topLayer = require("../../assets/screens/home/top_layer.png");
const welcomeBannerTemp = require("../../assets/screens/home/welcome_banner.png");
const loginBtnTemp = require("../../assets/screens/home/login_btn.png");
const registerBtnTemp = require("../../assets/screens/home/register_btn.png");

// Simple Image Button Component
const ImageButton = ({ onPress, source, style, width, height }) => (
  <TouchableOpacity onPress={onPress} style={style}>
    <Image 
      source={source} 
      style={{ width, height, resizeMode: 'contain' }} 
    />
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const { playClickSound } = useAudio();

  const handleLoginPress = () => {
    playClickSound();
    navigation.navigate("Login");
  };

  const handleRegisterPress = () => {
    playClickSound();
    navigation.navigate("Registration");
  };

  return (
    <ImageBackground
      source={require("../../assets/screens/main_bg.png")}
      style={[styles.container]}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topLayerContainer}>
          <TouchableOpacity 
            style={styles.settingsIcon} 
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-sharp" size={32} color="#FFF" style={styles.shadowIcon}/>
          </TouchableOpacity>

          <View style={styles.bannerContainer}>
            <Image
              source={welcomeBannerTemp}
              style={styles.welcomeBannerTemp}
              resizeMode="contain"
            />
          </View>

          <Image
            source={topLayer}
            style={styles.topLayer}
            resizeMode="contain"
          />

          <View style={styles.authButtonsContainer}>
            <ImageButton
              onPress={handleLoginPress}
              source={loginBtnTemp}
              style={styles.authButton}
              width={width * 0.3}
              height={width * 0.42}
            />
            <ImageButton
              onPress={handleRegisterPress}
              source={registerBtnTemp}
              style={styles.authButton}
              width={width * 0.3}
              height={width * 0.42}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("DatabaseDebug")}
          style={{
            marginTop: 20,
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
            🛠 DEBUG DATABASE
          </Text>
        </TouchableOpacity>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between", // Distribute space between top logo and bottom buttons
  },
  topLayerContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    // display: 'none'
  },
  settingsIcon: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 20,
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  shadowIcon: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  topLayer: {
    width: width * 6, // Adjust width as needed
    height: 600, // Adjust height as needed
  },
  bannerContainer: {
    position: "absolute",
    top: 0,
    alignItems: "center",
    width: "100%",
  },
  welcomeBannerTemp: {
    width: width * 1.3,
    height: 270,
    zIndex: 2,
  },
  authButtonsContainer: {
    position: "absolute",
    bottom: 148,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    width: "100%",
    paddingHorizontal: 20,
    zIndex: 10, // Ensure buttons are on top of everything
  },
  authButton: {
    // Add any specific styles for the buttons if needed
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 0,
    position: "absolute",
    flex: 1,
  },
  welcomeBanner: {
    width: width * 9,
    height: 250, // Adjust height as needed
  },
  characterContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    position: "absolute",
    top: 150, // Move up
    right: -20, // Move right
    zIndex: 2,
  },
  boyFoxCharacter: {
    width: width * 0.4,
    height: height * 0.4,
  },
  boardContainer: {
    position: "absolute",
    top: 200,
    left: -20,
    zIndex: 1,
  },
  board: {
    width: width * 0.3,
    height: height * 0.3,
  },
  villageLayerContainer: {
    position: "absolute",
    top: 150,
    width: "100%",
    zIndex: 0,
    alignItems: "center",
  },
  villageLayer: {
    width: width * 2,
    height: 180,
  },
  authBtnsContainer: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  authBtns: {
    width: width * 1.1,
    height: 300, // Adjust as needed
  },
  buttonsOverlay: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    left: 15, // Adjust width to control spacing
    bottom: 112, // Adjust vertical position relative to container
  },
  overlayButton: {
    // Add styles if needed
  },
  actionBtn: {
    width: 180, // Adjust button size
    height: 170, // Adjust button size
  },
  logo: {
    width: width * 1.5,
    height: height * 0.65,
  },
  letsPlayText: {
    width: width * 0.8,
    height: height * 0.4, // Increased size for the 'Welcome' sign feel
    resizeMode: "contain",
  },
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginBottom: 155, // Increased from 50 to 150 to move buttons up 100px
  },
  horizontalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 50,
    width: "100%",
    paddingHorizontal: 20,
  },
  button: {
    marginBottom: -5,
  },
});
