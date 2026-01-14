import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                setUserData(JSON.parse(data));
            }
        } catch (e) {
            console.error('Failed to load user data', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../../assets/screens/main_bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>My Profile</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <LinearGradient colors={['#9C27B0', '#E91E63']} style={styles.avatarGradient}>
                                <Ionicons name="person" size={60} color="#FFF" />
                            </LinearGradient>
                        </View>
                        
                        <Text style={styles.userName}>{userData?.name || 'Guest User'}</Text>
                        <Text style={styles.userPhone}>{userData?.phone_number || 'No phone'}</Text>

                        <View style={styles.infoDivider} />

                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Age</Text>
                                <Text style={styles.infoValue}>{userData?.age || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Gender</Text>
                                <Text style={styles.infoValue}>{userData?.gender || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Class</Text>
                                <Text style={styles.infoValue}>{userData?.standard_name || userData?.standard_id || 'N/A'}</Text>
                            </View>
                        </View>
                        
                        <View style={[styles.infoDivider, { marginTop: 30 }]} />
                        
                        <View style={styles.detailsList}>
                             <View style={styles.detailRow}>
                                <Ionicons name="mail-outline" size={20} color="#666" />
                                <Text style={styles.detailText}>{userData?.email || 'No email provided'}</Text>
                             </View>
                             <View style={styles.detailRow}>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                                <Text style={styles.detailText}>Member since: {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}</Text>
                             </View>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => {}}
                    >
                        <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.editGradient}>
                            <Ionicons name="pencil" size={20} color="#FFF" />
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    backButton: {
        padding: 5,
        marginRight: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
        paddingBottom: 40,
    },
    profileCard: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 25,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        marginTop: 60,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginTop: -80,
        padding: 5,
        backgroundColor: '#FFF',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
    },
    avatarGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
    },
    userPhone: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    infoDivider: {
        width: '90%',
        height: 1,
        backgroundColor: '#DDD',
        marginVertical: 20,
    },
    infoGrid: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
    },
    infoItem: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#444',
    },
    detailsList: {
        width: '100%',
        paddingHorizontal: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    detailText: {
        fontSize: 16,
        color: '#555',
        marginLeft: 15,
    },
    editButton: {
        width: '100%',
        marginTop: 30,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    editGradient: {
        flexDirection: 'row',
        paddingVertical: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    }
});
