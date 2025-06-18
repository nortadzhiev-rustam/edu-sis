import React from 'react';
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

  const { student, attendance, discipline, assessments, library } = studentData;

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

      <ScrollView style={styles.content}>
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

        {/* Contact Information */}
        {renderInfoCard(
          'Contact Information',
          faPhone,
          <View style={styles.cardContent}>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Parent Name:</Text>
              <Text style={styles.contactValue}>
                {student.parent_name || 'N/A'}
              </Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Phone:</Text>
              <Text style={styles.contactValue}>
                {student.parent_phone || 'N/A'}
              </Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Emergency Contact:</Text>
              <Text style={styles.contactValue}>
                {student.emergency_contact || 'N/A'}
              </Text>
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
