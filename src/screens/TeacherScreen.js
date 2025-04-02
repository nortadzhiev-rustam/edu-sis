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
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faChalkboardTeacher,
  faBook,
  faClipboardCheck,
  faBell,
  faCog,
  faSignOutAlt,
  faGraduationCap,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TeacherScreen({ route, navigation }) {
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
            const parsedData = JSON.parse(storedUserData);
            // Only set if it's a teacher account
            if (parsedData.userType === 'teacher') {
              setUserData(parsedData);
            } else {
              // If not a teacher account, redirect to home
              navigation.replace('Home');
            }
          }
        } catch (error) {
          console.error('Error retrieving user data:', error);
        }
      }
      setLoading(false);
    };

    getUserData();
  }, []);

  const handleLogout = () => {
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
            // Navigate back to home screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } catch (error) {
            console.error('Error logging out:', error);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher Dashboard</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading user data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.userInfoContainer}>
            <Text style={styles.welcomeText}>
              Welcome, {userData.name || 'Teacher'}!
            </Text>

            <View style={styles.userInfoCard}>
              <Text style={styles.userInfoTitle}>Teacher Information</Text>
              <Text style={styles.userInfoText}>
                ID: {userData.username || 'N/A'}
              </Text>
              <Text style={styles.userInfoText}>
                Email: {userData.email || 'N/A'}
              </Text>
              {userData.department && (
                <Text style={styles.userInfoText}>
                  Department: {userData.department}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.menuContainer}>
            <Text style={styles.menuSectionTitle}>Teacher Menu</Text>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <FontAwesomeIcon icon={faUser} size={18} color='#007AFF' />
              </View>
              <Text style={styles.menuItemText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <FontAwesomeIcon
                  icon={faChalkboardTeacher}
                  size={18}
                  color='#007AFF'
                />
              </View>
              <Text style={styles.menuItemText}>My Classes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <FontAwesomeIcon
                  icon={faGraduationCap}
                  size={18}
                  color='#007AFF'
                />
              </View>
              <Text style={styles.menuItemText}>Grade Management</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <FontAwesomeIcon
                  icon={faClipboardCheck}
                  size={18}
                  color='#007AFF'
                />
              </View>
              <Text style={styles.menuItemText}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <FontAwesomeIcon icon={faBell} size={18} color='#007AFF' />
              </View>
              <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <FontAwesomeIcon icon={faCog} size={18} color='#007AFF' />
              </View>
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutButton]}
              onPress={handleLogout}
            >
              <View
                style={[styles.menuIconContainer, styles.logoutIconContainer]}
              >
                <FontAwesomeIcon
                  icon={faSignOutAlt}
                  size={18}
                  color='#FF3B30'
                />
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
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
