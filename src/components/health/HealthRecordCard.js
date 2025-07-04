import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faThermometerHalf,
  faPills,
  faCommentMedical,
  faInfoCircle,
  faUserMd,
  faFirstAid,
  faTrash,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { createCustomShadow } from '../../utils/commonStyles';

export default function HealthRecordCard({
  record,
  recordType = 'student', // 'student', 'staff', 'guest'
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  showPatientName = true,
}) {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

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

  const getPatientName = () => {
    switch (recordType) {
      case 'student':
        return record.student_name;
      case 'staff':
        return record.staff_name;
      case 'guest':
        return record.guest_name;
      default:
        return 'Unknown';
    }
  };

  const renderRecordRow = (icon, label, value, iconColor = theme.colors.textSecondary) => {
    if (!value) return null;

    return (
      <View style={styles.recordRow}>
        <FontAwesomeIcon icon={icon} size={14} color={iconColor} />
        <View style={styles.recordTextContainer}>
          <Text style={styles.recordLabel}>{label}:</Text>
          <Text style={styles.recordValue}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          {showPatientName && (
            <Text style={styles.patientName}>{getPatientName()}</Text>
          )}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateContainer}>
              <FontAwesomeIcon icon={faCalendarAlt} size={12} color={theme.colors.primary} />
              <Text style={styles.dateText}>{formatDate(record.date)}</Text>
            </View>
            <View style={styles.timeContainer}>
              <FontAwesomeIcon icon={faClock} size={12} color={theme.colors.primary} />
              <Text style={styles.timeText}>{formatTime(record.time)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {canEdit && onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(record)}>
              <FontAwesomeIcon icon={faEdit} size={14} color={theme.colors.info} />
            </TouchableOpacity>
          )}
          {canDelete && onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(record)}>
              <FontAwesomeIcon icon={faTrash} size={14} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {renderRecordRow(
          faCommentMedical,
          'Reason',
          record.reason,
          theme.colors.error
        )}

        {renderRecordRow(
          faFirstAid,
          'Action Taken',
          record.action,
          theme.colors.success
        )}

        {renderRecordRow(
          faThermometerHalf,
          'Temperature',
          record.temperature,
          theme.colors.warning
        )}

        {renderRecordRow(
          faPills,
          'Medication',
          record.medication,
          theme.colors.info
        )}

        {record.parent_contact_time && renderRecordRow(
          faClock,
          'Parent Contacted',
          formatTime(record.parent_contact_time),
          theme.colors.primary
        )}

        {renderRecordRow(
          faInfoCircle,
          'Comments',
          record.comments,
          theme.colors.text
        )}

        {record.time_left_nurse_clinic && renderRecordRow(
          faClock,
          'Left Clinic',
          formatTime(record.time_left_nurse_clinic),
          theme.colors.textSecondary
        )}
      </View>

      {record.created_by && (
        <View style={styles.footer}>
          <FontAwesomeIcon icon={faUserMd} size={12} color={theme.colors.textSecondary} />
          <Text style={styles.createdByText}>Recorded by: {record.created_by}</Text>
          {record.created_at && (
            <Text style={styles.createdAtText}>
              {formatDate(record.created_at)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme, fontSizes) => StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: fontSizes.medium,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: fontSizes.small,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  timeText: {
    fontSize: fontSizes.small,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  content: {
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
    fontSize: fontSizes.small,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  recordValue: {
    fontSize: fontSizes.medium,
    color: theme.colors.text,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  createdByText: {
    fontSize: fontSizes.small,
    color: theme.colors.textSecondary,
    marginLeft: 6,
    fontStyle: 'italic',
    flex: 1,
  },
  createdAtText: {
    fontSize: fontSizes.tiny,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
