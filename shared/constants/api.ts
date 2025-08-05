/**
 * API-related constants shared between frontend and backend
 */

// Base URLs
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.chatme.app' 
  : 'http://localhost:8000';

export const FRONTEND_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://chatme.app'
  : 'http://localhost:3000';

// API Versions
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register',
  },
  
  // Chat
  CHAT: {
    SEND: '/chat/send',
    HISTORY: '/chat/history',
    CLEAR: '/chat/history',
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    STATS: '/users/stats',
    FAMILIARIZATION: '/users/familiarization',
  },
  
  // Labeling
  LABELING: {
    TASKS: '/labeling/tasks',
    SUBMISSIONS: '/labeling/submissions',
  },
  
  // Health
  HEALTH: '/health',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  CHAT_MESSAGES_PER_HOUR: 100,
  API_REQUESTS_PER_MINUTE: 60,
  FAMILIARIZATION_ATTEMPTS: 3,
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  CHAT_MESSAGE: 60000, // 1 minute
  FILE_UPLOAD: 300000, // 5 minutes
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT_PLAIN: 'text/plain',
} as const;

// Agent Types
export const AGENT_TYPES = {
  MAIN: 'main',
  FITNESS: 'fitness',
  NUTRITION: 'nutrition',
  MENTAL_STRENGTH: 'mental-strength',
} as const;

// Paths
export const PATHS = {
  MAIN: 'main',
  FITNESS: 'fitness',
  NUTRITION: 'nutrition',
  MENTAL_STRENGTH: 'mental-strength',
} as const;