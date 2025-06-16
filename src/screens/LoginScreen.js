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
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceToken } from '../utils/messaging';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {
  teacherLogin,
  studentLogin,
  saveUserData,
} from '../services/authService';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);

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

  const styles = createStyles(theme, fontSizes);

  useEffect(() => {
    // Get device token when component mounts
    const fetchDeviceToken = async () => {
      const token = await getDeviceToken();
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
      Alert.alert(t('error'), t('networkError'));
      return null;
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('error'), 'Please enter both username and password');
      return;
    }

    const userData = await handleUserLogin(username, password);

    if (userData) {
      // Handle successful login

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
          Alert.alert(t('success'), 'Student account added successfully');
          navigation.goBack();
        } catch (error) {
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color='#007AFF' />
        </TouchableOpacity>
        <Animated.Image
          source={require('../../assets/app_logo.png')}
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
              ? `${t(routeLoginType)} ${t('login')}`
              : t('login')}
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
                  {t('teacher')}
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
                  {t('student')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder={loginType === 'teacher' ? 'Teacher ID' : 'Student ID'}
            placeholderTextColor={theme.colors.textLight}
            value={username}
            onChangeText={setUsername}
            autoCapitalize='none'
          />

          <TextInput
            style={styles.input}
            placeholder={t('password')}
            placeholderTextColor={theme.colors.textLight}
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
                {`${t(loginType)} ${t('login')}`}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
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
      backgroundColor: theme.colors.background,
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
      fontSize: fontSizes.title,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 30,
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    },
    input: {
      width: '100%',
      height: 50,
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      marginBottom: 15,
      paddingHorizontal: 15,
      fontSize: fontSizes.body,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loginButton: {
      width: '100%',
      height: 50,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 15,
      ...theme.shadows.small,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: fontSizes.buttonText,
      fontWeight: '600',
    },
    forgotPassword: {
      marginTop: 15,
      alignItems: 'center',
    },
    forgotPasswordText: {
      color: theme.colors.primary,
      fontSize: fontSizes.bodySmall,
    },
    loginTypeContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loginTypeButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    activeLoginType: {
      backgroundColor: theme.colors.primary,
    },
    loginTypeText: {
      fontSize: fontSizes.body,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    activeLoginTypeText: {
      color: '#fff',
    },
  });
