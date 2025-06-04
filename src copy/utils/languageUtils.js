import AsyncStorage from '@react-native-async-storage/async-storage';

// Debounce function to prevent rapid language changes
let languageChangeTimeout = null;

export const debouncedLanguageChange = (changeFunction, languageCode, delay = 300) => {
  if (languageChangeTimeout) {
    clearTimeout(languageChangeTimeout);
  }
  
  languageChangeTimeout = setTimeout(() => {
    changeFunction(languageCode);
  }, delay);
};

// Safe language change with error handling
export const safeLanguageChange = async (changeFunction, languageCode) => {
  try {
    console.log('Safe language change initiated:', languageCode);
    
    // Ensure we're not changing to the same language
    const currentLang = await AsyncStorage.getItem('appLanguage');
    if (currentLang === languageCode) {
      console.log('Language already set to:', languageCode);
      return;
    }
    
    // Perform the change
    await changeFunction(languageCode);
    console.log('Language change completed successfully');
    
  } catch (error) {
    console.error('Error in safe language change:', error);
    throw error;
  }
};

// Check if language change is safe to perform
export const canChangeLanguage = (isChanging, currentLanguage, targetLanguage) => {
  return !isChanging && currentLanguage !== targetLanguage;
};

// Language change with UI feedback
export const changeLanguageWithFeedback = async (
  changeFunction, 
  languageCode, 
  setLoadingCallback,
  onSuccess,
  onError
) => {
  try {
    if (setLoadingCallback) setLoadingCallback(true);
    
    await safeLanguageChange(changeFunction, languageCode);
    
    if (onSuccess) onSuccess();
  } catch (error) {
    if (onError) onError(error);
  } finally {
    if (setLoadingCallback) {
      // Add a small delay to show feedback
      setTimeout(() => setLoadingCallback(false), 500);
    }
  }
};
