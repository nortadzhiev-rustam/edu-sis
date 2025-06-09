import {
  sendGradeUpdateNotification,
  sendAnnouncementNotification,
  scheduleAttendanceReminder,
  storeNotificationInHistory,
} from './messaging';

// Demo notification functions for testing

export const sendDemoGradeNotification = async () => {
  const gradeInfo = {
    subject: 'Mathematics',
    grade: 'A',
    type: 'Midterm Exam',
  };
  
  await sendGradeUpdateNotification(gradeInfo);
  
  // Also store in history for demo
  const demoMessage = {
    notification: {
      title: 'New Grade Available',
      body: `Your ${gradeInfo.type} grade for ${gradeInfo.subject} is now available: ${gradeInfo.grade}`,
    },
    data: {
      type: 'grade',
      gradeInfo,
    },
    sentTime: Date.now(),
  };
  
  await storeNotificationInHistory(demoMessage);
};

export const sendDemoAttendanceNotification = async () => {
  const announcement = {
    title: 'Attendance Reminder',
    message: 'Please remember to mark attendance for your morning classes. 3 classes are still pending.',
    priority: 'high',
  };
  
  await sendAnnouncementNotification(announcement);
  
  // Also store in history for demo
  const demoMessage = {
    notification: {
      title: announcement.title,
      body: announcement.message,
    },
    data: {
      type: 'attendance',
      announcement,
    },
    sentTime: Date.now(),
  };
  
  await storeNotificationInHistory(demoMessage);
};

export const sendDemoAnnouncementNotification = async () => {
  const announcement = {
    title: 'School Holiday Notice',
    message: 'School will be closed tomorrow due to a national holiday. All classes are cancelled.',
    priority: 'normal',
  };
  
  await sendAnnouncementNotification(announcement);
  
  // Also store in history for demo
  const demoMessage = {
    notification: {
      title: announcement.title,
      body: announcement.message,
    },
    data: {
      type: 'announcement',
      announcement,
    },
    sentTime: Date.now(),
  };
  
  await storeNotificationInHistory(demoMessage);
};

export const sendDemoTimetableNotification = async () => {
  const announcement = {
    title: 'Timetable Update',
    message: 'Your Monday schedule has been updated. Physics class moved from 9:00 AM to 10:00 AM.',
    priority: 'normal',
  };
  
  await sendAnnouncementNotification(announcement);
  
  // Also store in history for demo
  const demoMessage = {
    notification: {
      title: announcement.title,
      body: announcement.message,
    },
    data: {
      type: 'timetable',
      announcement,
    },
    sentTime: Date.now(),
  };
  
  await storeNotificationInHistory(demoMessage);
};

export const scheduleDemoClassReminder = async () => {
  const classInfo = {
    subject: 'Physics',
    date: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
  };
  
  await scheduleAttendanceReminder(classInfo);
};

// Send multiple demo notifications
export const sendMultipleDemoNotifications = async () => {
  try {
    await sendDemoGradeNotification();
    
    // Wait a bit between notifications
    setTimeout(async () => {
      await sendDemoAttendanceNotification();
    }, 1000);
    
    setTimeout(async () => {
      await sendDemoAnnouncementNotification();
    }, 2000);
    
    setTimeout(async () => {
      await sendDemoTimetableNotification();
    }, 3000);
    
    console.log('Demo notifications sent successfully');
  } catch (error) {
    console.error('Error sending demo notifications:', error);
  }
};

// Create sample notification history for demo
export const createSampleNotificationHistory = async () => {
  const sampleNotifications = [
    {
      notification: {
        title: 'Grade Posted',
        body: 'Your Chemistry quiz grade is now available: B+',
      },
      data: { type: 'grade' },
      sentTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    },
    {
      notification: {
        title: 'Attendance Alert',
        body: 'Please mark attendance for Period 3 - Biology class',
      },
      data: { type: 'attendance' },
      sentTime: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
    },
    {
      notification: {
        title: 'Parent-Teacher Meeting',
        body: 'Reminder: Parent-teacher meetings scheduled for this Friday',
      },
      data: { type: 'announcement' },
      sentTime: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    },
    {
      notification: {
        title: 'Schedule Change',
        body: 'Tomorrow\'s English class moved to Room 205',
      },
      data: { type: 'timetable' },
      sentTime: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    },
  ];
  
  for (const notification of sampleNotifications) {
    await storeNotificationInHistory(notification);
  }
  
  console.log('Sample notification history created');
};
