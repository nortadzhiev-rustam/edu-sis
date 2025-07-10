import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { createCustomShadow } from '../utils/commonStyles';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

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
  const translateX = useSharedValue(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const updateIsRevealed = (revealed) => {
    setIsRevealed(revealed);
  };

  const handleDeleteAction = () => {
    onDelete(record);
  };

  const panGesture = Gesture.Pan()
    .enabled(canDelete)
    .onUpdate((event) => {
      // Only allow left swipe (negative translationX) to reveal delete button
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -deleteButtonWidth);
      } else if (isRevealed && event.translationX > 0) {
        // Allow right swipe to hide delete button when it's revealed
        const currentOffset = isRevealed ? -deleteButtonWidth : 0;
        translateX.value = Math.min(currentOffset + event.translationX, 0);
      }
    })
    .onEnd((event) => {
      if (event.translationX < -deleteButtonWidth / 2 && !isRevealed) {
        // Swipe left enough to reveal delete button
        translateX.value = withSpring(-deleteButtonWidth, {
          damping: 15,
          stiffness: 150,
        });
        runOnJS(updateIsRevealed)(true);
      } else if (event.translationX > deleteButtonWidth / 2 && isRevealed) {
        // Swipe right enough to hide delete button
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 150,
        });
        runOnJS(updateIsRevealed)(false);
      } else {
        // Snap to appropriate position based on current state
        const targetValue = isRevealed ? -deleteButtonWidth : 0;
        translateX.value = withSpring(targetValue, {
          damping: 15,
          stiffness: 150,
        });
      }
    });

  const handleDelete = () => {
    // Animate back to original position first
    translateX.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
    runOnJS(updateIsRevealed)(false);
    runOnJS(handleDeleteAction)();
  };

  const handleTapOutside = () => {
    if (isRevealed) {
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      runOnJS(updateIsRevealed)(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  if (!canDelete) {
    // If delete is not allowed, return the record without swipe functionality
    return children;
  }

  const defaultContainerStyle = {
    position: 'relative',
    
    borderRadius: 16,
    marginBottom: 15,
    marginHorizontal: 5,
    ...createCustomShadow(theme, {
      height: 10,
      opacity: 0.1,
      radius: 10,
      elevation: 4,
    }),
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
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    zIndex: 1,
    ...createCustomShadow(theme, {
      height: 10,
      opacity: 0.15,
      radius: 12,
      elevation: 8,
    }),
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
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[defaultSwipeableStyle, animatedStyle]}>
          <View onTouchStart={handleTapOutside}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default SwipeableRecord;
