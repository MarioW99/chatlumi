import { useState, useEffect, useCallback } from 'react';

interface RateLimitState {
  remainingRequests: number;
  resetTime: Date;
  isLimited: boolean;
}

const RATE_LIMIT_KEY = 'chat_me_rate_limit';
const DEFAULT_LIMIT = 100;
const WINDOW_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const useRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const resetTime = new Date(parsed.resetTime);
        const now = new Date();
        
        // Check if the window has expired
        if (now >= resetTime) {
          return {
            remainingRequests: DEFAULT_LIMIT,
            resetTime: new Date(now.getTime() + WINDOW_DURATION),
            isLimited: false,
          };
        }
        
        return {
          remainingRequests: parsed.remainingRequests,
          resetTime,
          isLimited: parsed.remainingRequests <= 0,
        };
      } catch {
        // If parsing fails, reset to default
      }
    }
    
    return {
      remainingRequests: DEFAULT_LIMIT,
      resetTime: new Date(Date.now() + WINDOW_DURATION),
      isLimited: false,
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
      remainingRequests: rateLimitState.remainingRequests,
      resetTime: rateLimitState.resetTime.toISOString(),
    }));
  }, [rateLimitState]);

  // Check if rate limit window has expired
  useEffect(() => {
    const checkExpiry = () => {
      const now = new Date();
      if (now >= rateLimitState.resetTime) {
        setRateLimitState({
          remainingRequests: DEFAULT_LIMIT,
          resetTime: new Date(now.getTime() + WINDOW_DURATION),
          isLimited: false,
        });
      }
    };

    const interval = setInterval(checkExpiry, 1000); // Check every second
    return () => clearInterval(interval);
  }, [rateLimitState.resetTime]);

  const consumeRequest = useCallback(() => {
    setRateLimitState(prev => {
      const newRemaining = Math.max(0, prev.remainingRequests - 1);
      return {
        ...prev,
        remainingRequests: newRemaining,
        isLimited: newRemaining <= 0,
      };
    });
  }, []);

  const canMakeRequest = useCallback(() => {
    return rateLimitState.remainingRequests > 0;
  }, [rateLimitState.remainingRequests]);

  const getRemainingTime = useCallback(() => {
    const now = new Date();
    const diff = rateLimitState.resetTime.getTime() - now.getTime();
    return Math.max(0, diff);
  }, [rateLimitState.resetTime]);

  return {
    remainingRequests: rateLimitState.remainingRequests,
    resetTime: rateLimitState.resetTime,
    isLimited: rateLimitState.isLimited,
    consumeRequest,
    canMakeRequest,
    getRemainingTime,
  };
};