/**
 * HTML Utilities for handling HTML content in React Native
 */

/**
 * Strip HTML tags from text content
 * @param {string} html - HTML string to clean
 * @returns {string} - Clean text without HTML tags
 */
export const stripHtmlTags = (html) => {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Convert basic HTML to formatted text with line breaks
 * @param {string} html - HTML string to convert
 * @returns {string} - Formatted text with line breaks
 */
export const htmlToText = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  return html
    // Convert <br>, <br/>, <br /> to line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert </p> to double line breaks for paragraph separation
    .replace(/<\/p>/gi, '\n\n')
    // Convert </div> to line breaks
    .replace(/<\/div>/gi, '\n')
    // Convert </h1>, </h2>, etc. to double line breaks
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Convert </li> to line breaks with bullet points
    .replace(/<\/li>/gi, '\n')
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up multiple consecutive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim();
};

/**
 * Convert HTML entities to their corresponding characters
 * @param {string} text - Text with HTML entities
 * @returns {string} - Text with decoded entities
 */
export const decodeHtmlEntities = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };
  
  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return entities[entity] || entity;
  });
};

/**
 * Process HTML content for display in React Native Text components
 * @param {string} html - HTML content to process
 * @param {Object} options - Processing options
 * @param {boolean} options.preserveLineBreaks - Whether to preserve line breaks (default: true)
 * @param {boolean} options.decodeEntities - Whether to decode HTML entities (default: true)
 * @returns {string} - Processed text ready for display
 */
export const processHtmlContent = (html, options = {}) => {
  const {
    preserveLineBreaks = true,
    decodeEntities = true,
  } = options;
  
  if (!html || typeof html !== 'string') return '';
  
  let processedText = html;
  
  // Convert HTML to text with line breaks if needed
  if (preserveLineBreaks) {
    processedText = htmlToText(processedText);
  } else {
    processedText = stripHtmlTags(processedText);
  }
  
  // Decode HTML entities if needed
  if (decodeEntities) {
    processedText = decodeHtmlEntities(processedText);
  }
  
  return processedText;
};

/**
 * Check if text contains HTML tags
 * @param {string} text - Text to check
 * @returns {boolean} - True if text contains HTML tags
 */
export const containsHtml = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /<[^>]*>/g.test(text);
};

/**
 * Get a preview of HTML content (first few lines without HTML)
 * @param {string} html - HTML content
 * @param {number} maxLines - Maximum number of lines to return (default: 3)
 * @returns {string} - Preview text
 */
export const getHtmlPreview = (html, maxLines = 3) => {
  const processedText = processHtmlContent(html);
  const lines = processedText.split('\n').filter(line => line.trim());
  return lines.slice(0, maxLines).join('\n');
};
