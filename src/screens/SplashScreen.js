import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext'; // Import useTheme
import useThemeLogo from '../hooks/useThemeLogo';
import { isIPad } from '../utils/deviceDetection';
import { lockOrientationForDevice } from '../utils/orientationLock';

const { width, height } = Dimensions.get('window');
const TYPING_SPEED = 50; // Increased for better visibility
const LOGO_ANIMATION_DURATION = 1000;
const TEXT_LINE1 = 'Inspiring Brilliance';
const TEXT_LINE2 = 'Building Brighter Futures';
const FULL_TEXT = TEXT_LINE1 + '\n' + TEXT_LINE2;

export default function SplashScreen({ onAnimationComplete }) {
  const { theme } = useTheme(); // Get theme from context
  const logoSource = useThemeLogo();
  const [displayText, setDisplayText] = useState('');
  const [startTyping, setStartTyping] = useState(false);
  const animation = useSharedValue(0);

  // Create styles based on current theme
  const styles = useMemo(() => createStyles(theme), [theme]);

  // iPad-specific configurations
  const isIPadDevice = isIPad();

  const logoStyle = useAnimatedStyle(() => {
    // Responsive scaling for different devices
    const finalScale = isIPadDevice ? 0.5 : 0.6;
    const scale = interpolate(animation.value, [0, 1, 2], [0, 1, finalScale]);

    // Responsive translation for different screen sizes
    const translateYAmount = isIPadDevice ? -height * 0.44 : -height * 0.42;
    const translateY = interpolate(
      animation.value,
      [0, 1, 2],
      [0, 0, translateYAmount]
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity: interpolate(animation.value, [0, 1, 1.5, 2], [0, 1, 1, 1]),
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animation.value, [0, 1, 1.5, 2], [0, 1, 1, 0]),
    };
  });

  useEffect(() => {
    // Lock orientation based on device type
    lockOrientationForDevice();

    // Initial logo animation
    // Just animate to the middle state (1) initially
    // The transition to state 2 will happen after typing is complete
    animation.value = withTiming(1, {
      duration: LOGO_ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Start typing animation
    setTimeout(() => {
      setStartTyping(true);
    }, LOGO_ANIMATION_DURATION);
  }, []);

  useEffect(() => {
    if (!startTyping) return;

    let currentIndex = 0;
    const typewriterInterval = setInterval(() => {
      if (currentIndex <= FULL_TEXT.length) {
        setDisplayText(FULL_TEXT.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typewriterInterval);
        // Animation is complete, call the callback if provided
        if (onAnimationComplete) {
          // Add a small delay to ensure the text is fully visible
          setTimeout(() => {
            // Start the final animation
            animation.value = withTiming(2, {
              duration: 500,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            });

            // Call the completion callback after a delay that matches the animation duration
            setTimeout(() => {
              onAnimationComplete();
            }, 600); // 500ms animation + 100ms buffer
          }, 1000);
        }
      }
    }, TYPING_SPEED);

    return () => clearInterval(typewriterInterval);
  }, [startTyping]);

  return (
    <SafeAreaView style={[styles.container]} edges={[]}>
      <Animated.Image
        source={logoSource}
        style={[styles.logo, logoStyle]}
        resizeMode='contain'
      />
      <Animated.Text style={[styles.text, textStyle]}>
        {displayText}
      </Animated.Text>
    </SafeAreaView>
  );
}

const createStyles = (theme) => {
  const isIPadDevice = isIPad();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: isIPadDevice ? Math.min(width * 0.4, 400) : width * 0.5,
      height: isIPadDevice ? Math.min(height * 0.4, 400) : height * 0.5,
      // Add subtle shadow for better visibility in both themes
      ...Platform.select({
        ios: {
          shadowColor: theme.mode === 'dark' ? '#ffffff' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.mode === 'dark' ? 0.1 : 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: theme.mode === 'dark' ? 2 : 1,
        },
      }),
    },
    text: {
      marginTop: isIPadDevice ? 30 : 20,
      fontSize: isIPadDevice ? 28 : 22,
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: 'center',
      paddingHorizontal: isIPadDevice ? 40 : 20,
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
      lineHeight: isIPadDevice ? 40 : 32,
      letterSpacing: isIPadDevice ? 0.8 : 0.5,
      // Add subtle text shadow for better readability
      ...Platform.select({
        ios: {
          textShadowColor:
            theme.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
      }),
    },
  });
};
