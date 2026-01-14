import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ImageBackground, Image, Dimensions, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { getSkillsByStandard } from '../../database/db';
import { LinearGradient } from 'expo-linear-gradient';
import { getLocalImageUri } from '../../service/downloadService';

const skillsMainBanner = require('../../assets/screens/skills/skills_main_banner.png');
const sessionMainBanner = require('../../assets/screens/skills/session_main_banner.png');
const skillsMainPanel = require('../../assets/screens/skills/skills_main_pannel.png');

const { width, height } = Dimensions.get('window');

const ITEM_COLORS = [
  { gradient: ['#4FC3F7', '#0288D1'], border: '#01579B', iconBox: '#0277BD' }, // Blue
  { gradient: ['#FFB74D', '#F57C00'], border: '#E65100', iconBox: '#EF6C00' }, // Orange
  { gradient: ['#81C784', '#388E3C'], border: '#1B5E20', iconBox: '#2E7D32' }, // Green
  { gradient: ['#BA68C8', '#7B1FA2'], border: '#4A148C', iconBox: '#6A1B9A' }, // Purple
  { gradient: ['#4DD0E1', '#0097A7'], border: '#006064', iconBox: '#00838F' }, // Cyan
  { gradient: ['#FF80AB', '#D81B60'], border: '#880E4F', iconBox: '#C2185B' }, // Pink
];

const getColorPalette = (index) => {
  return ITEM_COLORS[index % ITEM_COLORS.length];
};

