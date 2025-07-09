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
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
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

      // Get user's branch information
      const userBranchInfo = await getUserBranchInfo();
      let branchId = userBranchInfo.branchId;

      // For teachers, check if they have a selected branch
      if (userBranchInfo.userType === 'teacher') {
        const selectedBranchId = await getSelectedBranchId();
        if (selectedBranchId) {
          branchId = selectedBranchId;
        }
      }

      console.log('❓ FAQ: Using branch ID:', branchId);
      console.log('❓ FAQ: User type:', userBranchInfo.userType);

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
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
      setError('Unable to load FAQ information. Please try again.');
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
          {branch.total_faqs === 1 ? 'Question' : 'Questions'}
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQ</Text>
          <View style={styles.headerRight} />
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQ</Text>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.headerRight} />
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
