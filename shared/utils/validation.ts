/**
 * Validation utility functions shared between frontend and backend
 */

import { ValidationResult, ValidationError } from '../types/common';

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters long',
      code: 'password_too_short',
    });
  }
  
  if (password.length > 128) {
    errors.push({
      field: 'password',
      message: 'Password must be less than 128 characters long',
      code: 'password_too_long',
    });
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
      code: 'password_missing_lowercase',
    });
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
      code: 'password_missing_uppercase',
    });
  }
  
  if (!/\d/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
      code: 'password_missing_number',
    });
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one special character',
      code: 'password_missing_special',
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'required_field',
    };
  }
  return null;
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (minLength !== undefined && value.length < minLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be at least ${minLength} characters long`,
      code: 'string_too_short',
    });
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be less than ${maxLength} characters long`,
      code: 'string_too_long',
    });
  }
  
  return errors;
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  fieldName: string,
  min?: number,
  max?: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (min !== undefined && value < min) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be at least ${min}`,
      code: 'number_too_small',
    });
  }
  
  if (max !== undefined && value > max) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be at most ${max}`,
      code: 'number_too_large',
    });
  }
  
  return errors;
}

/**
 * Validate array length
 */
export function validateArrayLength(
  value: any[],
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (minLength !== undefined && value.length < minLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must contain at least ${minLength} items`,
      code: 'array_too_short',
    });
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must contain at most ${maxLength} items`,
      code: 'array_too_long',
    });
  }
  
  return errors;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate phone number format (basic)
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate date format (ISO 8601)
 */
export function validateIsoDate(date: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return isoDateRegex.test(date) && !isNaN(Date.parse(date));
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate chat message content
 */
export function validateChatMessage(message: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  const requiredError = validateRequired(message, 'message');
  if (requiredError) {
    errors.push(requiredError);
    return { valid: false, errors };
  }
  
  const sanitized = sanitizeString(message);
  
  if (sanitized.length === 0) {
    errors.push({
      field: 'message',
      message: 'Message cannot be empty',
      code: 'message_empty',
    });
  }
  
  errors.push(...validateStringLength(sanitized, 'message', 1, 2000));
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user profile data
 */
export function validateUserProfile(profile: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (profile.email) {
    if (!validateEmail(profile.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'invalid_email',
      });
    }
  }
  
  if (profile.level !== undefined) {
    errors.push(...validateNumberRange(profile.level, 'level', 1, 100));
  }
  
  if (profile.points !== undefined) {
    errors.push(...validateNumberRange(profile.points, 'points', 0));
  }
  
  if (profile.motivation_level !== undefined) {
    errors.push(...validateNumberRange(profile.motivation_level, 'motivation_level', 1, 10));
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate familiarization answers
 */
export function validateFamiliarizationAnswers(answers: string[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!Array.isArray(answers)) {
    errors.push({
      field: 'answers',
      message: 'Answers must be an array',
      code: 'invalid_type',
    });
    return { valid: false, errors };
  }
  
  errors.push(...validateArrayLength(answers, 'answers', 3, 3));
  
  answers.forEach((answer, index) => {
    const answerErrors = validateStringLength(answer, `answers[${index}]`, 10, 1000);
    errors.push(...answerErrors);
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create validation result
 */
export function createValidationResult(errors: ValidationError[]): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(result => result.errors);
  return createValidationResult(allErrors);
}