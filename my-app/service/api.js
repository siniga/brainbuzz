import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetRoot } from './navigationRef';

// NOTE: For Android Emulator use 'http://10.0.2.2:8000/api/'
// For Physical Device use your machine's LAN IP e.g. 'http://192.168.1.X:8000/api/'
// We use a conditional to select the right one for Android Emulator vs iOS Simulator/Web
const BASE_URL = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/api';
export const IMAGE_URL = 'https://mediumvioletred-eel-443107.hostingersite.com/brainbuzz/public/';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // Increased from 10s to 30s for better reliability
});

// Request interceptor to add token if we have one
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Session expired, logging out...');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId'); // Added: clear userId for completeness
      resetRoot('Index'); // Navigate to Index (AuthScreen) which handles auth routing
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Sending a default password since we removed it from the UI but backend requires it
  login: (phoneNumber, password) => api.post('/login', { 
    phone_number: phoneNumber,
    password: password 
  }),
  register: (name, phoneNumber, password) => api.post('/register', { 
    name, 
    phone_number: phoneNumber,
    password: password || 'DEFAULT_PASSWORD_123' // Fallback if password not provided (though UI requires it now)
  }),
  updateStandard: (standardId) => api.post('/onboarding/standard', { standard_id: standardId }),
  getStandards: () => api.get('/standards'),
  getSubjects: () => api.get('/subjects'), // Add this missing function
  updateAge: (age) => api.post('/onboarding/age', { age }),
  updateGender: (gender) => api.post('/onboarding/gender', { gender }),
};

export default api;

