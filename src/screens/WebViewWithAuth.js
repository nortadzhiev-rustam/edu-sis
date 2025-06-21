import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function WebViewWithAuth({ route, navigation }) {
  const { baseUrl, endpoint, title, authCode, studentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [useHtmlFallback, setUseHtmlFallback] = useState(false);

  // Construct the full URL with auth parameters
  const url = `${baseUrl}${endpoint}?authCode=${authCode}`;

  // Fallback HTML content in case the URL fails to load
  const fallbackHtml = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            line-height: 1.5;
            color: #333;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 80vh;
            text-align: center;
          }
          h1 { color: #007AFF; margin-bottom: 20px; }
          p { margin-bottom: 15px; }
          .button {
            background-color: #007AFF;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
            display: inline-block;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Unable to load content.</p>
        <p>Please check your internet connection or try again later.</p>
        <div class="button" onclick="window.ReactNativeWebView.postMessage('goBack')">Go Back</div>
      </body>
    </html>
  `;

  // Handle WebView errors
  const handleError = (error) => {
    console.error('WebView error:', error);
    setLoading(false);
    setUseHtmlFallback(true);
  };

  // Handle messages from WebView
  const handleMessage = (event) => {
    const { data } = event.nativeEvent;
    if (data === 'goBack') {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color='#007AFF' />
          </View>
        )}

        <WebView
          key='webViewKey'
          source={useHtmlFallback ? { html: fallbackHtml } : { uri: url }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={handleError}
          onMessage={handleMessage}
          renderError={(errorName) => (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load page.</Text>
              <Text style={styles.errorSubtext}>{errorName}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.retryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          cacheEnabled={true}
          incognito={false}
          sharedCookiesEnabled={true}
          originWhitelist={['*']}
          mixedContentMode='compatibility'
          allowsInlineMediaPlayback={true}
          useWebKit={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
