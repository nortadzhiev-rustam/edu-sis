import React from 'react';
import { useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import {
  getUserBranchInfo,
  getSelectedBranchId,
} from '../services/informationService';

/**
 * Hook to get the appropriate app logo based on current theme
 * @returns {any} Logo image source for current theme
 */
export const useThemeLogo = () => {
  const { theme } = useTheme();

  return useMemo(() => {
    return theme.mode === 'dark'
      ? require('../../assets/app_logo_dark.png')
      : require('../../assets/app_logo.png');
  }, [theme.mode]);
};

/**
 * Hook to get the appropriate school logo based on current theme
 * @returns {any} School logo image source for current theme
 */
export const useSchoolLogo = () => {
  const { theme } = useTheme();

  return useMemo(() => {
    return theme.mode === 'dark'
      ? require('../../assets/EduNova School Logo Dark.png')
      : require('../../assets/EduNova School Logo.png');
  }, [theme.mode]);
};

// Branch logo mapping - static imports required for React Native
// logo = light mode, logo2 = dark mode
const BRANCH_LOGOS = {
  6: {
    light: require('../../assets/6_logo.png'),
    dark: require('../../assets/6_logo2.png'),
  },
  7: {
    light: require('../../assets/7_logo.png'),
    dark: require('../../assets/7_logo2.png'),
  },
  8: {
    light: require('../../assets/8_logo.png'),
    dark: require('../../assets/8_logo2.png'),
  },
  9: {
    light: require('../../assets/9_logo.png'),
    dark: require('../../assets/9_logo2.png'),
  },
  10: {
    light: require('../../assets/10_logo.png'),
    dark: require('../../assets/10_logo2.png'),
  },
};

/**
 * Hook to get the appropriate branch logo based on user's branch and current theme
 * Falls back to app logo if branch logo is not available
 * @returns {Object} Object containing current logo, branch logo, loading state, transition ready flag, and refresh function
 */
export const useBranchLogo = () => {
  const { theme } = useTheme();
  const [branchId, setBranchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBranchLogo, setShowBranchLogo] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const getBranchId = async () => {
      try {
        setLoading(true);
        let currentBranchId = null;

        // Priority 1: Check for selected student data (parent mode)
        try {
          const selectedStudent = await AsyncStorage.getItem('selectedStudent');
          if (selectedStudent) {
            const selectedStudentData = JSON.parse(selectedStudent);
            currentBranchId =
              selectedStudentData.branch?.branch_id ||
              selectedStudentData.branch_id ||
              selectedStudentData.branchId;

            if (currentBranchId) {
              console.log(
                '🏠 LOGO: Using selected student branch_id:',
                currentBranchId
              );
              setBranchId(currentBranchId);
              return;
            }
          }
        } catch (selectedStudentError) {
          console.log('🏠 LOGO: No selected student data found');
        }

        // Priority 2: Check main user data and teacher selected branch
        const userBranchInfo = await getUserBranchInfo();
        currentBranchId = userBranchInfo.branchId;

        // For teachers, check if they have a selected branch
        if (userBranchInfo.userType === 'teacher') {
          const selectedBranchId = await getSelectedBranchId();
          if (selectedBranchId) {
            currentBranchId = selectedBranchId;
            console.log(
              '🏠 LOGO: Using teacher selected branch_id:',
              currentBranchId
            );
          }
        } else if (currentBranchId) {
          console.log('🏠 LOGO: Using user branch_id:', currentBranchId);
        }

        setBranchId(currentBranchId);
      } catch (error) {
        console.error('Error getting branch ID for logo:', error);
        setBranchId(null);
      } finally {
        setLoading(false);
      }
    };

    getBranchId();
  }, [refreshTrigger]); // Re-run when refreshTrigger changes

  // Add delay before showing branch logo for smooth transition
  useEffect(() => {
    if (!loading && branchId) {
      const timer = setTimeout(() => {
        setShowBranchLogo(true);
      }, 1500); // 1.5 second delay after loading completes

      return () => clearTimeout(timer);
    }
  }, [loading, branchId]);

  const appLogo = useMemo(() => {
    return theme.mode === 'dark'
      ? require('../../assets/app_logo_dark.png')
      : require('../../assets/app_logo.png');
  }, [theme.mode]);

  const branchLogo = useMemo(() => {
    if (!branchId) return appLogo;

    // Get branch-specific logo from mapping
    const branchLogos = BRANCH_LOGOS[branchId];
    if (branchLogos) {
      // Use theme-appropriate logo: logo = light mode, logo2 = dark mode
      return theme.mode === 'dark' ? branchLogos.dark : branchLogos.light;
    }

    // If branch logo doesn't exist, fall back to app logo
    console.log(`Branch logo not found for branch ${branchId}, using app logo`);
    return appLogo;
  }, [theme.mode, branchId, appLogo]);

  // Function to manually refresh branch data
  const refreshBranchData = React.useCallback(() => {
    console.log('🏠 LOGO: Manually refreshing branch data');
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return useMemo(() => {
    return {
      currentLogo: showBranchLogo && branchId ? branchLogo : appLogo,
      appLogo,
      branchLogo,
      loading,
      shouldTransition: !loading && branchId && showBranchLogo,
      hasBranchLogo: !loading && branchId && BRANCH_LOGOS[branchId],
      refreshBranchData, // Expose refresh function
    };
  }, [
    appLogo,
    branchLogo,
    loading,
    branchId,
    showBranchLogo,
    refreshBranchData,
  ]);
};

export default useThemeLogo;
