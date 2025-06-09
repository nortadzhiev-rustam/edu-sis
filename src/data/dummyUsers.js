/**
 * Dummy user data for development and testing
 */

export const dummyUsers = {
  teachers: [
    {
      id: 'T001',
      username: 'teacher1',
      password: 'password',
      name: 'John Smith',
      email: 'john.smith@school.edu',
      phone: '+1234567890',
      department: 'Mathematics',
      position: 'Senior Teacher',
      roles: [
        { name: 'Senior Teacher', department: 'Mathematics' },
        { name: 'Math Coordinator', department: 'Mathematics' },
        { name: 'Exam Committee Member', department: 'Academic Affairs' },
      ],
      subjects: ['Algebra', 'Calculus', 'Statistics'],
      profileImage: null,
      userType: 'teacher',
    },
    {
      id: 'T002',
      username: 'teacher2',
      password: 'password',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@school.edu',
      phone: '+1987654321',
      department: 'Science',
      position: 'Department Head',
      roles: [
        { name: 'Department Head', department: 'Science' },
        { name: 'Biology Teacher', department: 'Science' },
        { name: 'Lab Supervisor', department: 'Science' },
        { name: 'Safety Officer', department: 'Administration' },
      ],
      subjects: ['Biology', 'Chemistry'],
      profileImage: null,
      userType: 'teacher',
    },
  ],
  students: [
    {
      id: 'S001',
      username: 'student1',
      password: 'password',
      name: 'Michael Brown',
      email: 'michael.brown@school.edu',
      grade: '10th Grade',
      section: 'A',
      rollNumber: '1001',
      parentName: 'David Brown',
      parentEmail: 'david.brown@example.com',
      parentPhone: '+1122334455',
      profileImage: null,
      userType: 'student',
      authCode: 'auth_code_s001',
    },
    {
      id: 'S002',
      username: 'student2',
      password: 'password',
      name: 'Emily Davis',
      email: 'emily.davis@school.edu',
      grade: '11th Grade',
      section: 'B',
      rollNumber: '1102',
      parentName: 'Jennifer Davis',
      parentEmail: 'jennifer.davis@example.com',
      parentPhone: '+1567890123',
      profileImage: null,
      userType: 'student',
      authCode: 'auth_code_s002',
    },
    {
      id: 'S003',
      username: 'student3',
      password: 'password',
      name: 'Alex Wilson',
      email: 'alex.wilson@school.edu',
      grade: '9th Grade',
      section: 'C',
      rollNumber: '903',
      parentName: 'Robert Wilson',
      parentEmail: 'robert.wilson@example.com',
      parentPhone: '+1678901234',
      profileImage: null,
      userType: 'student',
      authCode: 'auth_code_s003',
    },
  ],
};

/**
 * Helper function to find a teacher by username and password
 */
export const findTeacher = (username, password) => {
  return dummyUsers.teachers.find(
    (teacher) => teacher.username === username && teacher.password === password
  );
};

/**
 * Helper function to find a student by username and password
 */
export const findStudent = (username, password) => {
  return dummyUsers.students.find(
    (student) => student.username === username && student.password === password
  );
};
