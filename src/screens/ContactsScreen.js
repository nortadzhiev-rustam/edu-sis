import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getContactsData,
  getUserBranchInfo,
  getSelectedBranchId,
  getUniqueBranches,
} from '../services/informationService';

export default function ContactsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [contactsData, setContactsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const styles = StyleSheet.create({
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
    // Legacy header style (keeping for compatibility)
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      ...theme.shadows.small,
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
      width: 40,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    branchContainer: {
      margin: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      ...theme.shadows.small,
      overflow: 'hidden',
    },
    branchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.primary + '10',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    branchLogo: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 16,
    },
    branchName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    contactsContainer: {
      padding: 16,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    contactIcon: {
      width: 40,
      alignItems: 'center',
      marginRight: 12,
    },
    contactContent: {
      flex: 1,
    },
    contactLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    contactValue: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    contactLink: {
      color: theme.colors.primary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    generatedAt: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      padding: 16,
      fontStyle: 'italic',
    },
  });

  const fetchContactsData = async () => {
    try {
      setError(null);

      // Get all unique branches from all user data
      const uniqueBranches = await getUniqueBranches();

      if (uniqueBranches.length === 0) {
        // Fallback to old method if no branches found
        const userBranchInfo = await getUserBranchInfo();
        let branchId = userBranchInfo.branchId;

        // For teachers, check if they have a selected branch
        if (userBranchInfo.userType === 'teacher') {
          const selectedBranchId = await getSelectedBranchId();
          if (selectedBranchId) {
            branchId = selectedBranchId;
          }
        }

        console.log('📞 CONTACTS: Using branch ID (fallback):', branchId);
        console.log(
          '📞 CONTACTS: User type (fallback):',
          userBranchInfo.userType
        );

        const response = await getContactsData(branchId);

        if (response.success) {
          // Filter data by user's branch if branchId is provided
          let filteredResponse = { ...response };
          if (branchId && response.contacts) {
            filteredResponse.contacts = response.contacts.filter(
              (branch) => branch.branch_id === branchId
            );
            filteredResponse.total_branches = filteredResponse.contacts.length;
            console.log(
              '📞 CONTACTS: Filtered to user branch, showing',
              filteredResponse.total_branches,
              'branch(es)'
            );
          }
          setContactsData(filteredResponse);
        } else {
          throw new Error('Failed to fetch contacts data');
        }

        return;
      }

      // If we have multiple branches, fetch data for all of them
      console.log(
        '📞 CONTACTS: Found unique branches:',
        uniqueBranches.map((b) => `${b.branchName} (${b.userType})`)
      );

      // If there's only one branch, use it directly
      if (uniqueBranches.length === 1) {
        const branchId = uniqueBranches[0].branchId;
        console.log('📞 CONTACTS: Using single branch ID:', branchId);

        const response = await getContactsData(branchId);

        if (response.success) {
          setContactsData(response);
        } else {
          throw new Error('Failed to fetch contacts data');
        }

        return;
      }

      // If there are multiple branches with different IDs, fetch all data
      console.log('📞 CONTACTS: Fetching data for multiple branches');

      // Get all data without branch filter
      const response = await getContactsData();

      if (response.success) {
        // Filter to only include branches that match our unique branches
        const branchIds = uniqueBranches.map((b) => b.branchId);

        let filteredResponse = { ...response };
        if (response.contacts) {
          filteredResponse.contacts = response.contacts.filter((branch) =>
            branchIds.includes(branch.branch_id)
          );
          filteredResponse.total_branches = filteredResponse.contacts.length;
          console.log(
            '📞 CONTACTS: Filtered to user branches, showing',
            filteredResponse.total_branches,
            'branch(es)'
          );
        }
        setContactsData(filteredResponse);
      } else {
        throw new Error('Failed to fetch contacts data');
      }
    } catch (error) {
      console.error('Error fetching contacts data:', error);
      setError('Unable to load contact information. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContactsData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContactsData();
  };

  const handleRetry = () => {
    setLoading(true);
    fetchContactsData();
  };

  const handlePhonePress = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmailPress = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handleWebsitePress = (website) => {
    if (website) {
      Linking.openURL(website);
    }
  };

  const renderContactItem = (icon, label, value, onPress, isLink = false) => {
    if (!value) return null;

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.contactIcon}>
          <FontAwesomeIcon icon={icon} size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.contactContent}>
          <Text style={styles.contactLabel}>{label}</Text>
          <Text style={[styles.contactValue, isLink && styles.contactLink]}>
            {value}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBranch = (branch) => (
    <View key={branch.branch_id} style={styles.branchContainer}>
      <View style={styles.branchHeader}>
        {branch.branch_logo && (
          <Image
            source={{ uri: branch.branch_logo }}
            style={styles.branchLogo}
            resizeMode='cover'
          />
        )}
        <Text style={styles.branchName}>{branch.branch_name}</Text>
      </View>

      <View style={styles.contactsContainer}>
        {renderContactItem(
          faPhone,
          'Phone',
          branch.branch_phone,
          () => handlePhonePress(branch.branch_phone),
          true
        )}

        {renderContactItem(
          faEnvelope,
          'Email',
          branch.branch_email,
          () => handleEmailPress(branch.branch_email),
          true
        )}

        {renderContactItem(
          faMapMarkerAlt,
          'Address',
          branch.branch_address,
          null,
          false
        )}

        {renderContactItem(
          faGlobe,
          'Website',
          branch.branch_website,
          () => handleWebsitePress(branch.branch_website),
          true
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Us</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            Loading contact information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Us</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
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

          <Text style={styles.headerTitle}>Contact Us</Text>

          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {contactsData &&
        contactsData.contacts &&
        contactsData.contacts.length > 0 ? (
          <>
            {contactsData.contacts.map(renderBranch)}
            {contactsData.generated_at && (
              <Text style={styles.generatedAt}>
                Last updated:{' '}
                {new Date(contactsData.generated_at).toLocaleDateString()}
              </Text>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesomeIcon
              icon={faEnvelope}
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              No contact information available at the moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
