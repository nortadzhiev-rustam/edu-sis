import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faHeartbeat,
  faPlus,
  faUsers,
  faUserMd,
  faUserFriends,
  faChartBar,
  faCalendarAlt,
  faClock,
  faThermometerHalf,
  faPills,
  faCommentMedical,
  faInfoCircle,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getTeacherHealthData,
  deleteHealthRecord,
} from '../services/healthService';
import { createCustomShadow } from '../utils/commonStyles';
import { getAvailableHealthActions } from '../utils/healthPermissions';

export default function TeacherHealthScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

  const { authCode, userData } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'staff', 'guests', 'stats'

  // Get user permissions
  const permissions = getAvailableHealthActions(userData);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const response = await getTeacherHealthData(authCode);
      if (response.success && response.data) {
        setHealthData(response.data);
      }
    } catch (error) {
      console.error('Error loading health data:', error);
      Alert.alert('Error', 'Failed to load health data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHealthData();
    setRefreshing(false);
  };

  const handleDeleteRecord = async (recordType, recordId) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this health record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteHealthRecord(
                authCode,
                recordType,
                recordId
              );
              if (response.success) {
                Alert.alert('Success', 'Health record deleted successfully');
                loadHealthData(); // Refresh data
              } else {
                Alert.alert('Error', 'Failed to delete health record');
              }
            } catch (error) {
              console.error('Error deleting record:', error);
              Alert.alert('Error', 'Failed to delete health record');
            }
          },
        },
      ]
    );
  };

  const handleCreateRecord = (recordType) => {
    navigation.navigate('CreateHealthRecordScreen', {
      authCode,
      recordType,
      userData,
    });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    try {
      const timeParts = timeString.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  const canCreateRecords = () => {
    return permissions.canCreate;
  };

  const canDeleteRecords = () => {
    return permissions.canDelete;
  };

  const renderTabButton = (tabKey, title, icon, count = null) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTabButton]}
      onPress={() => setActiveTab(tabKey)}
    >
      <FontAwesomeIcon
        icon={icon}
        size={16}
        color={
          activeTab === tabKey
            ? theme.colors.primary
            : theme.colors.textSecondary
        }
      />
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tabKey && styles.activeTabButtonText,
        ]}
      >
        {title}
      </Text>
      {count !== null && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHealthRecord = (record, recordType) => (
    <View key={`${recordType}-${record.record_id}`} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle}>
            {recordType === 'student' && record.student_name}
            {recordType === 'staff' && record.staff_name}
            {recordType === 'guest' && record.guest_name}
          </Text>
          <View style={styles.recordDateTime}>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
            <FontAwesomeIcon
              icon={faClock}
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.recordTime}>{formatTime(record.time)}</Text>
          </View>
        </View>
        {canDeleteRecords() && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteRecord(recordType, record.record_id)}
          >
            <FontAwesomeIcon
              icon={faTrash}
              size={14}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.recordContent}>
        <View style={styles.recordRow}>
          <FontAwesomeIcon
            icon={faCommentMedical}
            size={14}
            color={theme.colors.error}
          />
          <Text style={styles.recordLabel}>Reason:</Text>
          <Text style={styles.recordValue}>
            {record.reason || 'Not specified'}
          </Text>
        </View>

        {record.action && (
          <View style={styles.recordRow}>
            <FontAwesomeIcon
              icon={faUserMd}
              size={14}
              color={theme.colors.success}
            />
            <Text style={styles.recordLabel}>Action:</Text>
            <Text style={styles.recordValue}>{record.action}</Text>
          </View>
        )}

        {record.temperature && (
          <View style={styles.recordRow}>
            <FontAwesomeIcon
              icon={faThermometerHalf}
              size={14}
              color={theme.colors.warning}
            />
            <Text style={styles.recordLabel}>Temperature:</Text>
            <Text style={styles.recordValue}>{record.temperature}</Text>
          </View>
        )}

        {record.medication && (
          <View style={styles.recordRow}>
            <FontAwesomeIcon
              icon={faPills}
              size={14}
              color={theme.colors.info}
            />
            <Text style={styles.recordLabel}>Medication:</Text>
            <Text style={styles.recordValue}>{record.medication}</Text>
          </View>
        )}

        {record.comments && (
          <View style={styles.recordRow}>
            <FontAwesomeIcon
              icon={faInfoCircle}
              size={14}
              color={theme.colors.text}
            />
            <Text style={styles.recordLabel}>Comments:</Text>
            <Text style={styles.recordValue}>{record.comments}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <FontAwesomeIcon icon={icon} size={24} color={color} />
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const renderCreateButton = (recordType, title) => {
    if (!canCreateRecords()) return null;

    return (
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => handleCreateRecord(recordType)}
      >
        <FontAwesomeIcon icon={faPlus} size={16} color={theme.colors.primary} />
        <Text style={styles.createButtonText}>Add {title}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Compact Header */}
        <View style={styles.compactHeaderContainer}>
          {/* Navigation Header */}
          <View style={styles.navigationHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Health Management</Text>

            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading health data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!healthData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Compact Header */}
        <View style={styles.compactHeaderContainer}>
          {/* Navigation Header */}
          <View style={styles.navigationHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Health Management</Text>

            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.errorContainer}>
          <FontAwesomeIcon
            icon={faHeartbeat}
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.errorTitle}>No Access</Text>
          <Text style={styles.errorText}>
            You don't have permission to access health data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Health Management</Text>

          <View style={styles.headerRight} />
        </View>

        {/* Tab Navigation Subheader */}
        <View style={styles.subHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollContainer}
          >
            <View style={styles.tabContainer}>
              {renderTabButton(
                'students',
                'Students',
                faUsers,
                healthData?.student_records?.length
              )}
              {renderTabButton(
                'staff',
                'Staff',
                faUserMd,
                healthData?.staff_records?.length
              )}
              {renderTabButton(
                'guests',
                'Guests',
                faUserFriends,
                healthData?.guest_records?.length
              )}
              {renderTabButton('stats', 'Statistics', faChartBar)}
            </View>
          </ScrollView>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'students' && (
          <View style={styles.tabContent}>
            {renderCreateButton('student', 'Student Record')}
            {healthData.student_records?.length > 0 ? (
              healthData.student_records.map((record) =>
                renderHealthRecord(record, 'student')
              )
            ) : (
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon
                  icon={faUsers}
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No Student Records</Text>
                <Text style={styles.emptyText}>
                  No student health records found.
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'staff' && (
          <View style={styles.tabContent}>
            {renderCreateButton('staff', 'Staff Record')}
            {healthData.staff_records?.length > 0 ? (
              healthData.staff_records.map((record) =>
                renderHealthRecord(record, 'staff')
              )
            ) : (
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon
                  icon={faUserMd}
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No Staff Records</Text>
                <Text style={styles.emptyText}>
                  No staff health records found.
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'guests' && (
          <View style={styles.tabContent}>
            {renderCreateButton('guest', 'Guest Record')}
            {healthData.guest_records?.length > 0 ? (
              healthData.guest_records.map((record) =>
                renderHealthRecord(record, 'guest')
              )
            ) : (
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon
                  icon={faUserFriends}
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No Guest Records</Text>
                <Text style={styles.emptyText}>
                  No guest health records found.
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stats' && healthData.statistics && (
          <View style={styles.tabContent}>
            <View style={styles.statsGrid}>
              {renderStatCard(
                'Student Records',
                healthData.statistics.total_student_records,
                faUsers,
                theme.colors.primary
              )}
              {renderStatCard(
                'Staff Records',
                healthData.statistics.total_staff_records,
                faUserMd,
                theme.colors.success
              )}
              {renderStatCard(
                'Guest Records',
                healthData.statistics.total_guest_records,
                faUserFriends,
                theme.colors.info
              )}
              {renderStatCard(
                'This Week',
                healthData.statistics.records_this_week,
                faCalendarAlt,
                theme.colors.warning
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Compact Header Styles
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      overflow: 'hidden',
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 0,
      paddingVertical: 0,
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
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
    },
    headerRight: {
      width: 36,
    },
    filterButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorTitle: {
      fontSize: fontSizes.headerTitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    accessInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.infoLight,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    accessInfoText: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.info,
      marginLeft: 8,
      flex: 1,
    },
    tabScrollContainer: {
      maxHeight: 60,
      backgroundColor: 'transparent',
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    tabButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginRight: 12,
      backgroundColor: theme.colors.background,
    },
    activeTabButton: {
      backgroundColor: theme.colors.primaryLight,
    },
    tabButtonText: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      marginLeft: 6,
      fontWeight: '500',
    },
    activeTabButtonText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    tabBadge: {
      backgroundColor: theme.colors.error,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 6,
      minWidth: 10,
      alignItems: 'center',
    },
    tabBadgeText: {
      fontSize: fontSizes.badgeText,
      color: '#fff',
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    tabContent: {
      padding: 16,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryLight,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
    },
    createButtonText: {
      fontSize: fontSizes.body,
      color: theme.colors.primary,
      marginLeft: 8,
      fontWeight: '600',
    },
    recordCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 2,
      }),
    },
    recordHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    recordInfo: {
      flex: 1,
    },
    recordTitle: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    recordDateTime: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recordDate: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.textSecondary,
      marginLeft: 4,
      marginRight: 12,
    },
    recordTime: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    deleteButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
    recordContent: {
      padding: 16,
    },
    recordRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    recordLabel: {
      fontSize: fontSizes.bodySmall,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginLeft: 8,
      marginRight: 8,
      minWidth: 80,
    },
    recordValue: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.text,
      flex: 1,
      lineHeight: 18,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: fontSizes.headerTitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: fontSizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      width: '48%',
      borderLeftWidth: 4,
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 2,
      }),
    },
    statContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statText: {
      marginLeft: 12,
      flex: 1,
    },
    statValue: {
      fontSize: fontSizes.profileName,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statTitle: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });
