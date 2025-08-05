// Enhanced XSS protection and input validation
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove dangerous HTML tags and attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/expression\(/gi, '')
    .replace(/eval\(/gi, '')
    .replace(/document\./gi, '')
    .replace(/window\./gi, '')
    .replace(/location\./gi, '')
    .replace(/alert\(/gi, '')
    .replace(/confirm\(/gi, '')
    .replace(/prompt\(/gi, '')
    .trim();
};

export const validateMessage = (message: string): { isValid: boolean; error?: string } => {
  if (!message || !message.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  const maxLength = parseInt(import.meta.env.VITE_MAX_MESSAGE_LENGTH || '2000');
  if (message.length > maxLength) {
    return { isValid: false, error: `Message too long (max ${maxLength} characters)` };
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /expression\(/i,
    /eval\(/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(message)) {
      return { isValid: false, error: 'Message contains potentially unsafe content' };
    }
  }

  return { isValid: true };
};

export const rateLimit = {
  private requests: new Map<string, { count: number; resetTime: number }>(),
  
  checkLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.requests.get(key);
    
    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  },
  
  clear(): void {
    this.requests.clear();
  }
}; 