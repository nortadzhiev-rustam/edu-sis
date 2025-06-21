import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createCustomShadow } from '../utils/commonStyles';

/**
 * ComingSoonBadge Component
 *
 * A reusable badge component for indicating "Coming Soon" features.
 *
 * @param {Object} props
 * @param {string} props.text - Badge text (default: 'Coming Soon')
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {Object} props.fontSizes - Font sizes object for responsive text
 * @param {Object} props.style - Additional styles for the badge container
 */
const ComingSoonBadge = ({
  text = 'Coming Soon',
  theme,
  fontSizes,
  style = {},
}) => {
  const styles = createStyles(theme, fontSizes);

  return (
    <View style={[styles.comingSoonBadge, style]}>
      <Text style={styles.comingSoonText}>{text}</Text>
    </View>
  );
};

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    comingSoonBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: theme.colors.warning || '#FF9500',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.2,
        radius: 4,
        elevation: 3,
      }),
    },
    comingSoonText: {
      color: theme.colors.headerText,
      fontSize: fontSizes?.comingSoonText || 10,
      fontWeight: 'bold',
      letterSpacing: 0.3,
    },
  });

export default ComingSoonBadge;
