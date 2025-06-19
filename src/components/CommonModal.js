import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

/**
 * CommonModal Component
 * 
 * A reusable modal component with header, content, and footer sections.
 */
const CommonModal = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  theme,
  style = {},
  headerStyle = {},
  contentStyle = {},
  animationType = 'slide',
  presentationStyle = 'pageSheet',
}) => {
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, style]}>
        <View style={[styles.modalHeader, headerStyle]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesomeIcon
              icon={faTimes}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.modalTitle}>{title}</Text>
            {subtitle && <Text style={styles.modalSubtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.headerRight} />
        </View>
        
        <View style={[styles.modalContent, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

/**
 * StepModal Component
 * 
 * A specialized modal for step-based workflows with progress indicator.
 */
const StepModal = ({
  visible,
  onClose,
  currentStep,
  totalSteps,
  stepTitle,
  children,
  onNext,
  onPrevious,
  onSubmit,
  canProceed = true,
  loading = false,
  nextButtonText = 'Next',
  submitButtonText = 'Submit',
  theme,
  style = {},
}) => {
  const styles = createStyles(theme);

  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          return (
            <View key={step} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  currentStep >= step && styles.progressDotActive,
                  currentStep === step && styles.progressDotCurrent,
                ]}
              />
              {step < totalSteps && (
                <View
                  style={[
                    styles.progressLine,
                    currentStep > step && styles.progressLineActive,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderFooter = () => {
    return (
      <View style={styles.stepFooter}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={onPrevious}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={16}
              color={theme.colors.secondary}
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.footerRight}>
          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed && styles.disabledButton,
              ]}
              onPress={onNext}
              disabled={!canProceed}
            >
              <Text
                style={[
                  styles.nextButtonText,
                  !canProceed && styles.disabledButtonText,
                ]}
              >
                {nextButtonText}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.disabledButton,
              ]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.headerText}
                />
              ) : (
                <Text style={styles.submitButtonText}>{submitButtonText}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <CommonModal
      visible={visible}
      onClose={onClose}
      title={stepTitle}
      subtitle={`Step ${currentStep} of ${totalSteps}`}
      theme={theme}
      style={style}
    >
      {renderProgressIndicator()}
      
      <ScrollView
        style={styles.stepContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      
      {renderFooter()}
    </CommonModal>
  );
};

/**
 * ConfirmationModal Component
 * 
 * A specialized modal for confirmation dialogs.
 */
const ConfirmationModal = ({
  visible,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  loading = false,
  theme,
}) => {
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.confirmationOverlay}>
        <View style={styles.confirmationContent}>
          <Text style={styles.confirmationTitle}>{title}</Text>
          {message && (
            <Text style={styles.confirmationMessage}>{message}</Text>
          )}
          
          <View style={styles.confirmationActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel || onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.confirmButton,
                confirmVariant === 'danger' && styles.dangerButton,
                loading && styles.disabledButton,
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.headerText}
                />
              ) : (
                <Text
                  style={[
                    styles.confirmButtonText,
                    confirmVariant === 'danger' && styles.dangerButtonText,
                  ]}
                >
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    // CommonModal styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      minHeight: 56,
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    headerRight: {
      width: 44,
    },
    modalContent: {
      flex: 1,
      padding: 16,
    },

    // StepModal styles
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 32,
    },
    progressStep: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.border,
    },
    progressDotActive: {
      backgroundColor: theme.colors.primary,
    },
    progressDotCurrent: {
      backgroundColor: theme.colors.secondary,
    },
    progressLine: {
      width: 24,
      height: 2,
      backgroundColor: theme.colors.border,
      marginHorizontal: 4,
    },
    progressLineActive: {
      backgroundColor: theme.colors.primary,
    },
    stepContent: {
      flex: 1,
    },
    stepFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    backButtonText: {
      fontSize: 16,
      color: theme.colors.secondary,
      marginLeft: 8,
    },
    footerRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.headerText,
    },
    submitButton: {
      backgroundColor: theme.colors.success,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.headerText,
    },
    disabledButton: {
      opacity: 0.5,
    },
    disabledButtonText: {
      color: theme.colors.textLight,
    },

    // ConfirmationModal styles
    confirmationOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    confirmationContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    confirmationTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    confirmationMessage: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    confirmationActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginRight: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginLeft: 8,
      backgroundColor: theme.colors.primary,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.headerText,
      textAlign: 'center',
    },
    dangerButton: {
      backgroundColor: theme.colors.error,
    },
    dangerButtonText: {
      color: theme.colors.headerText,
    },
  });

export { CommonModal, StepModal, ConfirmationModal };
export default CommonModal;
