import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../utils/messaging';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {
  teacherLogin,
  studentLogin,
  saveUserData,
} from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ route, navigation }) {
  // Get login type from route params or default to teacher
  const routeLoginType = route.params?.loginType;
  const isAddingStudent = route.params?.isAddingStudent || false;

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceToken, setDeviceToken] = useState('');

  // Login type state (teacher or student)
  const [loginType, setLoginType] = useState(routeLoginType || 'teacher');

  useEffect(() => {
    // Get device token when component mounts
    const fetchDeviceToken = async () => {
      const token = await getToken();
      setDeviceToken(token || '');
    };

    fetchDeviceToken();
  }, []);

  // Handle login based on selected type
  const handleUserLogin = async (username, password) => {
    setLoading(true);

    try {
      let userData;

      if (loginType === 'teacher') {
        userData = await teacherLogin(username, password, deviceToken);
      } else {
        userData = await studentLogin(username, password, deviceToken);
      }

      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Login Error',
        'An unexpected error occurred. Please try again.'
      );
      console.error('Login error:', error);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(
        'Validation Error',
        'Please enter both username and password'
      );
      return;
    }

    const userData = await handleUserLogin(username, password);

    if (userData) {
      // Handle successful login
      console.log(
        `${
          loginType.charAt(0).toUpperCase() + loginType.slice(1)
        } login successful:`,
        userData
      );

      // If adding a student account
      if (isAddingStudent) {
        // Save to student accounts list
        try {
          const existingStudentsJSON = await AsyncStorage.getItem(
            'studentAccounts'
          );
          const existingStudents = existingStudentsJSON
            ? JSON.parse(existingStudentsJSON)
            : [];

          // Add the new student account
          existingStudents.push(userData);

          // Save updated list
          await AsyncStorage.setItem(
            'studentAccounts',
            JSON.stringify(existingStudents)
          );

          // Navigate back to parent screen
          Alert.alert('Success', 'Student account added successfully');
          navigation.goBack();
        } catch (error) {
          console.error('Error saving student account:', error);
          Alert.alert('Error', 'Failed to save student account');
        }
      } else {
        // Normal login flow - save user data to AsyncStorage
        await saveUserData(userData, AsyncStorage);

        // Navigate to appropriate screen based on user type
        if (userData.userType === 'teacher') {
          navigation.replace('TeacherScreen', { userData });
        } else if (userData.userType === 'student') {
          // For direct student login (not through parent)
          Alert.alert(
            'Student Login',
            'Student direct login is not supported in this version'
          );
          // You could implement a student screen here if needed
        }
      }
    } else {
      Alert.alert('Login Failed', `Incorrect ${loginType} ID or password!`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color='#007AFF' />
        </TouchableOpacity>
        <Animated.Image
          source={require('../../assets/app_logo.jpg')}
          style={styles.logo}
          resizeMode='contain'
        />

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.formContainer}
        >
          <Text style={styles.title}>
            {isAddingStudent
              ? 'Add Student Account'
              : routeLoginType
              ? `${
                  routeLoginType.charAt(0).toUpperCase() +
                  routeLoginType.slice(1)
                } Login`
              : 'Please Login'}
          </Text>

          {/* Login Type Selector - only show if not coming from a specific route */}
          {!routeLoginType && (
            <View style={styles.loginTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.loginTypeButton,
                  loginType === 'teacher' && styles.activeLoginType,
                ]}
                onPress={() => setLoginType('teacher')}
              >
                <Text
                  style={[
                    styles.loginTypeText,
                    loginType === 'teacher' && styles.activeLoginTypeText,
                  ]}
                >
                  Teacher
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginTypeButton,
                  loginType === 'student' && styles.activeLoginType,
                ]}
                onPress={() => setLoginType('student')}
              >
                <Text
                  style={[
                    styles.loginTypeText,
                    loginType === 'student' && styles.activeLoginTypeText,
                  ]}
                >
                  Student
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder={loginType === 'teacher' ? 'Teacher ID' : 'Student ID'}
            value={username}
            onChangeText={setUsername}
            autoCapitalize='none'
          />

          <TextInput
            style={styles.input}
            placeholder='Password'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='#fff' size='small' />
            ) : (
              <Text style={styles.loginButtonText}>
                {loginType === 'teacher' ? 'Teacher Login' : 'Student Login'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.3,
    height: height * 0.15,
    marginTop: height * 0.1,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginTop: height * 0.05,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  activeLoginType: {
    backgroundColor: '#007AFF',
  },
  loginTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeLoginTypeText: {
    color: '#fff',
  },
});
