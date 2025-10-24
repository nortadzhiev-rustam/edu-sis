import React, {useState, useImperativeHandle, forwardRef, useEffect, useRef} from 'react';
import {View, TouchableOpacity, StyleSheet, Text} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEllipsisV} from '@fortawesome/free-solid-svg-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
} from 'react-native-reanimated';
import {useNotifications} from '../contexts/NotificationContext';
import {useMessaging} from '../contexts/MessagingContext';
import {useParentNotifications} from '../hooks/useParentNotifications';

const AnimatedHeaderActions = forwardRef(({
                                              actions,
                                              theme,
                                              userType = 'teacher',
                                              selectedStudent = null,
                                              onExpandChange,
                                              autoDismissTimeout = 5000
                                          }, ref) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const autoDismissTimer = useRef(null);

        // Get unread counts based on a user type
        const teacherNotifications = useNotifications();
        const teacherMessaging = useMessaging();
        const parentNotifications = useParentNotifications();

        // Calculate total unread count based on user type
        let totalUnreadCount = 0;
        if (userType === 'teacher') {
            totalUnreadCount = (teacherNotifications?.unreadCount || 0) + (teacherMessaging?.unreadCount || 0);
        } else if (userType === 'parent') {
            // For parents, get the unread count for selected student or all students
            const notificationCount = selectedStudent
                ? (parentNotifications?.getStudentUnreadCount?.(selectedStudent.authCode) || 0)
                : (parentNotifications?.getTotalUnreadCount?.() || 0);
            // Parent messaging count would need to be implemented similarly
            // For now, we'll just use notification count
            totalUnreadCount = notificationCount;
        }

        // Shared values for animations
        const backgroundWidth = useSharedValue(36);
        const backgroundOpacity = useSharedValue(0);

        // Toggle button animation
        const toggleOpacity = useSharedValue(1);
        const toggleScale = useSharedValue(1);

        // Individual button animations
        const button1Scale = useSharedValue(0);
        const button1Opacity = useSharedValue(0);
        const button2Scale = useSharedValue(0);
        const button2Opacity = useSharedValue(0);
        const button3Scale = useSharedValue(0);
        const button3Opacity = useSharedValue(0);

        // Spring configuration
        const springConfig = {
            damping: 15,
            stiffness: 150,
            mass: 0.5,
        };

        const clearAutoDismissTimer = () => {
            if (autoDismissTimer.current) {
                clearTimeout(autoDismissTimer.current);
                autoDismissTimer.current = null;
            }
        };

        const startAutoDismissTimer = () => {
            clearAutoDismissTimer();
            if (autoDismissTimeout > 0) {
                autoDismissTimer.current = setTimeout(() => {
                    if (isExpanded) {
                        toggleExpansion();
                    }
                }, autoDismissTimeout);
            }
        };

        useEffect(() => {
            if (isExpanded) {
                startAutoDismissTimer();
            }
        }, [isExpanded]);

        const toggleExpansion = () => {
            if (!isExpanded) {
                // Expand animation
                setIsExpanded(true);
                onExpandChange?.(true);

                // Hide toggle button
                toggleOpacity.value = withSpring(0, springConfig);
                toggleScale.value = withSpring(0, springConfig);

                // Expand background to fit 3 action buttons (36px per button + 2px gap = 38px * 3 = 114px)
                backgroundWidth.value = withSpring(114, springConfig);
                backgroundOpacity.value = withSpring(1, springConfig);

                // Animate buttons one by one with delays
                button1Scale.value = withDelay(100, withSpring(1, springConfig));
                button1Opacity.value = withDelay(100, withSpring(1, springConfig));

                button2Scale.value = withDelay(200, withSpring(1, springConfig));
                button2Opacity.value = withDelay(200, withSpring(1, springConfig));

                button3Scale.value = withDelay(300, withSpring(1, springConfig));
                button3Opacity.value = withDelay(300, withSpring(1, springConfig));

                // Start auto-dismiss timer
                startAutoDismissTimer();
            } else {
                // Clear auto-dismiss timer
                clearAutoDismissTimer();

                // Collapse animation (reverse order)
                button3Scale.value = withSpring(0, springConfig);
                button3Opacity.value = withSpring(0, springConfig);

                button2Scale.value = withDelay(100, withSpring(0, springConfig));
                button2Opacity.value = withDelay(100, withSpring(0, springConfig));

                button1Scale.value = withDelay(200, withSpring(0, springConfig));
                button1Opacity.value = withDelay(200, withSpring(0, springConfig));

                // Collapse background
                backgroundWidth.value = withDelay(300, withSpring(36, springConfig));
                backgroundOpacity.value = withDelay(300, withSpring(0, springConfig));

                // Show toggle button
                toggleOpacity.value = withDelay(300, withSpring(1, springConfig));
                toggleScale.value = withDelay(300, withSpring(1, springConfig));

                setTimeout(() => {
                    setIsExpanded(false);
                    onExpandChange?.(false);
                }, 600);
            }
        };

        // Animated styles
        const animatedBackgroundStyle = useAnimatedStyle(() => ({
            width: backgroundWidth.value,
            opacity: backgroundOpacity.value,
        }));

        const animatedToggleStyle = useAnimatedStyle(() => ({
            opacity: toggleOpacity.value,
            transform: [{scale: toggleScale.value}],
        }));

        const animatedButton1Style = useAnimatedStyle(() => ({
            transform: [{scale: button1Scale.value}],
            opacity: button1Opacity.value,
        }));

        const animatedButton2Style = useAnimatedStyle(() => ({
            transform: [{scale: button2Scale.value}],
            opacity: button2Opacity.value,
        }));

        const animatedButton3Style = useAnimatedStyle(() => ({
            transform: [{scale: button3Scale.value}],
            opacity: button3Opacity.value,
        }));

        const handleActionPress = (action) => {
            toggleExpansion();
            // Delay the action to allow collapse animation
            setTimeout(() => {
                action.onPress();
            }, 400);
        };

        // Cleanup timer on unmount
        useEffect(() => {
            return () => {
                clearAutoDismissTimer();
            };
        }, []);

        // Expose collapse method to parent
        useImperativeHandle(ref, () => ({
            collapse: () => {
                if (isExpanded) {
                    toggleExpansion();
                }
            },
            isExpanded: () => isExpanded,
        }));

        return (
            <View style={styles.container}>
                {/* Expanded background */}
                <Animated.View
                    style={[
                        styles.expandedBackground,
                        animatedBackgroundStyle,
                        {backgroundColor: 'rgba(255, 255, 255, 0.15)'},
                    ]}
                />

                {/* Action buttons (rendered when expanded) */}
                {isExpanded && (
                    <>
                        <Animated.View style={[styles.actionButton, animatedButton1Style]}>
                            <TouchableOpacity
                                style={styles.headerActionButton}
                                onPress={() => handleActionPress(actions[0])}
                            >
                                <FontAwesomeIcon
                                    icon={actions[0].icon}
                                    size={18}
                                    color="#fff"
                                />
                                {actions[0].badge}
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[styles.actionButton, animatedButton2Style]}>
                            <TouchableOpacity
                                style={styles.headerActionButton}
                                onPress={() => handleActionPress(actions[1])}
                            >
                                <FontAwesomeIcon
                                    icon={actions[1].icon}
                                    size={18}
                                    color="#fff"
                                />
                                {actions[1].badge}
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[styles.actionButton, animatedButton3Style]}>
                            <TouchableOpacity
                                style={styles.headerActionButton}
                                onPress={() => handleActionPress(actions[2])}
                            >
                                <FontAwesomeIcon
                                    icon={actions[2].icon}
                                    size={18}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    </>
                )}

                {/* Toggle button (3 dots) - only render when not expanded */}
                {!isExpanded && (
                    <Animated.View style={animatedToggleStyle}>
                        <TouchableOpacity
                            style={styles.toggleButton}
                            onPress={toggleExpansion}
                        >
                            <FontAwesomeIcon icon={faEllipsisV} size={18} color="#fff"/>
                            {totalUnreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
        height: 36,
    },
    expandedBackground: {
        position: 'absolute',
        right: 0,
        height: 36,
        borderRadius: 18,
    },
    actionButton: {
        marginRight: 2,
    },
    headerActionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    toggleButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
});

export default AnimatedHeaderActions;

