import { useEffect, useRef, useCallback } from 'react';
import { realtimeService, RealtimeMessage } from '../services/realtimeService';
import { useAuth } from './useAuth';

interface UseRealtimeChatOptions {
  path: string;
  onMessage: (message: RealtimeMessage) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

export const useRealtimeChat = ({
  path,
  onMessage,
  onError,
  enabled = true
}: UseRealtimeChatOptions) => {
  const { user } = useAuth();
  const channelIdRef = useRef<string | null>(null);
  const isSubscribedRef = useRef(false);

  const subscribe = useCallback(() => {
    if (!user || !enabled || isSubscribedRef.current) {
      return;
    }

    console.log(`🔄 Setting up realtime subscription for path: ${path}`);

    try {
      const channelId = realtimeService.subscribeToMessages({
        userId: user.id,
        path,
        onMessage: (message) => {
          console.log('📨 Realtime message received in hook:', message);
          onMessage(message);
        },
        onError: (error) => {
          console.error('❌ Realtime error in hook:', error);
          onError?.(error);
        }
      });

      channelIdRef.current = channelId;
      isSubscribedRef.current = true;
      console.log(`✅ Realtime subscription established: ${channelId}`);
    } catch (error) {
      console.error('❌ Failed to establish realtime subscription:', error);
      onError?.(error);
    }
  }, [user, path, onMessage, onError, enabled]);

  const unsubscribe = useCallback(() => {
    if (channelIdRef.current && isSubscribedRef.current) {
      console.log(`🔄 Cleaning up realtime subscription: ${channelIdRef.current}`);
      realtimeService.unsubscribeFromMessages(channelIdRef.current);
      channelIdRef.current = null;
      isSubscribedRef.current = false;
    }
  }, []);

  // Subscribe when user is available and enabled
  useEffect(() => {
    if (user && enabled) {
      subscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [user, enabled, subscribe, unsubscribe]);

  // Cleanup on path change
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [path, unsubscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    isSubscribed: isSubscribedRef.current,
    channelId: channelIdRef.current,
    subscribe,
    unsubscribe
  };
};