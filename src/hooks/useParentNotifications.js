/**
 * Custom hook for parent notification functionality
 * Manages notifications for multiple students in parent view
 */

import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export const useParentNotifications = () => {
  const {
    loadStudentNotifications,
    setCurrentStudent,
    getCurrentStudentUnreadCount,
    getCurrentStudentNotifications,
    studentNotifications,
    studentUnreadCounts,
    currentStudentAuthCode,
  } = useNotifications();

  const [selectedStudentAuthCode, setSelectedStudentAuthCode] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load notifications for a specific student
  const loadNotificationsForStudent = useCallback(
    async (studentAuthCode) => {
      if (!studentAuthCode) return;

      setLoading(true);
      try {
        const result = await loadStudentNotifications(studentAuthCode);
        if (result && result.notifications) {
          console.log(
            `Loaded ${result.notifications.length} notifications for student`
          );
          return result;
        } else {
          console.log('No notifications returned for student');
          return { notifications: [], unreadCount: 0 };
        }
      } catch (error) {
        console.error('Error loading student notifications:', error);
        return { notifications: [], unreadCount: 0 };
      } finally {
        setLoading(false);
      }
    },
    [loadStudentNotifications]
  );

  // Select a student and load their notifications
  const selectStudent = useCallback(
    async (student) => {
      if (!student?.authCode) {
        console.warn('Student has no authCode');
        return;
      }

      setSelectedStudentAuthCode(student.authCode);
      setCurrentStudent(student.authCode);

      // Load notifications if not already loaded
      if (!studentNotifications[student.authCode]) {
        await loadNotificationsForStudent(student.authCode);
      }
    },
    [loadNotificationsForStudent, setCurrentStudent, studentNotifications]
  );

  // Get unread count for a specific student
  const getStudentUnreadCount = useCallback(
    (studentAuthCode) => {
      if (!studentAuthCode) return 0;
      return studentUnreadCounts[studentAuthCode] || 0;
    },
    [studentUnreadCounts]
  );

  // Get notifications for a specific student
  const getStudentNotifications = useCallback(
    (studentAuthCode) => {
      if (!studentAuthCode) return [];
      return studentNotifications[studentAuthCode] || [];
    },
    [studentNotifications]
  );

  // Get total unread count across all students
  const getTotalUnreadCount = useCallback(() => {
    return Object.values(studentUnreadCounts).reduce(
      (total, count) => total + count,
      0
    );
  }, [studentUnreadCounts]);

  // Get current selected student's data
  const getCurrentStudentData = useCallback(() => {
    return {
      authCode: selectedStudentAuthCode,
      notifications: getCurrentStudentNotifications(),
      unreadCount: getCurrentStudentUnreadCount(),
    };
  }, [
    selectedStudentAuthCode,
    getCurrentStudentNotifications,
    getCurrentStudentUnreadCount,
  ]);

  // Refresh notifications for current student
  const refreshCurrentStudent = useCallback(async () => {
    if (selectedStudentAuthCode) {
      await loadNotificationsForStudent(selectedStudentAuthCode);
    }
  }, [selectedStudentAuthCode, loadNotificationsForStudent]);

  // Refresh notifications for all students
  const refreshAllStudents = useCallback(
    async (students) => {
      if (!students || students.length === 0) {
        console.log('No students to refresh notifications for');
        return;
      }

      console.log(`Refreshing notifications for ${students.length} students`);
      setLoading(true);
      try {
        // Process students sequentially to avoid overwhelming the API
        for (const student of students.filter((s) => s.authCode)) {
          try {
            await loadNotificationsForStudent(student.authCode);
          } catch (error) {
            console.error(
              `Error loading notifications for student ${student.authCode}:`,
              error
            );
          }
        }
        console.log('All student notifications refreshed');
      } catch (error) {
        console.error('Error refreshing all student notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    [loadNotificationsForStudent]
  );

  return {
    // State
    selectedStudentAuthCode,
    currentStudentAuthCode,
    loading,

    // Data
    studentNotifications,
    studentUnreadCounts,

    // Actions
    selectStudent,
    loadNotificationsForStudent,
    refreshCurrentStudent,
    refreshAllStudents,

    // Getters
    getStudentUnreadCount,
    getStudentNotifications,
    getTotalUnreadCount,
    getCurrentStudentData,
  };
};
