import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import TeacherScreen from './src/screens/TeacherScreen';
import TeacherTimetable from './src/screens/TeacherTimetable';
import TeacherBPS from './src/screens/TeacherBPS';
import ParentScreen from './src/screens/ParentScreen';
import TimetableScreen from './src/screens/TimetableScreen';
import GradesScreen from './src/screens/GradesScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import AssignmentsScreen from './src/screens/AssignmentsScreen';
import BehaviorScreen from './src/screens/BehaviorScreen';
import WebViewScreen from './src/screens/WebViewScreen';
import WebViewWithAuth from './src/screens/WebViewWithAuth';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import {
  requestUserPermission,
  notificationListener,
  getToken,
} from './src/utils/messaging';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    // We don't need to check login status here anymore
    // as we'll check it when the user taps on the Teacher button
    // in the HomeScreen

    // Request notification permissions and setup Firebase messaging
    const setupFirebase = async () => {
      try {
        // Request permission with our custom UI flow
        await requestUserPermission();

        // Setup notification listeners
        notificationListener();

        // Get the token if permission was granted
        const token = await getToken();
        if (token) {
          setFcmToken(token);
          console.log('Firebase Messaging Token:', token);
        }
      } catch (error) {
        console.error('Error setting up Firebase:', error);
        // Continue with app initialization even if notifications fail
      }
    };

    // Run initialization tasks
    const initialize = async () => {
      await setupFirebase();
      // We'll let the splash screen animation control when to transition
      // The splash screen will call handleAnimationComplete when done
    };

    initialize();
  }, []);

  const handleAnimationComplete = () => {
    console.log('Splash screen animation completed');
    setIsLoading(false);
  };

  // For development only - display the FCM token
  // const DevTokenDisplay = () => {
  //   if (!fcmToken) return null;
  //   return (
  //     <View style={styles.tokenContainer}>
  //       <Text style={styles.tokenTitle}>FCM Token (Dev Only):</Text>
  //       <Text style={styles.tokenText}>{fcmToken}</Text>
  //     </View>
  //   );
  // };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <SplashScreen onAnimationComplete={handleAnimationComplete} />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NavigationContainer>
            <StatusBar style='auto' />
            <Stack.Navigator
              initialRouteName='Home'
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name='Home' component={HomeScreen} />
              <Stack.Screen name='Login' component={LoginScreen} />
              <Stack.Screen name='TeacherScreen' component={TeacherScreen} />
              <Stack.Screen
                name='TeacherTimetable'
                component={TeacherTimetable}
              />
              <Stack.Screen name='TeacherBPS' component={TeacherBPS} />
              <Stack.Screen name='ParentScreen' component={ParentScreen} />
              <Stack.Screen
                name='TimetableScreen'
                component={TimetableScreen}
              />
              <Stack.Screen name='GradesScreen' component={GradesScreen} />
              <Stack.Screen
                name='AttendanceScreen'
                component={AttendanceScreen}
              />
              <Stack.Screen
                name='AssignmentsScreen'
                component={AssignmentsScreen}
              />
              <Stack.Screen name='BehaviorScreen' component={BehaviorScreen} />
              <Stack.Screen name='SettingsScreen' component={SettingsScreen} />
              <Stack.Screen name='WebView' component={WebViewScreen} />
              <Stack.Screen
                name='WebViewWithAuth'
                component={WebViewWithAuth}
              />
            </Stack.Navigator>
            {/* <DevTokenDisplay /> */}
          </NavigationContainer>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tokenContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  tokenTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tokenText: {
    color: 'white',
    fontSize: 10,
  },
});
