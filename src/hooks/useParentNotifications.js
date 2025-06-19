/**
 * Custom hook for parent notification functionality
 * Manages notifications for multiple students in parent view
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Track which students are currently being loaded to prevent duplicate calls
  const loadingStudentsRef = useRef(new Set());

  // Track the last time refreshAllStudents was called to prevent rapid successive calls
  const lastRefreshTimeRef = useRef(0);
  const REFRESH_DEBOUNCE_MS = 2000; // 2 seconds

  // Load notifications for a specific student
  const loadNotificationsForStudent = useCallback(
    async (studentAuthCode) => {
      if (!studentAuthCode) return;

      // Prevent duplicate calls for the same student
      if (loadingStudentsRef.current.has(studentAuthCode)) {
        console.log(
          `Already loading notifications for student ${studentAuthCode}`
        );
        return;
      }

      loadingStudentsRef.current.add(studentAuthCode);
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
        loadingStudentsRef.current.delete(studentAuthCode);
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

      // Debounce rapid successive calls
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < REFRESH_DEBOUNCE_MS) {
        console.log('Debouncing refreshAllStudents call');
        return;
      }
      lastRefreshTimeRef.current = now;

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
