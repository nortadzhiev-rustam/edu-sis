import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getAboutUsData,
  getUserBranchInfo,
  getSelectedBranchId,
  getUniqueBranches,
} from '../services/informationService';

export default function AboutUsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [aboutData, setAboutData] = useState(null);
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
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    branchName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    sectionsContainer: {
      padding: 16,
    },
    sectionItem: {
      marginBottom: 20,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: 8,
    },
    sectionBody: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
      textAlign: 'justify',
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

  const fetchAboutData = async () => {
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

        console.log('📖 ABOUT US: Using branch ID (fallback):', branchId);
        console.log(
          '📖 ABOUT US: User type (fallback):',
          userBranchInfo.userType
        );

        const response = await getAboutUsData(branchId);

        if (response.success) {
          // Filter data by user's branch if branchId is provided
          let filteredResponse = { ...response };
          if (branchId && response.about_information) {
            filteredResponse.about_information =
              response.about_information.filter(
                (branch) => branch.branch_id === branchId
              );
            filteredResponse.total_branches =
              filteredResponse.about_information.length;
            console.log(
              '📖 ABOUT US: Filtered to user branch, showing',
              filteredResponse.total_branches,
              'branch(es)'
            );
          }
          setAboutData(filteredResponse);
        } else {
          throw new Error('Failed to fetch About Us data');
        }

        return;
      }

      // If we have multiple branches, fetch data for all of them
      console.log(
        '📖 ABOUT US: Found unique branches:',
        uniqueBranches.map((b) => `${b.branchName} (${b.userType})`)
      );

      // If there's only one branch, use it directly
      if (uniqueBranches.length === 1) {
        const branchId = uniqueBranches[0].branchId;
        console.log('📖 ABOUT US: Using single branch ID:', branchId);

        const response = await getAboutUsData(branchId);

        if (response.success) {
          setAboutData(response);
        } else {
          throw new Error('Failed to fetch About Us data');
        }

        return;
      }

      // If there are multiple branches with different IDs, fetch all data
      console.log('📖 ABOUT US: Fetching data for multiple branches');

      // Get all data without branch filter
      const response = await getAboutUsData();

      if (response.success) {
        // Filter to only include branches that match our unique branches
        const branchIds = uniqueBranches.map((b) => b.branchId);

        let filteredResponse = { ...response };
        if (response.about_information) {
          filteredResponse.about_information =
            response.about_information.filter((branch) =>
              branchIds.includes(branch.branch_id)
            );
          filteredResponse.total_branches =
            filteredResponse.about_information.length;
          console.log(
            '📖 ABOUT US: Filtered to user branches, showing',
            filteredResponse.total_branches,
            'branch(es)'
          );
        }
        setAboutData(filteredResponse);
      } else {
        throw new Error('Failed to fetch About Us data');
      }
    } catch (error) {
      console.error('Error fetching About Us data:', error);
      setError('Unable to load About Us information. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAboutData();
  };

  const handleRetry = () => {
    setLoading(true);
    fetchAboutData();
  };

  const renderSection = (section, index) => (
    <View key={index} style={styles.sectionItem}>
      <View style={styles.sectionHeader}>
        <FontAwesomeIcon
          icon={faInfoCircle}
          size={14}
          color={theme.colors.primary}
          style={styles.sectionIcon}
        />
        <Text style={styles.sectionHeader}>{section.header}</Text>
      </View>
      <Text style={styles.sectionBody}>{section.body}</Text>
    </View>
  );

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

      <View style={styles.sectionsContainer}>
        {branch.sections && branch.sections.length > 0 ? (
          branch.sections.map(renderSection)
        ) : (
          <Text style={styles.emptyText}>
            No information available for this branch.
          </Text>
        )}
      </View>
    </View>
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

            <Text style={styles.headerTitle}>About Us</Text>

            <View style={styles.headerRight} />
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            Loading About Us information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
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

            <Text style={styles.headerTitle}>About Us</Text>

            <View style={styles.headerRight} />
          </View>
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

          <Text style={styles.headerTitle}>About Us</Text>

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
        {aboutData &&
        aboutData.about_information &&
        aboutData.about_information.length > 0 ? (
          <>
            {aboutData.about_information.map(renderBranch)}
            {aboutData.generated_at && (
              <Text style={styles.generatedAt}>
                Last updated:{' '}
                {new Date(aboutData.generated_at).toLocaleDateString()}
              </Text>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesomeIcon
              icon={faInfoCircle}
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              No About Us information available at the moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
