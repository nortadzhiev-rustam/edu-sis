import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faEdit,
  faEye,
  faEar,
  faUtensils,
  faAllergies,
  faFirstAid,
  faPills,
  faPhone,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { createCustomShadow } from '../../utils/commonStyles';

export default function HealthInfoSection({
  title,
  icon,
  healthInfo,
  canEdit = false,
  onEdit,
  sectionType = 'general', // 'medical', 'vision', 'allergies', 'emergency'
}) {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

  const formatDate = (dateString) => {
    if (!dateString) return null;
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

  const renderInfoRow = (label, value, rowIcon = null) => {
    if (!value || value === 'None' || value === 'No' || value === '') return null;
    
    return (
      <View style={styles.infoRow}>
        {rowIcon && (
          <FontAwesomeIcon icon={rowIcon} size={14} color={theme.colors.textSecondary} />
        )}
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>{label}:</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const renderSectionContent = () => {
    if (!healthInfo) return null;

    switch (sectionType) {
      case 'medical':
        return (
          <>
            {renderInfoRow('Medical Conditions', healthInfo.medical_conditions)}
            {renderInfoRow('Regular Medication', healthInfo.regularly_used_medication, faPills)}
            {renderInfoRow('Allowed Medications', healthInfo.allowed_drugs, faPills)}
          </>
        );

      case 'vision':
        return (
          <>
            {renderInfoRow('Vision Problems', healthInfo.has_vision_problem, faEye)}
            {healthInfo.vision_check_date && renderInfoRow(
              'Last Vision Check', 
              formatDate(healthInfo.vision_check_date),
              faCalendarAlt
            )}
            {renderInfoRow('Hearing Issues', healthInfo.hearing_issue, faEar)}
          </>
        );

      case 'allergies':
        return (
          <>
            {renderInfoRow('Food Considerations', healthInfo.special_food_consideration, faUtensils)}
            {renderInfoRow('Allergies', healthInfo.allergies, faAllergies)}
            {renderInfoRow('Allergy Symptoms', healthInfo.allergy_symtoms)}
            {renderInfoRow('First Aid Instructions', healthInfo.allergy_first_aid, faFirstAid)}
          </>
        );

      case 'emergency':
        return (
          <>
            {renderInfoRow('Primary Contact', healthInfo.emergency_name_1, faPhone)}
            {healthInfo.emergency_phone_1 && renderInfoRow('Primary Phone', healthInfo.emergency_phone_1)}
            {renderInfoRow('Secondary Contact', healthInfo.emergency_name_2, faPhone)}
            {healthInfo.emergency_phone_2 && renderInfoRow('Secondary Phone', healthInfo.emergency_phone_2)}
          </>
        );

      default:
        return (
          <>
            {renderInfoRow('Medical Conditions', healthInfo.medical_conditions)}
            {renderInfoRow('Regular Medication', healthInfo.regularly_used_medication, faPills)}
            {renderInfoRow('Vision Problems', healthInfo.has_vision_problem, faEye)}
            {renderInfoRow('Hearing Issues', healthInfo.hearing_issue, faEar)}
            {renderInfoRow('Allergies', healthInfo.allergies, faAllergies)}
          </>
        );
    }
  };

  const sectionContent = renderSectionContent();
  
  // Don't render section if no content
  if (!sectionContent || React.Children.count(sectionContent) === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesomeIcon icon={icon} size={18} color={theme.colors.primary} />
          <Text style={styles.title}>{title}</Text>
        </View>
        {canEdit && onEdit && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <FontAwesomeIcon icon={faEdit} size={16} color={theme.colors.info} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        {sectionContent}
      </View>
    </View>
  );
}

const createStyles = (theme, fontSizes) => StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: fontSizes.medium,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  content: {
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
  },
  infoLabel: {
    fontSize: fontSizes.small,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSizes.medium,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
