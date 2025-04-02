import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import {
  requestUserPermission,
  notificationListener,
  getToken,
} from './src/utils/messaging';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoginStatus = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
          setInitialRoute('Dashboard');
          console.log('User already logged in:', parsedUserData);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    // Request notification permissions and setup Firebase messaging
    const setupFirebase = async () => {
      await requestUserPermission();
      notificationListener();

      const token = await getToken();
      setFcmToken(token);
      console.log('Firebase Messaging Token:', token);
    };

    // Run initialization tasks
    const initialize = async () => {
      await Promise.all([checkLoginStatus(), setupFirebase()]);
      setIsLoading(false);
    };

    initialize();
  }, []);

  // This is no longer needed as we're handling loading state in the useEffect
  // const handleAnimationComplete = () => {
  //   setIsLoading(false);
  // };

  // For development only - display the FCM token
  const DevTokenDisplay = () => {
    if (!fcmToken) return null;
    return (
      <View style={styles.tokenContainer}>
        <Text style={styles.tokenTitle}>FCM Token (Dev Only):</Text>
        <Text style={styles.tokenText}>{fcmToken}</Text>
      </View>
    );
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style='auto' />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name='Login' component={LoginScreen} />
        <Stack.Screen
          name='Dashboard'
          component={DashboardScreen}
          initialParams={{ userData: userData }}
        />
      </Stack.Navigator>
      <DevTokenDisplay />
    </NavigationContainer>
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
