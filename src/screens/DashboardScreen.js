import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ route, navigation }) {
  // Get user data from navigation params or AsyncStorage
  const [userData, setUserData] = useState(route?.params?.userData || {});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no userData from params, try to get from AsyncStorage
    const getUserData = async () => {
      if (Object.keys(userData).length === 0) {
        try {
          const storedUserData = await AsyncStorage.getItem('userData');
          if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
          }
        } catch (error) {
          console.error('Error retrieving user data:', error);
        }
      }
      setLoading(false);
    };

    getUserData();
  }, []);

  // Determine if user is a teacher or student
  const isTeacher = userData.userType === 'teacher';
  const isStudent = userData.userType === 'student';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading user data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.userInfoContainer}>
            <Text style={styles.welcomeText}>
              Welcome, {userData.name || 'User'}!
            </Text>

            <View style={styles.userInfoCard}>
              <Text style={styles.userInfoTitle}>User Information</Text>
              <Text style={styles.userInfoText}>
                ID: {userData.username || 'N/A'}
              </Text>
              <Text style={styles.userInfoText}>
                Email: {userData.email || 'N/A'}
              </Text>
              <Text style={styles.userInfoText}>
                Type: {userData.userType || 'N/A'}
              </Text>
              {userData.role && (
                <Text style={styles.userInfoText}>Role: {userData.role}</Text>
              )}
            </View>
          </View>

          <View style={styles.menuContainer}>
            <Text style={styles.menuSectionTitle}>
              {isTeacher ? 'Teacher Menu' : 'Student Menu'}
            </Text>

            {/* Common menu items */}
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>

            {/* Teacher-specific menu items */}
            {isTeacher && (
              <>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemText}>My Classes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemText}>Grade Management</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemText}>Attendance</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Student-specific menu items */}
            {isStudent && (
              <>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemText}>My Courses</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemText}>Grades</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemText}>Assignments</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Common settings menu item */}
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutButton]}
              onPress={async () => {
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Logout',
                    onPress: async () => {
                      try {
                        // Clear user data from AsyncStorage
                        await AsyncStorage.removeItem('userData');
                        console.log('User logged out successfully');
                        // Navigate back to login screen
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        });
                      } catch (error) {
                        console.error('Error logging out:', error);
                      }
                    },
                    style: 'destructive',
                  },
                ]);
              }}
            >
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 15,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  userInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  userInfoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  menuContainer: {
    padding: 20,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  logoutText: {
    color: '#FF3B30',
  },
});
