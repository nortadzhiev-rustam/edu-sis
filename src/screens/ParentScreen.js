import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faPlus,
  faUser,
  faChild,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ParentScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved student accounts
    const loadStudents = async () => {
      try {
        const savedStudents = await AsyncStorage.getItem('studentAccounts');
        if (savedStudents) {
          setStudents(JSON.parse(savedStudents));
        }
      } catch (error) {
        console.error('Error loading student accounts:', error);
      } finally {
        setLoading(false);
      }
    };

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
    // Navigate to student details screen (to be implemented)
    Alert.alert('Student Selected', `Viewing details for ${student.name}`);
    // You could navigate to a student detail screen here
  };

  const renderStudentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => handleStudentPress(item)}
    >
      <View style={styles.studentIconContainer}>
        <FontAwesomeIcon icon={faChild} size={24} color='#fff' />
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name || 'Student'}</Text>
        <Text style={styles.studentDetails}>ID: {item.username || 'N/A'}</Text>
        <Text style={styles.studentDetails}>Grade: {item.grade || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No student accounts added yet</Text>
      <Text style={styles.emptySubtext}>
        Tap the + button in the header to add your child's account
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
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
        <Text style={styles.sectionTitle}>Your Children</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading student accounts...</Text>
          </View>
        ) : (
          <FlatList
            data={students}
            renderItem={renderStudentItem}
            keyExtractor={(item, index) => `student-${index}`}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={EmptyListComponent}
          />
        )}
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  // No longer needed with FontAwesome icon
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 50,
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
});
