import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUser,
  faPhone,
  faBirthdayCake,
  faVenusMars,
  faUserMd,
  faCalendarCheck,
  faClipboardList,
  faBookOpen,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function HomeroomStudentProfile({ route, navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { studentData } = route.params || {};

  if (!studentData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No student data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle different possible data structures
  let student, attendance, discipline, assessments, library, parents;

  if (studentData.student) {
    // If data is structured as { student: {...}, attendance: {...}, ... }
    ({ student, attendance, discipline, assessments, library, parents } =
      studentData);
  } else {
    // If studentData itself is the student object
    student = studentData;
    attendance = studentData.attendance;
    discipline = studentData.discipline;
    assessments = studentData.assessments;
    library = studentData.library;
    parents = studentData.parents;
  }

  // Additional check for student data
  if (!student) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No student information available</Text>
          <Text style={styles.errorText}>
            Raw data: {JSON.stringify(studentData, null, 2)}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderInfoCard = (title, icon, children) => (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <FontAwesomeIcon icon={icon} size={20} color={theme.colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const renderStatItem = (label, value, color = theme.colors.text) => (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Profile</Text>
        <View style={styles.headerRight} />
      </View>
      {/* Student Basic Info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {student.photo ? (
            <Image
              source={{ uri: student.photo }}
              style={styles.profileAvatar}
              resizeMode='cover'
            />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <FontAwesomeIcon
                icon={faUser}
                size={40}
                color={theme.colors.primary}
              />
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.studentName}>{student.name}</Text>

          <View style={styles.basicInfo}>
            <View style={styles.infoRow}>
              <FontAwesomeIcon
                icon={faVenusMars}
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.infoText}>
                Gender: {student.gender || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <FontAwesomeIcon
                icon={faBirthdayCake}
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.infoText}>
                Birth Date: {student.birth_date || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <ScrollView style={styles.content}>
        {/* Contact Information */}
        {renderInfoCard(
          'Contact Information',
          faPhone,
          <View style={styles.cardContent}>
            {(() => {
              // Handle parents object with father and mother properties
              if (!parents || typeof parents !== 'object') return null;

              const parentEntries = [];

              // Check for father and mother in the parents object
              if (parents.father) {
                parentEntries.push({ data: parents.father, type: 'Father' });
              }
              if (parents.mother) {
                parentEntries.push({ data: parents.mother, type: 'Mother' });
              }

              return parentEntries.length > 0
                ? parentEntries.map((parentEntry, index) => {
                    const { data: parent, type: parentType } = parentEntry;
                    return (
                      <View key={index} style={styles.parentSection}>
                        <Text style={styles.parentTypeHeader}>
                          {parentType}
                        </Text>

                        <View style={styles.contactRow}>
                          <Text style={styles.contactLabel}>Name:</Text>
                          <Text style={styles.contactValue}>
                            {parent.name || 'N/A'}
                          </Text>
                        </View>

                        <View style={styles.contactRow}>
                          <Text style={styles.contactLabel}>Email:</Text>
                          <Text style={styles.contactValue}>
                            {parent.email &&
                            !parent.email.includes('@nomail.yet')
                              ? parent.email
                              : 'N/A'}
                          </Text>
                        </View>

                        <View style={styles.contactRow}>
                          <Text style={styles.contactLabel}>Phone:</Text>
                          <Text style={styles.contactValue}>
                            {parent.mobile || 'N/A'}
                          </Text>
                        </View>

                        <View style={styles.contactRow}>
                          <Text style={styles.contactLabel}>Address:</Text>
                          <Text style={styles.contactValue}>
                            {parent.address || 'N/A'}
                          </Text>
                        </View>

                        {parent.nationality && (
                          <View style={styles.contactRow}>
                            <Text style={styles.contactLabel}>
                              Nationality:
                            </Text>
                            <Text style={styles.contactValue}>
                              {parent.nationality}
                            </Text>
                          </View>
                        )}

                        {parent.employer && (
                          <View style={styles.contactRow}>
                            <Text style={styles.contactLabel}>Employer:</Text>
                            <Text style={styles.contactValue}>
                              {parent.employer}
                            </Text>
                          </View>
                        )}

                        {parent.position && (
                          <View style={styles.contactRow}>
                            <Text style={styles.contactLabel}>Position:</Text>
                            <Text style={styles.contactValue}>
                              {parent.position}
                            </Text>
                          </View>
                        )}

                        {parent.business_phone && (
                          <View style={styles.contactRow}>
                            <Text style={styles.contactLabel}>
                              Business Phone:
                            </Text>
                            <Text style={styles.contactValue}>
                              {parent.business_phone}
                            </Text>
                          </View>
                        )}

                        {parent.business_email &&
                          !parent.business_email.includes('@nomail.yet') && (
                            <View style={styles.contactRow}>
                              <Text style={styles.contactLabel}>
                                Business Email:
                              </Text>
                              <Text style={styles.contactValue}>
                                {parent.business_email}
                              </Text>
                            </View>
                          )}

                        {index < parentEntries.length - 1 && (
                          <View style={styles.parentSeparator} />
                        )}
                      </View>
                    );
                  })
                : null;
            })()}

            {/* Show fallback message if no parent data */}
            {(!parents ||
              (typeof parents === 'object' &&
                !parents.father &&
                !parents.mother)) && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Parent Information:</Text>
                <Text style={styles.contactValue}>
                  No parent data available
                </Text>
              </View>
            )}

            {/* Emergency Contact */}
            <View style={styles.emergencySection}>
              <Text style={styles.emergencyHeader}>Emergency Contact</Text>
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Contact:</Text>
                <Text style={styles.contactValue}>
                  {parents.father.mobile || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Medical Information */}
        {student.medical_conditions &&
          renderInfoCard(
            'Medical Information',
            faUserMd,
            <View style={styles.cardContent}>
              <Text style={styles.medicalText}>
                {student.medical_conditions}
              </Text>
            </View>
          )}

        {/* Attendance Statistics */}
        {attendance &&
          renderInfoCard(
            'Attendance Statistics',
            faCalendarCheck,
            <View style={styles.cardContent}>
              <View style={styles.statsRow}>
                {renderStatItem('Present', attendance.stats.present, '#34C759')}
                {renderStatItem('Absent', attendance.stats.absent, '#FF3B30')}
                {renderStatItem('Late', attendance.stats.late, '#FF9500')}
                {renderStatItem('Total Days', attendance.stats.total_days)}
              </View>
              <View style={styles.attendanceRate}>
                <Text style={styles.attendanceRateLabel}>Attendance Rate</Text>
                <Text
                  style={[
                    styles.attendanceRateValue,
                    {
                      color:
                        attendance.attendance_rate >= 90
                          ? '#34C759'
                          : attendance.attendance_rate >= 75
                          ? '#FF9500'
                          : '#FF3B30',
                    },
                  ]}
                >
                  {attendance.attendance_rate}%
                </Text>
              </View>
            </View>
          )}

        {/* Discipline Records */}
        {discipline &&
          renderInfoCard(
            'Discipline Records',
            faClipboardList,
            <View style={styles.cardContent}>
              <View style={styles.statsRow}>
                {renderStatItem('Total Records', discipline.total_records)}
                {renderStatItem('DPS Points', discipline.dps_points, '#FF3B30')}
                {renderStatItem('PRS Points', discipline.prs_points, '#34C759')}
              </View>
            </View>
          )}

        {/* Recent Assessments */}
        {assessments &&
          assessments.length > 0 &&
          renderInfoCard(
            'Recent Assessments',
            faChartLine,
            <View style={styles.cardContent}>
              {assessments.slice(0, 5).map((assessment, index) => (
                <View key={index} style={styles.assessmentItem}>
                  <View style={styles.assessmentHeader}>
                    <Text style={styles.assessmentTitle}>
                      {assessment.assessment_title}
                    </Text>
                    <Text style={styles.assessmentSubject}>
                      {assessment.subject_name}
                    </Text>
                  </View>
                  <View style={styles.assessmentScore}>
                    <Text
                      style={[
                        styles.scoreText,
                        {
                          color:
                            assessment.percentage >= 80
                              ? '#34C759'
                              : assessment.percentage >= 60
                              ? '#FF9500'
                              : '#FF3B30',
                        },
                      ]}
                    >
                      {assessment.score}/{assessment.total_marks} (
                      {assessment.percentage}%)
                    </Text>
                    <Text style={styles.assessmentDate}>{assessment.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

        {/* Library Information */}
        {library &&
          renderInfoCard(
            'Library Information',
            faBookOpen,
            <View style={styles.cardContent}>
              <View style={styles.statsRow}>
                {renderStatItem('Total Borrowed', library.total_borrowed)}
                {renderStatItem(
                  'Currently Borrowed',
                  library.currently_borrowed,
                  '#007AFF'
                )}
              </View>
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...theme.shadows.medium,
      marginHorizontal: 16,
      borderRadius: 16,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    headerRight: {
      width: 34,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: '#FF3B30',
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    profileHeader: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      margin: 16,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    profileAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    profileAvatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInfo: {
      alignItems: 'center',
    },
    studentName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    basicInfo: {
      alignItems: 'center',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      margin: 16,
      marginTop: 8,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    cardContent: {
      padding: 16,
    },
    contactRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    contactLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    contactValue: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
      flex: 2,
      textAlign: 'right',
    },
    parentSection: {
      marginBottom: 16,
    },
    parentTypeHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    parentSeparator: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    emergencySection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    emergencyHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FF3B30',
      marginBottom: 8,
      textAlign: 'center',
    },
    medicalText: {
      fontSize: 14,
      color: '#FF9500',
      fontWeight: '500',
      textAlign: 'center',
      padding: 8,
      backgroundColor: '#FF950015',
      borderRadius: 8,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    attendanceRate: {
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    attendanceRateLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    attendanceRateValue: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    assessmentItem: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    assessmentHeader: {
      marginBottom: 6,
    },
    assessmentTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    assessmentSubject: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    assessmentScore: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    scoreText: {
      fontSize: 14,
      fontWeight: '600',
    },
    assessmentDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });
