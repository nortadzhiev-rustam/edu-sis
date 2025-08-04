import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faQuestionCircle,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getFAQData,
  getUserBranchInfo,
  getSelectedBranchId,
  getUniqueBranches,
} from '../services/informationService';

export default function FAQScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [faqData, setFaqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());

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
      padding: 16,
      backgroundColor: theme.colors.primary + '10',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    branchName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    faqCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    faqsContainer: {
      padding: 8,
    },
    faqItem: {
      marginVertical: 4,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border + '30',
    },
    faqQuestion: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    questionIcon: {
      marginRight: 12,
    },
    questionText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    expandIcon: {
      marginLeft: 8,
    },
    faqAnswer: {
      padding: 16,
      paddingTop: 0,
      backgroundColor: theme.colors.background,
    },
    answerText: {
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

  const fetchFAQData = async () => {
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

        console.log('❓ FAQ: Using branch ID (fallback):', branchId);
        console.log('❓ FAQ: User type (fallback):', userBranchInfo.userType);

        const response = await getFAQData(branchId);

        if (response.success) {
          // Filter data by user's branch if branchId is provided
          let filteredResponse = { ...response };
          if (branchId && response.faq_data) {
            filteredResponse.faq_data = response.faq_data.filter(
              (branch) => branch.branch_id === branchId
            );
            filteredResponse.total_branches = filteredResponse.faq_data.length;
            console.log(
              '❓ FAQ: Filtered to user branch, showing',
              filteredResponse.total_branches,
              'branch(es)'
            );
          }
          setFaqData(filteredResponse);
        } else {
          throw new Error('Failed to fetch FAQ data');
        }

        return;
      }

      // If we have multiple branches, fetch data for all of them
      console.log(
        '❓ FAQ: Found unique branches:',
        uniqueBranches.map((b) => `${b.branchName} (${b.userType})`)
      );

      // If there's only one branch, use it directly
      if (uniqueBranches.length === 1) {
        const branchId = uniqueBranches[0].branchId;
        console.log('❓ FAQ: Using single branch ID:', branchId);

        const response = await getFAQData(branchId);

        if (response.success) {
          setFaqData(response);
        } else {
          throw new Error('Failed to fetch FAQ data');
        }

        return;
      }

      // If there are multiple branches with different IDs, fetch all data
      console.log('❓ FAQ: Fetching data for multiple branches');

      // Get all data without branch filter
      const response = await getFAQData();

      if (response.success) {
        // Filter to only include branches that match our unique branches
        const branchIds = uniqueBranches.map((b) => b.branchId);

        let filteredResponse = { ...response };
        if (response.faq_data) {
          filteredResponse.faq_data = response.faq_data.filter((branch) =>
            branchIds.includes(branch.branch_id)
          );
          filteredResponse.total_branches = filteredResponse.faq_data.length;
          console.log(
            '❓ FAQ: Filtered to user branches, showing',
            filteredResponse.total_branches,
            'branch(es)'
          );
        }
        setFaqData(filteredResponse);
      } else {
        throw new Error('Failed to fetch FAQ data');
      }
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
      setError(t('unableToLoadFAQInfo'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFAQData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFAQData();
  };

  const handleRetry = () => {
    setLoading(true);
    fetchFAQData();
  };

  const toggleFAQItem = (branchId, faqId) => {
    const itemKey = `${branchId}-${faqId}`;
    const newExpandedItems = new Set(expandedItems);

    if (newExpandedItems.has(itemKey)) {
      newExpandedItems.delete(itemKey);
    } else {
      newExpandedItems.add(itemKey);
    }

    setExpandedItems(newExpandedItems);
  };

  const renderFAQItem = (faq, branchId) => {
    const itemKey = `${branchId}-${faq.faq_id}`;
    const isExpanded = expandedItems.has(itemKey);

    return (
      <View key={faq.faq_id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => toggleFAQItem(branchId, faq.faq_id)}
        >
          <FontAwesomeIcon
            icon={faQuestionCircle}
            size={16}
            color={theme.colors.primary}
            style={styles.questionIcon}
          />
          <Text style={styles.questionText}>{faq.question}</Text>
          <FontAwesomeIcon
            icon={isExpanded ? faChevronUp : faChevronDown}
            size={14}
            color={theme.colors.textSecondary}
            style={styles.expandIcon}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.answerText}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderBranch = (branch) => (
    <View key={branch.branch_id} style={styles.branchContainer}>
      <View style={styles.branchHeader}>
        <Text style={styles.branchName}>{branch.branch_name}</Text>
        <Text style={styles.faqCount}>
          {branch.total_faqs}{' '}
          {branch.total_faqs === 1 ? t('question') : t('questions')}
        </Text>
      </View>

      <View style={styles.faqsContainer}>
        {branch.faqs && branch.faqs.length > 0 ? (
          branch.faqs.map((faq) => renderFAQItem(faq, branch.branch_id))
        ) : (
          <Text style={styles.emptyText}>
            No FAQs available for this branch.
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

            <Text style={styles.headerTitle}>FAQ</Text>

            <View style={styles.headerRight} />
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            Loading FAQ information...
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

            <Text style={styles.headerTitle}>FAQ</Text>

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

          <Text style={styles.headerTitle}>FAQ</Text>

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
        {faqData && faqData.faq_data && faqData.faq_data.length > 0 ? (
          <>
            {faqData.faq_data.map(renderBranch)}
            {faqData.generated_at && (
              <Text style={styles.generatedAt}>
                Last updated:{' '}
                {new Date(faqData.generated_at).toLocaleDateString()}
              </Text>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesomeIcon
              icon={faQuestionCircle}
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              No FAQ information available at the moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