const SessionSelectionModal = ({ visible, skill, onClose, onSelectSession }) => {
  if (!skill) return null;

  const totalSessions = skill.total_sessions || 10;
  const sessions = Array.from({ length: totalSessions }, (_, i) => i + 1);

  return (
    <Modal transparent={false} visible={visible} animationType="slide" onRequestClose={onClose}>
      <ImageBackground
        source={require('../../assets/screens/main_bg.png')}
        style={modalStyles.fullscreenBg}
        resizeMode="cover"
      >
         <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
            <Ionicons name="close-circle" size={40} color="#cc0000" />
         </TouchableOpacity>

         <Image source={skillsMainBanner} style={styles.topImage} resizeMode="contain" />

        <SafeAreaView style={modalStyles.safeArea}>
          <ImageBackground
            source={require('../../assets/screens/skills/skills_main_pannel.png')}
            style={modalStyles.panel}
            resizeMode="stretch"
          >
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>{skill.name}</Text>
             
            </View>

            <View style={modalStyles.sessionsList}>
                {sessions.map((num) => {
                  const isCompleted = num <= skill.sessions_passed;
                  const isUnlocked = num <= skill.last_unlocked_session;
                  const isLocked = !isUnlocked;

                  return (
                    <TouchableOpacity
                      key={num}
                      disabled={isLocked}
                      onPress={() => onSelectSession(num)}
                      style={[
                        modalStyles.sessionItem,
                        isCompleted && modalStyles.sessionCompleted,
                        isLocked && modalStyles.sessionLocked
                      ]}
                    >
                      <LinearGradient
                        colors={
                          isCompleted 
                            ? ['#81C784', '#388E3C'] 
                            : isLocked 
                              ? ['#BDBDBD', '#757575'] 
                              : ['#FFB74D', '#F57C00']
                        }
                        style={modalStyles.sessionGradient}
                      >
                         <Text style={modalStyles.sessionText}>{num}</Text>
                         {isCompleted && (
                           <Ionicons name="star" size={14} color="#FFF176" style={modalStyles.starIcon} />
                         )}
                         {isLocked && (
                           <Ionicons name="lock-closed" size={14} color="white" style={modalStyles.lockIcon} />
                         )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
            </View>

            <Text style={modalStyles.footerText}>
               Pick a session to start!
            </Text>
          </ImageBackground>
        </SafeAreaView>
      </ImageBackground>
    </Modal>
  );
};

export default function SkillsTopicScreen({ navigation, route }) {
  const { subjectId, subjectName, level } = route.params || {};
  const [skills, setSkills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadSkills = async () => {
      if (!subjectId) return;

      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedStandard = await AsyncStorage.getItem('userStandard');
        
        // Fallback or use passed level if provided (though userStandard is better)
        // If route.params.level is passed, it might override user standard? 
        // Let's assume userStandard from storage is the source of truth for "My Skills"
        // But if this screen is reused for browsing other levels, we might keep level param.
        // For now, prioritize userStandard if level param is missing or equal.
        const standardStr = storedStandard ? String(storedStandard) : (level ? String(level) : '1');
        const userId = storedUserId || 'user_default';

        console.log(`Loading skills for Subject: ${subjectId}, Standard: ${standardStr}, User: ${userId}`);

        const data = await getSkillsByStandard(subjectId, standardStr, userId);
        setSkills(data);
      } catch (e) {
        console.error('Failed to load skills', e);
      }
    };
    loadSkills();
  }, [subjectId, level]);

  const handleSkillPress = (skill) => {
    setSelectedSkill(skill);
    setIsModalVisible(true);
  };

  const handleSelectSession = (sessionNumber) => {
    setIsModalVisible(false);
    navigation.navigate('ReadyToQuiz', {
      skillId: selectedSkill.id,
      skillName: selectedSkill.name,
      subjectId,
      subjectName,
      level,
      sessionNumber,
    });
  };

  const totalPages = Math.ceil(skills.length / itemsPerPage);
  const currentSkills = skills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/screens/main_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity 
          style={styles.settingsIcon} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-sharp" size={32} color="#FFF" style={styles.shadowIcon}/>
        </TouchableOpacity>

        <Image source={sessionMainBanner} style={styles.topImage} resizeMode="contain" />

        <ImageBackground source={skillsMainPanel} style={styles.panel} resizeMode="stretch">
          <Text style={styles.title}>
            {subjectName} - Level {level}
          </Text>

          {/* IMPORTANT: list takes remaining space, pagination is pinned to the bottom */}
          <View style={styles.listContainer}>
            <ScrollView
              contentContainerStyle={{
                alignItems: 'center',
                width: '100%',
              }}
            >
              {currentSkills.length === 0 ? (
                <Text style={styles.emptyText}>No skills found for this level.</Text>
              ) : (
                currentSkills.map((skill, index) => {
                  const palette = getColorPalette(index + (currentPage - 1) * itemsPerPage);
                  return (
                    <TouchableOpacity
                      key={skill.id}
                      style={[styles.skillItem, { borderColor: palette.border }]}
                      onPress={() => handleSkillPress(skill)}
                    >
                      <LinearGradient
                        colors={palette.gradient}
                        style={styles.skillGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                      >
                        <View style={[styles.numberBox, { backgroundColor: palette.iconBox, borderColor: 'rgba(255,255,255,0.3)' }]}>
                          <Text style={styles.numberText}>
                            {index + 1 + (currentPage - 1) * itemsPerPage}
                          </Text>
                        </View>

                        <View style={styles.skillContent}>
                          <Text style={styles.skillText} numberOfLines={1}>
                            {skill.name}
                          </Text>
                          
                          {/* Progress Bar */}
                          <View style={styles.progressContainer}>
                             <Text style={styles.progressText}>
                                {skill.is_completed ? "Mastered!" : `Session ${skill.last_unlocked_session} of ${skill.total_sessions || 10}`}
                             </Text>
                             <View style={styles.progressBarBg}>
                                <View 
                                  style={[
                                    styles.progressBarFill, 
                                    { width: `${((skill.is_completed ? (skill.total_sessions || 10) : skill.last_unlocked_session) / (skill.total_sessions || 10)) * 100}%` }
                                  ]} 
                                />
                             </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>

          {skills.length > 0 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                onPress={handlePrevPage}
                style={[styles.pageButton, { opacity: currentPage > 1 ? 1 : 0.5 }]}
                disabled={currentPage === 1}
              >
                <Image
                  source={require('../../assets/screens/subject/left_arrow.png')}
                  style={styles.arrowIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <ImageBackground
                source={require('../../assets/screens/subject/count_wrapper.png')}
                style={styles.pageIndicatorContainer}
                resizeMode="contain"
              >
                <Text style={styles.pageIndicatorText}>
                  {currentPage} / {totalPages || 1}
                </Text>
              </ImageBackground>

              <TouchableOpacity
                onPress={handleNextPage}
                style={[styles.pageButton, { opacity: currentPage < totalPages ? 1 : 0.5 }]}
                disabled={currentPage === totalPages}
              >
                <Image
                  source={require('../../assets/screens/subject/right_arrow.png')}
                  style={styles.arrowIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          )}
        </ImageBackground>

        <SessionSelectionModal
          visible={isModalVisible}
          skill={selectedSkill}
          onClose={() => setIsModalVisible(false)}
          onSelectSession={handleSelectSession}
        />
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
    alignItems: 'center',
  },
  settingsIcon: {
    position: 'absolute',
    bottom: 70,
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
  topImage: {
    width: '95%',
    height: 300,
    alignSelf: 'center',
    zIndex: 1,
    position: 'absolute',
    top: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: -30,
    marginBottom: 20,
    textShadowColor: 'rgba(255,255,255,0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    zIndex: 2,
    textAlign: 'center',
  },
  panel: {
    width: '100%',
    height: 500,
    marginTop: 190,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    aspectRatio: 1.07,
  },

  listContainer: {
    width: '58%',
    height: '80%',
    marginTop: 15,
    position: 'relative',
  },

  /* Updated to list layout to match the reference image */
  skillItem: {
    width: '90%', // Changed from 47% to match list view in image
    height: 55,   // Slightly taller for better touch target and visual
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 3, // Thicker border like the cartoonish buttons
    // borderColor is now dynamic
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden', // Ensure gradient respects rounded corners
  },
  skillGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  numberBox: {
    width: 45,
    height: 45,
    borderRadius: 8,
    borderWidth: 2,
    // backgroundColor and borderColor are now dynamic or semi-transparent
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    marginLeft: 5,
  },
  numberText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  skillContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  skillText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  progressContainer: {
    width: '100%',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  progressBarBg: {
    width: '90%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFEB3B', // Yellow/Gold fill
    borderRadius: 3,
  },

  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: 20,
    gap: 0,
    position: 'absolute',
    bottom: 25, // Adjusted slightly for this screen's layout
  },
  pageButton: {
    // padding removed as Image is used directly or wrapper can be simple
    padding: 5,
  },
  arrowIcon: {
    width: 44,
    height: 33,
  },
  pageIndicatorContainer: {
    width: 83,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageIndicatorText: {
    color: '#985a11',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  emptyText: {
    marginTop: 20,
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const modalStyles = StyleSheet.create({
  fullscreenBg: {
    flex: 1,
  },
  safeArea: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    width: '100%',
    height: 500,
    marginTop: 190,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    aspectRatio: 1,
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 50,
    top: 100,
    zIndex: 1
  },
  sessionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '50%',
    gap: 15,
    // paddingRight: 40,
  },
  sessionItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#E65100',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  sessionCompleted: {
    borderColor: '#2E7D32',
  },
  sessionLocked: {
    borderColor: '#757575',
    opacity: 0.8,
  },
  sessionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  starIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  lockIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  footerText: {
    marginTop: 'auto',
    marginBottom: 80,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#68371c',
  }
});
