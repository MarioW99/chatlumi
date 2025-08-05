import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeMessage {
  id: number;
  user_id: string;
  sender: 'user' | 'lumi';
  content: string;
  timestamp: string;
  path: string;
  emotion?: string;
}

export interface RealtimeSubscriptionOptions {
  userId: string;
  path: string;
  onMessage: (message: RealtimeMessage) => void;
  onError?: (error: any) => void;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private channels: Map<string, RealtimeChannel> = new Map();

  private constructor() {}

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to real-time chat messages for a specific user and path
   */
  subscribeToMessages(options: RealtimeSubscriptionOptions): string {
    const { userId, path, onMessage, onError } = options;
    const channelId = `chat_${userId}_${path}`;

    // If already subscribed to this channel, unsubscribe first
    if (this.channels.has(channelId)) {
      this.unsubscribeFromMessages(channelId);
    }

    console.log(`🔄 Subscribing to realtime messages for user ${userId} on path ${path}`);

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId} AND path=eq.${path}`,
        },
        (payload) => {
          console.log('📨 Received realtime message:', payload);
          
          if (payload.new) {
            const message: RealtimeMessage = {
              id: payload.new.id,
              user_id: payload.new.user_id,
              sender: payload.new.sender,
              content: payload.new.content,
              timestamp: payload.new.timestamp,
              path: payload.new.path,
              emotion: payload.new.emotion,
            };
            
            onMessage(message);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Realtime subscription status for ${channelId}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Successfully subscribed to realtime messages for ${channelId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to realtime messages for ${channelId}`);
          onError?.(new Error(`Failed to subscribe to channel ${channelId}`));
        }
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  /**
   * Unsubscribe from real-time messages
   */
  unsubscribeFromMessages(channelId: string): void {
    const channel = this.channels.get(channelId);
    
    if (channel) {
      console.log(`🔄 Unsubscribing from realtime channel: ${channelId}`);
      supabase.removeChannel(channel);
      this.channels.delete(channelId);
      console.log(`✅ Successfully unsubscribed from ${channelId}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeFromAll(): void {
    console.log('🔄 Unsubscribing from all realtime channels');
    
    for (const [channelId, channel] of this.channels.entries()) {
      supabase.removeChannel(channel);
      console.log(`✅ Unsubscribed from ${channelId}`);
    }
    
    this.channels.clear();
  }

  /**
   * Get the status of a specific subscription
   */
  getSubscriptionStatus(channelId: string): string | null {
    const channel = this.channels.get(channelId);
    return channel ? channel.state : null;
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }
}

export const realtimeService = RealtimeService.getInstance();