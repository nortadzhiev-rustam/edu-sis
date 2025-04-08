import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faChalkboardTeacher,
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
    console.log(userData);
  }, [userData]);

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Teacher Dashboard</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} size={22} color='#fff' />
        </TouchableOpacity>
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
              <View style={styles.userInfoHeader}>
                <View style={styles.photoContainer}>
                  {userData.photo ? (
                    <Image
                      source={{ uri: userData.photo }}
                      style={styles.userPhoto}
                      resizeMode='cover'
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <FontAwesomeIcon
                        icon={faUser}
                        size={30}
                        color='#007AFF'
                      />
                    </View>
                  )}
                </View>
                <View style={styles.userInfoTitleContainer}>
                  <Text style={styles.userInfoTitle}>Teacher Information</Text>
                  <Text style={styles.userInfoText}>
                    ID: {userData.id || 'N/A'}
                  </Text>
                </View>
              </View>

              {userData.department && (
                <Text style={styles.userInfoText}>
                  Department: {userData.department}
                </Text>
              )}

              {userData.position && (
                <Text style={styles.userInfoText}>
                  Position: {userData.position}
                </Text>
              )}

              {userData.email && (
                <Text style={styles.userInfoText}>Email: {userData.email}</Text>
              )}
            </View>
          </View>

          <View style={styles.menuContainer}>
            <Text style={styles.menuSectionTitle}>Teacher Menu</Text>

            <View style={styles.tilesContainer}>
              {/* First row of tiles */}
              <View style={styles.tileRow}>
                <TouchableOpacity style={styles.tile}>
                  <View
                    style={[
                      styles.tileIconContainer,
                      { backgroundColor: 'rgba(0, 122, 255, 0.1)' },
                    ]}
                  >
                    <FontAwesomeIcon icon={faUser} size={24} color='#007AFF' />
                  </View>
                  <Text style={styles.tileText}>My Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile}>
                  <View
                    style={[
                      styles.tileIconContainer,
                      { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
                    ]}
                  >
                    <FontAwesomeIcon
                      icon={faChalkboardTeacher}
                      size={24}
                      color='#34C759'
                    />
                  </View>
                  <Text style={styles.tileText}>My Classes</Text>
                </TouchableOpacity>
              </View>

              {/* Second row of tiles */}
              <View style={styles.tileRow}>
                <TouchableOpacity style={styles.tile}>
                  <View
                    style={[
                      styles.tileIconContainer,
                      { backgroundColor: 'rgba(255, 149, 0, 0.1)' },
                    ]}
                  >
                    <FontAwesomeIcon
                      icon={faGraduationCap}
                      size={24}
                      color='#FF9500'
                    />
                  </View>
                  <Text style={styles.tileText}>Grades</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile}>
                  <View
                    style={[
                      styles.tileIconContainer,
                      { backgroundColor: 'rgba(90, 200, 250, 0.1)' },
                    ]}
                  >
                    <FontAwesomeIcon
                      icon={faClipboardCheck}
                      size={24}
                      color='#5AC8FA'
                    />
                  </View>
                  <Text style={styles.tileText}>Attendance</Text>
                </TouchableOpacity>
              </View>

              {/* Third row of tiles */}
              <View style={styles.tileRow}>
                <TouchableOpacity style={styles.tile}>
                  <View
                    style={[
                      styles.tileIconContainer,
                      { backgroundColor: 'rgba(175, 82, 222, 0.1)' },
                    ]}
                  >
                    <FontAwesomeIcon icon={faBell} size={24} color='#AF52DE' />
                  </View>
                  <Text style={styles.tileText}>Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tile}>
                  <View
                    style={[
                      styles.tileIconContainer,
                      { backgroundColor: 'rgba(88, 86, 214, 0.1)' },
                    ]}
                  >
                    <FontAwesomeIcon icon={faCog} size={24} color='#5856D6' />
                  </View>
                  <Text style={styles.tileText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logout button moved to header */}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
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
  userInfoHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  photoContainer: {
    marginRight: 15,
  },
  userPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  userInfoTitleContainer: {
    flex: 1,
    justifyContent: 'center',
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
  tilesContainer: {
    width: '100%',
    marginTop: 10,
  },
  tileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
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
  // Logout icon container style removed
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    paddingHorizontal: 10,
  },
});
