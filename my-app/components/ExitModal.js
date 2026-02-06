import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MODAL_BG = require('../assets/screens/quiz/powerup/powerup_bg.png');

const ExitModal = ({ visible, onClose, onGoHome, onGoSkills, onExitApp }) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <ImageBackground
                    source={MODAL_BG}
                    style={styles.modalBackground}
                    resizeMode="cover"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Ionicons name="help-circle" size={48} color="#FF6B35" />
                            <Text style={styles.title}>Where would you like to go?</Text>
                        </View>

                        <View style={styles.buttonsContainer}>
                            {/* Stay Here Button */}
                            <TouchableOpacity
                                style={styles.button}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#2196F3', '#1565C0']}
                                    style={styles.buttonGradient}
                                >
                                    <Ionicons name="close-circle" size={28} color="white" />
                                    <Text style={styles.buttonText}>Stay Here</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Go to Home (Subjects) */}
                            {onGoHome && (
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={onGoHome}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#4CAF50', '#2E7D32']}
                                        style={styles.buttonGradient}
                                    >
                                        <Ionicons name="home" size={28} color="white" />
                                        <Text style={styles.buttonText}>Go to Home</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {/* Go to Skills */}
                            {onGoSkills && (
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={onGoSkills}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#FF9800', '#EF6C00']}
                                        style={styles.buttonGradient}
                                    >
                                        <Ionicons name="list" size={28} color="white" />
                                        <Text style={styles.buttonText}>Go to Skills</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {/* Exit App */}
                            <TouchableOpacity
                                style={styles.button}
                                onPress={onExitApp}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#F44336', '#C62828']}
                                    style={styles.buttonGradient}
                                >
                                    <Ionicons name="exit" size={28} color="white" />
                                    <Text style={styles.buttonText}>Exit App</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalBackground: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    modalContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 25,
        padding: 25,
        margin: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 10,
    },
    buttonsContainer: {
        gap: 15,
    },
    button: {
        width: '100%',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default ExitModal;
