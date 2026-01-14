import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { openDB } from '../../database/db';
import { IMAGE_URL } from '../../service/api';
import { syncData } from '../../service/sync';

const { width } = Dimensions.get('window');

export default function SubjectSelectionScreen({ navigation, route }) {
  const [subjects, setSubjects] = useState([]);

  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 8;
  
  useFocusEffect(
    useCallback(() => {
      const runSync = async () => {
        try {
          // Run quietly in background
          console.log('Running background sync on home focus...');
          await syncData();
        } catch (e) {
          console.log('Background sync error:', e);
        }
      };
      runSync();
    }, [])
  );

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const db = await openDB();
        const result = await db.getAllAsync('SELECT * FROM subjects');
        setSubjects(result);
      } catch (e) {
        console.error("Failed to load subjects", e);
      }
    };
    loadSubjects();
  }, []);

  const totalPages = Math.ceil(subjects.length / ITEMS_PER_PAGE);
  const displayedSubjects = subjects.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSubjectSelect = (subject) => {
    // Navigate to SkillsTopicScreen or wherever appropriate
    navigation.navigate('SkillsTopic', {
      subjectId: subject.id,
      subjectName: subject.name,
    });
  };

  const renderSubjectItem = ({ item, index }) => {
    // Check if this is the last item in an odd-numbered list on the current page
    const isLastItem = index === displayedSubjects.length - 1;
    const isOddCount = displayedSubjects.length % 2 !== 0;
    const isLastOddItem = isLastItem && isOddCount;

    return (
      <TouchableOpacity 
        style={[
          styles.subjectItem,
          isLastOddItem && styles.lastSubjectItem // Apply special style for the centered last item
        ]}
        onPress={() => handleSubjectSelect(item)}
      >
        <Image 
          source={{ uri: item.image_url ? `${IMAGE_URL}${item.image_url}` : null }} 
          style={styles.subjectImage}
          resizeMode="contain"
        />
        <Text style={styles.subjectText}>{item.name}</Text>
      </TouchableOpacity>
    );
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

        <Image 
          source={require('../../assets/screens/subject/subjects_banner.png')}
          style={styles.banner}
          resizeMode="contain"
        />
        <ImageBackground
          source={require('../../assets/screens/subject/subject_main_panel.png')}
          style={styles.panel}
          resizeMode="stretch"
        >
          <FlatList
            data={displayedSubjects}
            renderItem={renderSubjectItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.flatListContainer}
            columnWrapperStyle={styles.columnWrapper}
            scrollEnabled={false} // Disable scrolling since we use pagination
            ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No subjects found. Sync required?</Text>}
          />
          
          <View style={styles.paginationContainer}>
            <TouchableOpacity 
              onPress={handlePrevPage} 
              style={[styles.pageButton, { opacity: currentPage > 0 ? 1 : 0.5 }]} // Changed opacity logic
              disabled={currentPage === 0}
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
              <Text style={styles.pageIndicatorText}>{currentPage + 1} / {totalPages || 1}</Text>
            </ImageBackground>
            
            <TouchableOpacity 
              onPress={handleNextPage} 
              style={[styles.pageButton, { opacity: currentPage < totalPages - 1 ? 1 : 0.5 }]} // Changed opacity logic
              disabled={currentPage === totalPages - 1}
            >
              <Image 
                source={require('../../assets/screens/subject/right_arrow.png')} 
                style={styles.arrowIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  settingsIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 20,
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    marginBottom: 40,
  },
  shadowIcon: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  banner: {
    width: '90%',
    height: 130,
    zIndex: 1,
  },
  panel: {
    width: "100%",
    height: 500,
    aspectRatio: 1.07,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    // backgroundColor: 'green', // Removed for clean look
  },
  flatListContainer: {
    marginTop: -30,
    paddingHorizontal: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-around',
    width: '77%',
    marginBottom: 6, // Space between rows
    gap: 10,
  },
  subjectItem: {
    width: width * 0.30, // Adjust width for 2 columns
    height: width * 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastSubjectItem: {
    width: width * 0.45, // Bigger width for the centered item
    height: width * 0.225, // Bigger height
    // Margin adjustments if needed to center perfectly, though space-around should handle it
  },
  subjectImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
     display: 'none',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: 20,
    gap: 0,
    position: 'absolute',
    bottom: 40,
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
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
});
