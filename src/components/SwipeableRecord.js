import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Animated,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

/**
 * SwipeableRecord Component
 * 
 * A reusable component that provides swipe-to-delete functionality for record items.
 * 
 * @param {Object} props
 * @param {Object} props.record - The record data object
 * @param {Function} props.onDelete - Callback function when delete is triggered
 * @param {boolean} props.canDelete - Whether delete functionality is enabled
 * @param {Object} props.theme - Theme object containing colors and styles
 * @param {React.ReactNode} props.children - The content to be rendered inside the swipeable container
 * @param {number} props.deleteButtonWidth - Width of the delete button (default: 70)
 * @param {string} props.deleteButtonText - Text to show on delete button (default: 'Delete')
 * @param {Object} props.containerStyle - Additional styles for the container
 * @param {Object} props.deleteButtonStyle - Additional styles for the delete button
 */
const SwipeableRecord = ({
  record,
  onDelete,
  canDelete,
  theme,
  children,
  deleteButtonWidth = 70,
  deleteButtonText = 'Delete',
  containerStyle = {},
  deleteButtonStyle = {},
}) => {
  const [translateX] = useState(new Animated.Value(0));
  const [isRevealed, setIsRevealed] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => canDelete,
    onMoveShouldSetPanResponder: (_evt, gestureState) => {
      // Only respond to horizontal swipes and only if delete is allowed
      return (
        canDelete &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 5
      );
    },
    onPanResponderGrant: () => {
      // Stop any ongoing animations
      translateX.stopAnimation();
      translateX.setOffset(translateX._value);
      translateX.setValue(0);
    },
    onPanResponderMove: (_evt, gestureState) => {
      // Only allow left swipe (negative dx) to reveal delete button
      if (gestureState.dx < 0) {
        const newValue = Math.max(gestureState.dx, -deleteButtonWidth);
        translateX.setValue(newValue);
      } else if (isRevealed && gestureState.dx > 0) {
        // Allow right swipe to hide delete button when it's revealed
        const currentOffset = isRevealed ? -deleteButtonWidth : 0;
        const newValue = Math.min(currentOffset + gestureState.dx, 0);
        translateX.setValue(newValue);
      }
    },
    onPanResponderRelease: (_evt, gestureState) => {
      translateX.flattenOffset();

      if (gestureState.dx < -deleteButtonWidth / 2 && !isRevealed) {
        // Swipe left enough to reveal delete button
        Animated.spring(translateX, {
          toValue: -deleteButtonWidth,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
        setIsRevealed(true);
      } else if (gestureState.dx > deleteButtonWidth / 2 && isRevealed) {
        // Swipe right enough to hide delete button
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
        setIsRevealed(false);
      } else {
        // Snap to appropriate position based on current state
        const targetValue = isRevealed ? -deleteButtonWidth : 0;
        Animated.spring(translateX, {
          toValue: targetValue,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    },
  });

  const handleDelete = () => {
    // Animate back to original position first
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
    }).start(() => {
      setIsRevealed(false);
      onDelete(record);
    });
  };

  const handleTapOutside = () => {
    if (isRevealed) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
      setIsRevealed(false);
    }
  };

  if (!canDelete) {
    // If delete is not allowed, return the record without swipe functionality
    return children;
  }

  const defaultContainerStyle = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    marginBottom: 15,
    marginHorizontal: 5,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  };

  const defaultDeleteButtonStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 5,
    borderRadius: 16,
  };

  const defaultSwipeableStyle = {
    transform: [{ translateX }],
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    zIndex: 1,
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  };

  return (
    <View style={[defaultContainerStyle, containerStyle]}>
      {/* Delete Background */}
      <View style={[defaultDeleteButtonStyle, deleteButtonStyle]}>
        <TouchableOpacity
          style={{
            width: deleteButtonWidth,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleDelete}
        >
          <FontAwesomeIcon
            icon={faTrash}
            size={18}
            color={theme.colors.headerText}
          />
          <Text
            style={{
              color: theme.colors.headerText,
              fontSize: 10,
              fontWeight: 'bold',
              marginTop: 2,
            }}
          >
            {deleteButtonText}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Record */}
      <Animated.View
        style={defaultSwipeableStyle}
        {...panResponder.panHandlers}
      >
        <View onTouchStart={handleTapOutside}>{children}</View>
      </Animated.View>
    </View>
  );
};

export default SwipeableRecord;
