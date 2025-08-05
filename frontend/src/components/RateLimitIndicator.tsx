import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useRateLimit } from '../hooks/useRateLimit';

interface RateLimitIndicatorProps {
  className?: string;
}

const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({ className = '' }) => {
  const { isLimited, remainingRequests, resetTime } = useRateLimit();

  if (!isLimited && remainingRequests > 10) {
    return null; // Don't show indicator when plenty of requests remain
  }

  const formatResetTime = (resetTime: Date) => {
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();
    const minutes = Math.ceil(diff / (1000 * 60));
    return minutes > 0 ? `${minutes}m` : 'soon';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isLimited ? (
        <>
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">
            Rate limited - resets in {formatResetTime(resetTime)}
          </span>
        </>
      ) : (
        <>
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-amber-600 dark:text-amber-400">
            {remainingRequests} requests remaining
          </span>
        </>
      )}
    </div>
  );
};

export default RateLimitIndicator;