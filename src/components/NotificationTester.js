import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { sendBPSLocalNotification } from '../utils/messaging';
import { sendBPSNotification } from '../services/notificationService';

const NotificationTester = ({ theme }) => {
  const [loading, setLoading] = useState(false);

  const testLocalBPSNotification = async () => {
    try {
      const testBPSData = {
        item_type: 'prs',
        item_title: 'Excellent Participation',
        item_point: 10,
        student_name: 'Test Student',
        note: 'Great work in today\'s discussion!',
      };

      await sendBPSLocalNotification(testBPSData);
      Alert.alert('Success', 'Local BPS notification sent!');
    } catch (error) {
      console.error('Error sending local notification:', error);
      Alert.alert('Error', 'Failed to send local notification');
    }
  };

  const testNegativeBPSNotification = async () => {
    try {
      const testBPSData = {
        item_type: 'dps',
        item_title: 'Late to Class',
        item_point: -5,
        student_name: 'Test Student',
        note: 'Please arrive on time for future classes.',
      };

      await sendBPSLocalNotification(testBPSData);
      Alert.alert('Success', 'Negative BPS notification sent!');
    } catch (error) {
      console.error('Error sending negative notification:', error);
      Alert.alert('Error', 'Failed to send negative notification');
    }
  };

  const testRemoteBPSNotification = async () => {
    setLoading(true);
    try {
      const testBPSData = {
        student_id: 1,
        user_id: 'test_teacher',
        item_type: 'prs',
        item_title: 'Test Remote Notification',
        item_point: 5,
        date: new Date().toISOString().split('T')[0],
        id: Date.now(),
        student_name: 'Test Student',
        note: 'This is a test remote notification',
      };

      await sendBPSNotification(testBPSData);
      Alert.alert('Success', 'Remote BPS notification sent to backend!');
    } catch (error) {
      console.error('Error sending remote notification:', error);
      Alert.alert('Error', `Failed to send remote notification: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      alignItems: 'center',
    },
    buttonText: {
      color: theme.colors.headerText,
      fontSize: 16,
      fontWeight: 'bold',
    },
    negativeButton: {
      backgroundColor: theme.colors.error,
    },
    remoteButton: {
      backgroundColor: theme.colors.secondary,
    },
    description: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 20,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Tester</Text>
      <Text style={styles.description}>
        Use these buttons to test different types of BPS notifications.
        Make sure notification permissions are granted.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={testLocalBPSNotification}
      >
        <Text style={styles.buttonText}>Test Positive BPS (Local)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.negativeButton]}
        onPress={testNegativeBPSNotification}
      >
        <Text style={styles.buttonText}>Test Negative BPS (Local)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.remoteButton]}
        onPress={testRemoteBPSNotification}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Test Remote BPS Notification'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default NotificationTester;
