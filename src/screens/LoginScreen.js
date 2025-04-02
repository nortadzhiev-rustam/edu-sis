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
import { teacherLogin, studentLogin, saveUserData } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceToken, setDeviceToken] = useState('');

  // Login type state (teacher or student)
  const [loginType, setLoginType] = useState('teacher'); // Default to teacher login

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
      Alert.alert('Login Error', 'An unexpected error occurred. Please try again.');
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
      console.log(`${loginType.charAt(0).toUpperCase() + loginType.slice(1)} login successful:`, userData);

      // Save user data to AsyncStorage
      await saveUserData(userData, AsyncStorage);

      // Navigate to Dashboard screen with user data
      navigation.navigate('Dashboard', { userData });
    } else {
      Alert.alert('Login Failed', `Incorrect ${loginType} ID or password!`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Animated.Image
          source={require('../../assets/app_logo.jpg')}
          style={styles.logo}
          resizeMode='contain'
        />

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.formContainer}
        >
          <Text style={styles.title}>Please Login</Text>

          {/* Login Type Selector */}
          <View style={styles.loginTypeContainer}>
            <TouchableOpacity
              style={[styles.loginTypeButton, loginType === 'teacher' && styles.activeLoginType]}
              onPress={() => setLoginType('teacher')}
            >
              <Text style={[styles.loginTypeText, loginType === 'teacher' && styles.activeLoginTypeText]}>Teacher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginTypeButton, loginType === 'student' && styles.activeLoginType]}
              onPress={() => setLoginType('student')}
            >
              <Text style={[styles.loginTypeText, loginType === 'student' && styles.activeLoginTypeText]}>Student</Text>
            </TouchableOpacity>
          </View>

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
