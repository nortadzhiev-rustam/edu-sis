import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config } from '../config/env';
import {
  faPlus,
  faChild,
  faArrowLeft,
  faTrash,
  faBook,
  faCalendarAlt,
  faChartLine,
  faClipboardCheck,
  faComments,
  faGavel,
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Platform import removed as it's not being used
export default function ParentScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const flatListRef = React.useRef(null);

  useEffect(() => {
    // Load saved student accounts
    loadStudents();

    // Add listener for when we come back from adding a student
    const unsubscribe = navigation.addListener('focus', () => {
      loadStudents();
    });

    return unsubscribe;
  }, [navigation]);

  const handleAddStudent = () => {
    // Navigate to login screen with student type
    navigation.navigate('Login', {
      loginType: 'student',
      isAddingStudent: true, // Flag to indicate we're adding a student account
    });
  };

  const handleStudentPress = (student) => {
    // Set the selected student
    setSelectedStudent(student);
  };

  const handleMenuItemPress = (action) => {
    if (!selectedStudent) {
      Alert.alert(
        'No Student Selected',
        'Please select a student first to view their information.'
      );
      return;
    }

    // Base URL for the API
    const baseUrl = Config.API_BASE_URL;

    // Check if student has an authCode
    if (!selectedStudent.authCode) {
      Alert.alert(
        'Authentication Error',
        'Unable to authenticate this student. Please contact support.'
      );
      return;
    }

    // Handle different menu actions
    switch (action) {
      case 'grades':
        navigation.navigate('GradesScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'attendance':
        navigation.navigate('AttendanceScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'assignments':
        navigation.navigate('AssignmentsScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'schedule':
        navigation.navigate('TimetableScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'discipline':
        navigation.navigate('BehaviorScreen', {
          studentName: selectedStudent.name,
          authCode: selectedStudent.authCode,
        });
        break;
      case 'messages':
        navigation.navigate('WebViewWithAuth', {
          baseUrl: baseUrl,
          endpoint: '/messages',
          title: 'Messages',
          authCode: selectedStudent.authCode,
        });
        break;
      default:
        break;
    }
  };

  // Extract loadStudents function to make it reusable
  const loadStudents = async () => {
    try {
      const savedStudents = await AsyncStorage.getItem('studentAccounts');
      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = (studentToDelete) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to remove ${
        studentToDelete.name || 'this student'
      }?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from state first for immediate UI update
              const updatedStudents = students.filter(
                (s) => s.id !== studentToDelete.id
              );
              setStudents(updatedStudents);

              // If the deleted student was selected, clear selection
              if (
                selectedStudent &&
                selectedStudent.id === studentToDelete.id
              ) {
                setSelectedStudent(null);
              }

              // Update AsyncStorage
              await AsyncStorage.setItem(
                'studentAccounts',
                JSON.stringify(updatedStudents)
              );

              // Show success message
              Alert.alert('Success', 'Student removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove student');

              // Reload the original list if there was an error
              loadStudents();
            }
          },
        },
      ]
    );
  };

  const renderStudentItem = ({ item }) => {
    const isSelected = selectedStudent && selectedStudent.id === item.id;

    return (
      <View style={styles.studentTileContainer}>
        <TouchableOpacity
          style={[styles.studentTile, isSelected && styles.selectedStudentTile]}
          onPress={() => handleStudentPress(item)}
        >
          {item.photo ? (
            <Image
              source={{ uri: item.photo }}
              style={[
                styles.studentPhoto,
                isSelected && styles.selectedStudentPhoto,
              ]}
              resizeMode='cover'
            />
          ) : (
            <View
              style={[
                styles.studentIconContainer,
                isSelected && styles.selectedStudentIcon,
              ]}
            >
              <FontAwesomeIcon icon={faChild} size={30} color='#fff' />
            </View>
          )}
          <Text
            style={[
              styles.studentName,
              isSelected && styles.selectedStudentText,
            ]}
          >
            {item.name || 'Student'}
          </Text>
          <Text style={styles.studentDetails}>ID: {item.id || 'N/A'}</Text>

          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>SELECTED</Text>
            </View>
          )}
        </TouchableOpacity>

        {isSelected && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteStudent(item)}
          >
            <FontAwesomeIcon icon={faTrash} size={16} color='#FF3B30' />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No student accounts added yet</Text>
        <Text style={styles.emptySubtext}>
          Tap the + button in the header to add your child's account
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parent Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
          <FontAwesomeIcon icon={faPlus} size={18} color='#fff' />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.childrenSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Children</Text>
            {students.length > 0 && (
              <TouchableOpacity
                style={styles.scrollIndicator}
                onPress={() => {
                  if (students.length > 1 && flatListRef.current) {
                    // Scroll to the next item
                    const currentIndex = selectedStudent
                      ? students.findIndex((s) => s.id === selectedStudent.id)
                      : 0;
                    const nextIndex = (currentIndex + 1) % students.length;
                    flatListRef.current.scrollToIndex({
                      index: nextIndex,
                      animated: true,
                    });
                  }
                }}
              >
                <Text style={styles.scrollIndicatorText}>
                  {students.length > 1 ? 'Scroll for more →' : 'Your child'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading student accounts...</Text>
            </View>
          ) : students.length === 0 ? (
            <EmptyListComponent />
          ) : (
            <FlatList
              ref={flatListRef}
              data={students}
              renderItem={renderStudentItem}
              keyExtractor={(_, index) => `student-${index}`}
              contentContainerStyle={styles.listContainer}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              snapToAlignment='start'
              decelerationRate='fast'
              snapToInterval={176} // Width of tile (160) + margin (16)
              onScrollToIndexFailed={(info) => {
                // Handle the failure by scrolling to a nearby item
                setTimeout(() => {
                  if (flatListRef.current && students.length > 0) {
                    flatListRef.current.scrollToIndex({
                      index: Math.min(
                        info.highestMeasuredFrameIndex,
                        students.length - 1
                      ),
                      animated: true,
                    });
                  }
                }, 100);
              }}
            />
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Menu</Text>

          <View style={styles.menuGrid}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('grades')}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: 'rgba(255, 149, 0, 0.1)' },
                ]}
              >
                <FontAwesomeIcon icon={faChartLine} size={24} color='#FF9500' />
              </View>
              <Text style={styles.menuItemText}>Grades</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('attendance')}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
                ]}
              >
                <FontAwesomeIcon
                  icon={faClipboardCheck}
                  size={24}
                  color='#34C759'
                />
              </View>
              <Text style={styles.menuItemText}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('assignments')}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: 'rgba(0, 122, 255, 0.1)' },
                ]}
              >
                <FontAwesomeIcon icon={faBook} size={24} color='#007AFF' />
              </View>
              <Text style={styles.menuItemText}>Assignments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('schedule')}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: 'rgba(175, 82, 222, 0.1)' },
                ]}
              >
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  size={24}
                  color='#AF52DE'
                />
              </View>
              <Text style={styles.menuItemText}>Timetable</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('discipline')}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: 'rgba(88, 86, 214, 0.1)' },
                ]}
              >
                <FontAwesomeIcon icon={faGavel} size={24} color='#5856D6' />
              </View>
              <Text style={styles.menuItemText}>Behavior</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.disabledMenuItem]}
              disabled={true}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: 'rgba(90, 200, 250, 0.05)' },
                ]}
              >
                <FontAwesomeIcon icon={faComments} size={24} color='#B0B0B0' />
              </View>
              <Text style={[styles.menuItemText, styles.disabledMenuText]}>
                Messages
              </Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // No longer needed with FontAwesome icon
  content: {
    flex: 1,
    padding: 20,
  },
  childrenSection: {
    marginBottom: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scrollIndicator: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  scrollIndicatorText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  menuSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
    paddingLeft: 12,
    paddingRight: 40,
  },
  studentTileContainer: {
    position: 'relative',
    margin: 8,
    width: 160,
    height: 180,
  },
  studentTile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Use same styling for both platforms
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 10,
  },
  selectedStudentTile: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  selectedStudentIcon: {
    backgroundColor: '#007AFF',
  },
  selectedStudentText: {
    color: '#007AFF',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  studentIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  studentPhoto: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginTop: 5,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStudentPhoto: {
    borderColor: '#007AFF',
  },
  // No longer needed with FontAwesome icon
  studentName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  disabledMenuItem: {
    opacity: 0.6,
    backgroundColor: '#f8f8f8',
  },
  disabledMenuText: {
    color: '#999',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF9500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
