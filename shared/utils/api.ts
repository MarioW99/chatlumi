/**
 * API utility functions shared between frontend and backend
 */

import { HTTP_STATUS, TIMEOUTS } from '../constants/api';
import { ApiResponse, ValidationError } from '../types/common';

/**
 * Build URL with query parameters
 */
export function buildUrl(baseUrl: string, path: string, params?: Record<string, any>): string {
  const url = new URL(path, baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> {
  return {
    data,
    error,
    message,
    success: !error,
  };
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: string,
  detail?: string,
  code?: string
): ApiResponse {
  return {
    error,
    message: detail,
    success: false,
  };
}

/**
 * Check if HTTP status code indicates success
 */
export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Check if HTTP status code indicates client error
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Check if HTTP status code indicates server error
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}

/**
 * Get human-readable error message for HTTP status code
 */
export function getStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    [HTTP_STATUS.BAD_REQUEST]: 'Bad Request',
    [HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized',
    [HTTP_STATUS.FORBIDDEN]: 'Forbidden',
    [HTTP_STATUS.NOT_FOUND]: 'Not Found',
    [HTTP_STATUS.CONFLICT]: 'Conflict',
    [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Validation Error',
    [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too Many Requests',
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    [HTTP_STATUS.BAD_GATEWAY]: 'Bad Gateway',
    [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  };
  
  return messages[status] || `HTTP ${status}`;
}

/**
 * Create timeout promise for API requests
 */
export function createTimeoutPromise(timeout: number = TIMEOUTS.API_REQUEST): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Race a promise against a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number = TIMEOUTS.API_REQUEST
): Promise<T> {
  return Promise.race([promise, createTimeoutPromise(timeout)]);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Sanitize object for API transmission (remove undefined values)
 */
export function sanitizeApiPayload(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeApiPayload(value);
      } else {
        sanitized[key] = value;
      }
    }
  });
  
  return sanitized;
}

/**
 * Convert validation errors to a more usable format
 */
export function formatValidationErrors(errors: any[]): ValidationError[] {
  return errors.map(error => ({
    field: error.loc?.join('.') || 'unknown',
    message: error.msg || 'Validation error',
    code: error.type || 'validation_error',
  }));
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error instanceof TypeError ||
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('timeout')
  );
}

/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.detail) {
    return error.detail;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Create headers for API requests
 */
export function createApiHeaders(
  token?: string,
  contentType: string = 'application/json'
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Stringify JSON safely
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}