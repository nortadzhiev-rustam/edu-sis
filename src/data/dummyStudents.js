/**
 * Dummy student data for attendance functionality
 */

export const dummyClassStudents = {
  // Sample class data for different subjects/grades
  'math_grade10': [
    {
      student_id: 'S001',
      student_name: 'John Smith',
      student_photo: 'uploads/students/john_smith.jpg',
      roll_number: '001',
      attendance_status: null, // Will be set when taking attendance
    },
    {
      student_id: 'S002',
      student_name: 'Emma Johnson',
      student_photo: 'uploads/students/emma_johnson.jpg',
      roll_number: '002',
      attendance_status: null,
    },
    {
      student_id: 'S003',
      student_name: 'Michael Brown',
      student_photo: 'uploads/students/michael_brown.jpg',
      roll_number: '003',
      attendance_status: null,
    },
    {
      student_id: 'S004',
      student_name: 'Sarah Davis',
      student_photo: null, // Some students may not have photos
      roll_number: '004',
      attendance_status: null,
    },
    {
      student_id: 'S005',
      student_name: 'David Wilson',
      student_photo: 'uploads/students/david_wilson.jpg',
      roll_number: '005',
      attendance_status: null,
    },
    {
      student_id: 'S006',
      student_name: 'Lisa Anderson',
      student_photo: 'uploads/students/lisa_anderson.jpg',
      roll_number: '006',
      attendance_status: null,
    },
    {
      student_id: 'S007',
      student_name: 'James Taylor',
      student_photo: null,
      roll_number: '007',
      attendance_status: null,
    },
    {
      student_id: 'S008',
      student_name: 'Jennifer Martinez',
      student_photo: 'uploads/students/jennifer_martinez.jpg',
      roll_number: '008',
      attendance_status: null,
    },
    {
      student_id: 'S009',
      student_name: 'Robert Garcia',
      student_photo: 'uploads/students/robert_garcia.jpg',
      roll_number: '009',
      attendance_status: null,
    },
    {
      student_id: 'S010',
      student_name: 'Ashley Rodriguez',
      student_photo: null,
      roll_number: '010',
      attendance_status: null,
    },
  ],
  'science_grade9': [
    {
      student_id: 'S011',
      student_name: 'Christopher Lee',
      student_photo: 'uploads/students/christopher_lee.jpg',
      roll_number: '011',
      attendance_status: null,
    },
    {
      student_id: 'S012',
      student_name: 'Amanda White',
      student_photo: 'uploads/students/amanda_white.jpg',
      roll_number: '012',
      attendance_status: null,
    },
    {
      student_id: 'S013',
      student_name: 'Daniel Harris',
      student_photo: null,
      roll_number: '013',
      attendance_status: null,
    },
    {
      student_id: 'S014',
      student_name: 'Michelle Clark',
      student_photo: 'uploads/students/michelle_clark.jpg',
      roll_number: '014',
      attendance_status: null,
    },
    {
      student_id: 'S015',
      student_name: 'Kevin Lewis',
      student_photo: 'uploads/students/kevin_lewis.jpg',
      roll_number: '015',
      attendance_status: null,
    },
  ],
};

/**
 * Get students for a specific class/timetable
 * This simulates the API call to get class students
 */
export const getClassStudents = (timetableId, subjectName, gradeName) => {
  // Create a key based on subject and grade for demo purposes
  const classKey = `${subjectName.toLowerCase().replace(/\s+/g, '_')}_${gradeName.toLowerCase().replace(/\s+/g, '')}`;
  
  // Return students for the class, or default to math_grade10 if not found
  const students = dummyClassStudents[classKey] || dummyClassStudents['math_grade10'];
  
  // Return a copy of the students array to avoid mutations
  return students.map(student => ({ ...student }));
};

/**
 * Simulate taking attendance API call
 */
export const submitAttendance = async (timetableId, attendanceData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate success response
  return {
    success: true,
    message: 'Attendance submitted successfully',
    data: {
      timetable_id: timetableId,
      attendance_date: new Date().toISOString().split('T')[0],
      total_students: attendanceData.length,
      present_count: attendanceData.filter(s => s.attendance_status === 'present').length,
      absent_count: attendanceData.filter(s => s.attendance_status === 'absent').length,
      late_count: attendanceData.filter(s => s.attendance_status === 'late').length,
    }
  };
};

/**
 * Simulate updating attendance API call
 */
export const updateAttendance = async (timetableId, attendanceData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simulate success response
  return {
    success: true,
    message: 'Attendance updated successfully',
    data: {
      timetable_id: timetableId,
      attendance_date: new Date().toISOString().split('T')[0],
      total_students: attendanceData.length,
      present_count: attendanceData.filter(s => s.attendance_status === 'present').length,
      absent_count: attendanceData.filter(s => s.attendance_status === 'absent').length,
      late_count: attendanceData.filter(s => s.attendance_status === 'late').length,
    }
  };
};

/**
 * Get existing attendance data for a class (for updates)
 */
export const getExistingAttendance = (timetableId, subjectName, gradeName) => {
  const students = getClassStudents(timetableId, subjectName, gradeName);
  
  // Simulate some students already having attendance taken
  // This would come from the API in real implementation
  const attendanceStatuses = ['present', 'absent', 'late', 'present', 'present'];
  
  return students.map((student, index) => ({
    ...student,
    attendance_status: attendanceStatuses[index % attendanceStatuses.length] || 'present'
  }));
};
