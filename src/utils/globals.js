// Import configuration from environment
import { Config } from '../config/env';

// Export configuration for backward compatibility
export const APP_NAME = Config.APP.NAME;
export const APP_VERSION = Config.APP.VERSION;
export const API_BASE_URL = Config.API_BASE_URL;
