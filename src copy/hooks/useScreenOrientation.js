import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import React from 'react';

/**
 * Custom hook to manage screen orientation for specific screens
 * @param {boolean} enableRotation - Whether to enable rotation when screen is focused
 * @param {string} lockOrientation - Orientation to lock to when leaving screen
 */
export const useScreenOrientation = (
  enableRotation = true,
  lockOrientation = ScreenOrientation.OrientationLock.PORTRAIT_UP
) => {
  useFocusEffect(
    React.useCallback(() => {
      if (enableRotation) {
        // Enable rotation when screen is focused
        ScreenOrientation.unlockAsync();
      }

      return () => {
        // Lock to specified orientation when leaving the screen
        ScreenOrientation.lockAsync(lockOrientation);
      };
    }, [enableRotation, lockOrientation])
  );
};

/**
 * Predefined orientation configurations
 */
export const OrientationConfig = {
  // Allow all orientations
  ALL: {
    enableRotation: true,
    lockOrientation: ScreenOrientation.OrientationLock.PORTRAIT_UP,
  },
  
  // Allow only landscape orientations
  LANDSCAPE_ONLY: {
    enableRotation: true,
    lockOrientation: ScreenOrientation.OrientationLock.PORTRAIT_UP,
    initialOrientation: ScreenOrientation.OrientationLock.LANDSCAPE,
  },
  
  // Allow only portrait orientations
  PORTRAIT_ONLY: {
    enableRotation: false,
    lockOrientation: ScreenOrientation.OrientationLock.PORTRAIT_UP,
  },
  
  // Default - portrait locked
  DEFAULT: {
    enableRotation: false,
    lockOrientation: ScreenOrientation.OrientationLock.PORTRAIT_UP,
  },
};

export default useScreenOrientation;
