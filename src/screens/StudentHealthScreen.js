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
  faCalendarAlt,
  faClock,
  faThermometerHalf,
  faPills,
  faCommentMedical,
  faUserMd,
  faInfoCircle,
  faPhone,
  faEye,
  faEarDeaf,
  faUtensils,
  faAllergies,
  faFirstAid,
  faRulerVertical,
  faWeight,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getStudentHealthRecords,
  getStudentHealthInfo,
} from '../services/healthService';
import { createCustomShadow } from '../utils/commonStyles';

export default function StudentHealthScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

  const { authCode } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthRecords, setHealthRecords] = useState([]);
  const [healthInfo, setHealthInfo] = useState(null);
  const [measurements, setMeasurements] = useState(null);
  const [activeTab, setActiveTab] = useState('records'); // 'records' or 'info'

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadHealthRecords(), loadHealthInfo()]);
    } catch (error) {
      console.error('Error loading health data:', error);
      Alert.alert(t('error'), t('failedToLoadHealthData'));
    } finally {
      setLoading(false);
    }
  };

  const loadHealthRecords = async () => {
    try {
      const response = await getStudentHealthRecords(authCode);
      if (response.success && response.data) {
        setHealthRecords(response.data.records || []);
      }
    } catch (error) {
      console.error('Error loading health records:', error);
    }
  };

  const loadHealthInfo = async () => {
    try {
      const response = await getStudentHealthInfo(authCode);
      if (response.success && response.data) {
        setHealthInfo(response.data.health_info);
        setMeasurements(response.data.measurements);
      }
    } catch (error) {
      console.error('Error loading health info:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHealthData();
    setRefreshing(false);
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
      // Handle both HH:MM and HH:MM:SS formats
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

  const renderHealthRecord = (record, index) => (
    <View key={record.record_id || index} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordDateTimeContainer}>
          <View style={styles.recordDateContainer}>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              size={14}
              color={theme.colors.primary}
            />
            <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
          </View>
          <View style={styles.recordTimeContainer}>
            <FontAwesomeIcon
              icon={faClock}
              size={14}
              color={theme.colors.primary}
            />
            <Text style={styles.recordTime}>{formatTime(record.time)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.recordContent}>
        <View style={styles.recordRow}>
          <FontAwesomeIcon
            icon={faCommentMedical}
            size={16}
            color={theme.colors.error}
          />
          <View style={styles.recordTextContainer}>
            <Text style={styles.recordLabel}>Reason:</Text>
            <Text style={styles.recordValue}>
              {record.reason || t('notSpecified')}
            </Text>
          </View>
        </View>

        {record.action && (
          <View style={styles.recordRow}>
            <FontAwesomeIcon
              icon={faFirstAid}
              size={16}
              color={theme.colors.success}
            />
            <View style={styles.recordTextContainer}>
              <Text style={styles.recordLabel}>Action Taken:</Text>
              <Text style={styles.recordValue}>{record.action}</Text>
            </View>
          </View>
        )}

        {record.temperature && (
          <View style={styles.recordRow}>
            <FontAwesomeIcon
              icon={faThermometerHalf}
              size={16}
              color={theme.colors.warning}
            />
            <View style={styles.recordTextContainer}>
              <Text style={styles.recordLabel}>Temperature:</Text>
              <Text style={styles.recordValue}>{record.temperature}</Text>
            </View>
          </View>
        )}

        {record.medication && (
          <View style={styles.recordRow}>
            <FontAwesomeIcon
              icon={faPills}
              size={16}
              color={theme.colors.info}
            />
            <View style={styles.recordTextContainer}>
              <Text style={styles.recordLabel}>Medication:</Text>
              <Text style={styles.recordValue}>{record.medication}</Text>
            </View>
          </View>
        )}

        {record.comments && (
          <View style={styles.recordRow}>
            <FontAwesomeIcon
              icon={faInfoCircle}
              size={16}
              color={theme.colors.text}
            />
            <View style={styles.recordTextContainer}>
              <Text style={styles.recordLabel}>Comments:</Text>
              <Text style={styles.recordValue}>{record.comments}</Text>
            </View>
          </View>
        )}

        {record.created_by && (
          <View style={styles.recordFooter}>
            <FontAwesomeIcon
              icon={faUserMd}
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.recordCreatedBy}>
              Recorded by: {record.created_by}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderHealthInfoSection = (title, icon, children) => (
    <View style={styles.infoSection}>
      <View style={styles.infoSectionHeader}>
        <FontAwesomeIcon icon={icon} size={18} color={theme.colors.primary} />
        <Text style={styles.infoSectionTitle}>{title}</Text>
      </View>
      <View style={styles.infoSectionContent}>{children}</View>
    </View>
  );

  const renderInfoRow = (label, value, icon) => {
    if (!value || value === 'None' || value === 'No') return null;

    return (
      <View style={styles.infoRow}>
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            size={14}
            color={theme.colors.textSecondary}
          />
        )}
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>{label}:</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const renderInfoRowWithDefault = (label, value, icon, defaultMessage) => {
    const displayValue =
      value && value !== 'None' && value !== 'No' && value !== null
        ? value
        : defaultMessage;

    return (
      <View style={styles.infoRow}>
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            size={14}
            color={theme.colors.textSecondary}
          />
        )}
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>{label}:</Text>
          <Text
            style={[
              styles.infoValue,
              (!value ||
                value === 'None' ||
                value === 'No' ||
                value === null) &&
                styles.infoValueDefault,
            ]}
          >
            {displayValue}
          </Text>
        </View>
      </View>
    );
  };

  const renderTabButton = (tabKey, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTabButton]}
      onPress={() => setActiveTab(tabKey)}
    >
      <FontAwesomeIcon
        icon={icon}
        size={16}
        color={
          activeTab === tabKey
            ? theme.colors.headerText
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
    </TouchableOpacity>
  );

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

            <Text style={styles.headerTitle}>Health Records</Text>

            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('loadingHealthData')}</Text>
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

          <Text style={styles.headerTitle}>Health Records</Text>

          <View style={styles.headerRight} />
        </View>

        {/* Tab Navigation Subheader */}
        <View style={styles.subHeader}>
          <View style={styles.tabContainer}>
            {renderTabButton('records', t('visitRecords'), faHeartbeat)}
            {renderTabButton('info', t('healthInfo'), faInfoCircle)}
          </View>
        </View>
      </View>
      <Text style={styles.sectionTitle}>
        {activeTab === 'records'
          ? t('visitRecords')
          : t('healthInfo')}
      </Text>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'records' && (
          <View style={styles.recordsContainer}>
            {healthRecords.length > 0 ? (
              <>{healthRecords.map(renderHealthRecord)}</>
            ) : (
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon
                  icon={faHeartbeat}
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No Health Records</Text>
                <Text style={styles.emptyText}>
                  You don't have any health visit records yet.
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'info' && healthInfo && (
          <View style={styles.infoContainer}>
            {/* Physical Measurements Section */}
            {measurements?.has_measurements &&
              renderHealthInfoSection(
                'Physical Measurements',
                faRulerVertical,
                <>
                  {measurements.latest_measurement && (
                    <>
                      {renderInfoRow(
                        'Height',
                        `${measurements.latest_measurement.height} cm`,
                        faRulerVertical
                      )}
                      {renderInfoRow(
                        'Weight',
                        `${measurements.latest_measurement.weight} kg`,
                        faWeight
                      )}
                      {renderInfoRow(
                        'Last Measured',
                        formatDate(measurements.latest_measurement.date),
                        faCalendarAlt
                      )}
                    </>
                  )}
                </>
              )}

            {renderHealthInfoSection(
              t('medicalConditions'),
              faCommentMedical,
              <>
                {renderInfoRow(
                  t('medicalConditions'),
                  healthInfo.medical_conditions,
                  faCommentMedical
                )}
                {renderInfoRow(
                  t('regularMedication'),
                  healthInfo.regularly_used_medication,
                  faPills
                )}
              </>
            )}

            {renderHealthInfoSection(
              t('visionAndHearing'),
              faEye,
              <>
                {renderInfoRowWithDefault(
                  t('visionProblems'),
                  healthInfo.has_vision_problem,
                  faEye,
                  'No vision issue found'
                )}
                {healthInfo.vision_check_date &&
                  renderInfoRow(
                    t('lastVisionCheck'),
                    formatDate(healthInfo.vision_check_date),
                    
                  )}
                {renderInfoRowWithDefault(
                  t('hearingIssues'),
                  healthInfo.hearing_issue,
                  faEarDeaf,
                  'No hearing issue found'
                )}
              </>
            )}

            {renderHealthInfoSection(
              t('allergiesAndFood'),
              faAllergies,
              <>
                {renderInfoRow(
                  t('foodConsiderations'),
                  healthInfo.special_food_consideration,
                  faUtensils
                )}
                {renderInfoRow(
                  t('allergies'),
                  healthInfo.allergies,
                  faAllergies
                )}
                {renderInfoRow(
                  t('allergySymptoms'),
                  healthInfo.allergy_symtoms
                )}
                {renderInfoRow(
                  t('firstAidInstructions'),
                  healthInfo.allergy_first_aid,
                  faFirstAid
                )}
                {renderInfoRow(
                  t('allowedMedications'),
                  healthInfo.allowed_drugs,
                  faPills
                )}
              </>
            )}

            {renderHealthInfoSection(
              t('emergencyContacts'),
              faPhone,
              <>
                {renderInfoRow(
                  t('primaryContact'),
                  healthInfo.emergency_name_1,
                  faPhone
                )}
                {healthInfo.emergency_phone_1 &&
                  renderInfoRow(
                    t('primaryPhone'),
                    healthInfo.emergency_phone_1
                  )}
                {renderInfoRow(
                  t('secondaryContact'),
                  healthInfo.emergency_name_2,
                  faPhone
                )}
                {healthInfo.emergency_phone_2 &&
                  renderInfoRow(
                    t('secondaryPhone'),
                    healthInfo.emergency_phone_2
                  )}
              </>
            )}
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
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    // Legacy header style (keeping for compatibility)
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.headerBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...createCustomShadow(theme, {
        height: 2,
        opacity: 0.1,
        radius: 4,
        elevation: 3,
      }),
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: 'transparent',
      paddingHorizontal: 4,
      paddingVertical: 8,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      marginHorizontal: 3,
      backgroundColor: theme.colors.background,
    },
    activeTabButton: {
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    tabButtonText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginLeft: 6,
      fontWeight: '500',
    },
    activeTabButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    recordsContainer: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: fontSizes.headerTitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginVertical: 16,
      marginHorizontal: 20,
    },
    recordCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 12,

      ...theme.shadows.small,
    },
    recordHeader: {
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    recordDateTimeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    recordDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recordTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recordDate: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: 8,
    },
    recordTime: {
      fontSize: fontSizes.body,
      fontWeight: '500',
      color: theme.colors.primary,
      marginLeft: 8,
    },
    recordContent: {
      padding: 16,
    },
    recordRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    recordTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    recordLabel: {
      fontSize: fontSizes.bodySmall,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    recordValue: {
      fontSize: fontSizes.body,
      color: theme.colors.text,
      lineHeight: 20,
    },
    recordFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    recordCreatedBy: {
      fontSize: fontSizes.bodySmall,
      color: theme.colors.textSecondary,
      marginLeft: 6,
      fontStyle: 'italic',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
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
      lineHeight: 22,
      paddingHorizontal: 32,
    },
    infoContainer: {
      padding: 16,
    },
    infoSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      ...createCustomShadow(theme, {
        height: 1,
        opacity: 0.08,
        radius: 3,
        elevation: 2,
      }),
    },
    infoSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    infoSectionTitle: {
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: 12,
    },
    infoSectionContent: {
      padding: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    infoTextContainer: {
      flex: 1,
      marginLeft: 12,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    infoLabel: {
      fontSize: fontSizes.bodySmall,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginRight: 8,
    },
    infoValue: {
      fontSize: fontSizes.body,
      color: theme.colors.text,
      lineHeight: 20,
    },
    infoValueDefault: {
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
  });
