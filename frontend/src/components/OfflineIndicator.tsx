import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, Send } from 'lucide-react';
import { AgentService } from '../services/agentService';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedMessages, setQueuedMessages] = useState<number>(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const updateQueueCount = () => {
      const queue = AgentService.getOfflineQueue();
      setQueuedMessages(queue.length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update queue count periodically
    const interval = setInterval(updateQueueCount, 1000);
    updateQueueCount(); // Initial check

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const processOfflineQueue = async () => {
    if (isProcessingQueue) return;
    
    setIsProcessingQueue(true);
    try {
      await AgentService.processOfflineQueue();
      setQueuedMessages(0);
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      setIsProcessingQueue(false);
    }
  };

  if (isOnline && queuedMessages === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">
            Offline
            {queuedMessages > 0 && ` - ${queuedMessages} messages queued`}
          </span>
        </>
      ) : queuedMessages > 0 ? (
        <>
          {isProcessingQueue ? (
            <>
              <Send className="w-4 h-4 text-blue-500 animate-pulse" />
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Sending {queuedMessages} queued messages...
              </span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-600 dark:text-amber-400">
                {queuedMessages} messages ready to send
              </span>
              <button
                onClick={processOfflineQueue}
                className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                Send Now
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">
            Online
          </span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;