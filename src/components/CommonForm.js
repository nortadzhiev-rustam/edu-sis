import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * SearchBar Component
 * 
 * A reusable search input component with search icon and clear functionality.
 */
const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  theme,
  style = {},
  inputStyle = {},
  showClearButton = true,
}) => {
  const styles = createStyles(theme);

  return (
    <View style={[styles.searchContainer, style]}>
      <FontAwesomeIcon
        icon={faSearch}
        size={16}
        color={theme.colors.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.searchInput, inputStyle]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={theme.colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {showClearButton && value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClear || (() => onChangeText(''))}
        >
          <FontAwesomeIcon
            icon={faTimes}
            size={14}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * FormInput Component
 * 
 * A reusable form input component with label and error handling.
 */
const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  editable = true,
  theme,
  style = {},
  inputStyle = {},
  labelStyle = {},
}) => {
  const styles = createStyles(theme);

  return (
    <View style={[styles.inputContainer, style]}>
      {label && (
        <Text style={[styles.inputLabel, labelStyle]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.multilineInput,
          error && styles.inputError,
          !editable && styles.disabledInput,
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        editable={editable}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * FilterTabs Component
 * 
 * A reusable tab selector component for filtering content.
 */
const FilterTabs = ({
  tabs,
  selectedTab,
  onTabPress,
  theme,
  style = {},
  tabStyle = {},
  activeTabStyle = {},
  textStyle = {},
  activeTextStyle = {},
}) => {
  const styles = createStyles(theme);

  return (
    <View style={[styles.filterTabsContainer, style]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.filterTab,
            selectedTab === tab.key && styles.activeFilterTab,
            tabStyle,
            selectedTab === tab.key && activeTabStyle,
          ]}
          onPress={() => onTabPress(tab.key)}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedTab === tab.key && styles.activeFilterTabText,
              textStyle,
              selectedTab === tab.key && activeTextStyle,
            ]}
          >
            {tab.label}
          </Text>
          {tab.count !== undefined && (
            <Text
              style={[
                styles.filterTabCount,
                selectedTab === tab.key && styles.activeFilterTabCount,
              ]}
            >
              {tab.count}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * SelectionModeToggle Component
 * 
 * A toggle component for switching between single and multiple selection modes.
 */
const SelectionModeToggle = ({
  isMultiple,
  onToggle,
  singleLabel = 'Single',
  multipleLabel = 'Multiple',
  singleIcon,
  multipleIcon,
  theme,
  style = {},
}) => {
  const styles = createStyles(theme);

  return (
    <View style={[styles.selectionModeContainer, style]}>
      <TouchableOpacity
        style={[
          styles.selectionModeButton,
          !isMultiple && styles.selectedModeButton,
        ]}
        onPress={() => onToggle(false)}
      >
        {singleIcon && (
          <FontAwesomeIcon
            icon={singleIcon}
            size={16}
            color={
              !isMultiple
                ? theme.colors.headerText
                : theme.colors.textSecondary
            }
            style={styles.modeIcon}
          />
        )}
        <Text
          style={[
            styles.selectionModeText,
            !isMultiple && styles.selectedModeText,
          ]}
        >
          {singleLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.selectionModeButton,
          isMultiple && styles.selectedModeButton,
        ]}
        onPress={() => onToggle(true)}
      >
        {multipleIcon && (
          <FontAwesomeIcon
            icon={multipleIcon}
            size={16}
            color={
              isMultiple
                ? theme.colors.headerText
                : theme.colors.textSecondary
            }
            style={styles.modeIcon}
          />
        )}
        <Text
          style={[
            styles.selectionModeText,
            isMultiple && styles.selectedModeText,
          ]}
        >
          {multipleLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    // SearchBar styles
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      paddingVertical: 4,
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },

    // FormInput styles
    inputContainer: {
      marginVertical: 8,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 44,
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    disabledInput: {
      backgroundColor: theme.colors.surfaceDisabled,
      color: theme.colors.textLight,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginTop: 4,
    },

    // FilterTabs styles
    filterTabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 4,
      marginVertical: 8,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeFilterTab: {
      backgroundColor: theme.colors.primary,
    },
    filterTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    activeFilterTabText: {
      color: theme.colors.headerText,
      fontWeight: '600',
    },
    filterTabCount: {
      fontSize: 12,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    activeFilterTabCount: {
      color: theme.colors.headerText,
    },

    // SelectionModeToggle styles
    selectionModeContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 4,
      marginVertical: 8,
    },
    selectionModeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    selectedModeButton: {
      backgroundColor: theme.colors.primary,
    },
    modeIcon: {
      marginRight: 6,
    },
    selectionModeText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    selectedModeText: {
      color: theme.colors.headerText,
      fontWeight: '600',
    },
  });

export { SearchBar, FormInput, FilterTabs, SelectionModeToggle };
export default SearchBar;
