import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const TYPING_SPEED = 50; // Increased for better visibility
const LOGO_ANIMATION_DURATION = 1000;
const TEXT_LINE1 = 'Inspiring Brilliance';
const TEXT_LINE2 = 'Building Brighter Futures';
const FULL_TEXT = TEXT_LINE1 + '\n' + TEXT_LINE2;

export default function SplashScreen({ onAnimationComplete }) {
  const [displayText, setDisplayText] = useState('');
  const [startTyping, setStartTyping] = useState(false);
  const animation = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => {
    const scale = interpolate(animation.value, [0, 1, 2], [0, 1, 0.6]);
    const translateY = interpolate(
      animation.value,
      [0, 1, 2],
      [0, 0, -height * 0.42]
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
    <SafeAreaView style={styles.container} edges={[]}>
      <Animated.Image
        source={require('../../assets/app_logo.jpg')}
        style={[styles.logo, logoStyle]}
        resizeMode='contain'
      />
      <Animated.Text style={[styles.text, textStyle]}>
        {displayText}
      </Animated.Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.5,
    height: height * 0.5,
  },
  text: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    lineHeight: 32,
    letterSpacing: 0.5,
  },
});
