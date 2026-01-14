import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CustomErrorModal = ({ visible, message, onClose }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#FF5252', '#B71C1C']} // Gradient Red Border
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalContainer}
        >
            <View style={styles.modalInner}>
              {/* Red Exclamation Icon */}
              <View style={styles.iconContainer}>
                  <View style={styles.iconCircle}>
                     <Text style={styles.exclamationMark}>!</Text>
                  </View>
              </View>

              {/* Title */}
              <Text style={styles.modalTitle}>Login Error</Text>

              {/* Message */}
              <View style={styles.divider} />
              <Text style={styles.modalMessage}>{message}</Text>

              {/* OK Button */}
              <View style={styles.divider} />
              <TouchableOpacity style={styles.okButton} onPress={onClose}>
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 280,
    borderRadius: 20, 
    padding: 3, // Acts as border width
    
    // Shadows
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalInner: {
    backgroundColor: '#FFF8E7', // Cream background
    borderRadius: 17, // 20 - 3
    width: '100%',
    paddingTop: 45, 
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    top: -35, // Relative to modalInner, but visible due to default overflow
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#D32F2F', 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF', 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  exclamationMark: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D84315', 
    marginBottom: 5,
    marginTop: 5,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4E342E',
    textAlign: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  okButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 10,
    width: '80%',
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    borderBottomWidth: 3,
    borderBottomColor: '#B71C1C',
  },
  okButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 5
  }
});

export default CustomErrorModal;
