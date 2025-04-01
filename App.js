import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import { requestUserPermission, notificationListener } from './src/utils/messaging';

// Initialize Firebase
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';

// Your Firebase configuration is already set up via google-services.json and GoogleService-Info.plist

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Request permission and set up notification listeners
    const setupMessaging = async () => {
      await requestUserPermission();
      notificationListener();
    };

    setupMessaging();
  }, []);

  const handleAnimationComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <StatusBar style="auto" />
      {isLoading ? (
        <SplashScreen onAnimationComplete={handleAnimationComplete} />
      ) : (
        <LoginScreen />
      )}
    </>
  );
}
