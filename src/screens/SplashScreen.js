import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const TYPING_SPEED = 30;
const LOGO_ANIMATION_DURATION = 1000;
const TEXT_LINE1 = 'Inspiring Brilliance';
const TEXT_LINE2 = 'Building Brighter Futures';
const FULL_TEXT = TEXT_LINE1 + '\n' + TEXT_LINE2;

export default function SplashScreen() {
  const [displayText, setDisplayText] = useState('');
  const [startTyping, setStartTyping] = useState(false);
  const animation = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => {
    const scale = interpolate(animation.value, [0, 1, 2], [0, 1, 0.6]);
    const translateY = interpolate(
      animation.value,
      [0, 1, 2],
      [0, 0, -height * 0.47]
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
    animation.value = withSequence(
      withTiming(1, {
        duration: LOGO_ANIMATION_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      withDelay(
        TEXT_LINE1.length * TYPING_SPEED + TEXT_LINE2.length * TYPING_SPEED,
        withTiming(2, {
          duration: 500,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      )
    );

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
        // Animation is complete, but we no longer need to call a callback
      }
    }, TYPING_SPEED);

    return () => clearInterval(typewriterInterval);
  }, [startTyping]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/app_logo.jpg')}
        style={[styles.logo, logoStyle]}
        resizeMode='contain'
      />
      <Animated.Text style={[styles.text, textStyle]}>
        {displayText}
      </Animated.Text>
    </View>
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
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    lineHeight: 28,
  },
});
