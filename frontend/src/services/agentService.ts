import { supabase } from '../lib/supabaseClient';
import { validateMessage, sanitizeInput, rateLimit } from '../utils/security';

export type AgentType = 'main' | 'fitness' | 'nutrition' | 'mental-strength';

// Agent function name mapping
const AGENT_FUNCTION_NAMES: Record<AgentType, string> = {
  main: 'lumi-main-agent',
  fitness: 'lumi-fitness-agent',
  nutrition: 'lumi-nutrition-agent',
  'mental-strength': 'lumi-mental-strength-agent'
};

// Get the base URL for Supabase Functions from environment variables
const getSupabaseFunctionsBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_BASE_URL;
  if (!baseUrl) {
    console.error('VITE_SUPABASE_FUNCTIONS_BASE_URL is not defined in environment variables');
    throw new Error('Supabase Functions base URL is not configured');
  }
  return baseUrl;
};

// Build the full endpoint URL for an agent
const buildAgentEndpoint = (agentType: AgentType): string => {
  const baseUrl = getSupabaseFunctionsBaseUrl();
  const functionName = AGENT_FUNCTION_NAMES[agentType];
  return `${baseUrl}/${functionName}`;
};

export interface AgentRequest {
  message: string;
  userId?: string;
  context?: {
    path?: string;
    previousMessages?: Array<{
      sender: string;
      content: string;
      timestamp: string;
    }>;
    userProfile?: {
      level?: number;
      points?: number;
      path?: string;
    };
  };
}

export interface AgentResponse {
  response: string;
  emotion?: string;
  suggestions?: string[];
  error?: string;
}

// Cache management
class MessageCache {
  private cache = new Map<string, { data: AgentResponse; timestamp: number }>();
  private maxAge = parseInt(import.meta.env.VITE_MESSAGE_CACHE_DURATION || '300000'); // 5 minutes

  set(key: string, data: AgentResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): AgentResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Offline message queue
class OfflineMessageQueue {
  private queue: Array<{ message: string; agentType: AgentType; timestamp: number }> = [];
  private readonly storageKey = 'offline_message_queue';

  constructor() {
    this.loadQueue();
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load offline message queue:', error);
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to save offline message queue:', error);
    }
  }

  addMessage(message: string, agentType: AgentType): void {
    this.queue.push({ message, agentType, timestamp: Date.now() });
    this.saveQueue();
  }

  getMessages(): Array<{ message: string; agentType: AgentType; timestamp: number }> {
    return [...this.queue];
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }

  removeMessage(index: number): void {
    this.queue.splice(index, 1);
    this.saveQueue();
  }
}

export class AgentService {
  private static messageCache = new MessageCache();
  private static offlineQueue = new OfflineMessageQueue();
  private static retryAttempts = 3;
  private static retryDelay = 1000;
  private static pendingRequests = new Map<string, Promise<AgentResponse>>();

  private static async callAgentWithRetry(
    agentType: AgentType,
    request: AgentRequest
  ): Promise<AgentResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Use the unified lumi-ai-agent Edge Function instead of individual agent endpoints
        const baseUrl = getSupabaseFunctionsBaseUrl();
        const endpoint = `${baseUrl}/lumi-ai-agent`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            message: request.message,
            agent_type: agentType,
            path: request.context?.path || agentType,
            context: request.context
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Agent request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retryAttempts) {
          console.warn(`Agent call failed (attempt ${attempt}/${this.retryAttempts}), retrying...`, error);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    console.error(`Agent call failed after ${this.retryAttempts} attempts:`, lastError);
    return {
      response: "I'm having trouble connecting right now. Please try again in a moment.",
      error: lastError instanceof Error ? lastError.message : 'Unknown error'
    };",
      error: lastError instanceof Error ? lastError.message : 'Unknown error'
    };
  }

  private static async saveMessage(
    userId: string | null,
    sender: 'user' | 'lumi',
    content: string,
    path: string
  ): Promise<void> {
    try {
      // Only save messages if user is authenticated
      if (!userId) return;

      const { error } = await supabase.getClient()
        .from('chat_messages')
        .insert({
          user_id: userId,
          sender,
          content,
          path,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving message:', error);
        throw new Error(`Failed to save message: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  private static async getRecentMessages(
    userId: string | null,
    path: string,
    limit: number = 10
  ): Promise<Array<{ sender: string; content: string; timestamp: string }>> {
    try {
      // Only fetch messages if user is authenticated
      if (!userId) return [];

      const { data, error } = await supabase.getClient()
        .from('chat_messages')
        .select('sender, content, timestamp')
        .eq('user_id', userId)
        .eq('path', path)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent messages:', error);
        return [];
      }

      return (data || []).reverse(); // Reverse to get chronological order
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      return [];
    }
  }

  public static async sendMessage(
    message: string,
    agentType: AgentType,
    options: {
      userId?: string;
      path?: string;
      includeContext?: boolean;
      useCache?: boolean;
    } = {}
  ): Promise<AgentResponse> {
    const { 
      userId = null, 
      path = agentType, 
      includeContext = true,
      useCache = true
    } = options;

    try {
      // Sanitize and validate input
      const sanitizedMessage = sanitizeInput(message);
      const validation = validateMessage(sanitizedMessage);
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check rate limiting
      const rateLimitKey = `sendMessage:${userId || 'anonymous'}`;
      if (!rateLimit.checkLimit(rateLimitKey, 10, 60000)) {
        throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
      }

      // Create request key for deduplication
      const requestKey = `${agentType}:${sanitizedMessage}:${userId || 'anonymous'}`;

      // Check if request is already in progress
      if (this.pendingRequests.has(requestKey)) {
        console.log('🔄 Request already in progress, waiting for completion...');
        return await this.pendingRequests.get(requestKey)!;
      }

      // Check cache first
      if (useCache) {
        const cacheKey = requestKey;
        const cached = this.messageCache.get(cacheKey);
        if (cached) {
          console.log('Using cached response for:', message.substring(0, 50));
          return cached;
        }
      }

      // Check if offline
      if (!navigator.onLine) {
        this.offlineQueue.addMessage(message, agentType);
        return {
          response: "You're currently offline. Your message has been queued and will be sent when you're back online.",
          error: 'offline'
        };
      }

      // Create the request promise and store it for deduplication
      const requestPromise = (async () => {
        try {
                  // Save user message first (only if authenticated)
        await this.saveMessage(userId, 'user', sanitizedMessage, path);

      // Get recent conversation context if requested and user is authenticated
      let context: AgentRequest['context'] = { path };
      
      if (includeContext && userId) {
        const recentMessages = await this.getRecentMessages(userId, path, 5);
        context.previousMessages = recentMessages;

        // Get user profile for additional context
        const { data: userProfile } = await supabase.getClient()
          .from('users')
          .select('level, points, path')
          .eq('id', userId)
          .single();

        if (userProfile) {
          context.userProfile = userProfile;
        }
      }

      // Call the appropriate agent
              const agentRequest: AgentRequest = {
          message: sanitizedMessage,
          userId: userId || undefined,
          context
        };

      const agentResponse = await this.callAgentWithRetry(agentType, agentRequest);

      // Save agent response (only if authenticated and no error)
      if (!agentResponse.error && agentResponse.response) {
        await this.saveMessage(userId, 'lumi', agentResponse.response, path);
      }

      // Cache the response
      if (useCache && !agentResponse.error) {
        const cacheKey = requestKey;
        this.messageCache.set(cacheKey, agentResponse);
      }

      return agentResponse;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      // If it's a validation error, return it directly
      if (error instanceof Error && (error.message.includes('cannot be empty') || error.message.includes('too long') || error.message.includes('unsafe content'))) {
        return {
          response: "I couldn't process that message. Please check your input and try again.",
          error: error.message
        };
      }

      return {
        response: "I'm experiencing some technical difficulties. Please try again.",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(requestKey);
    }
  })();

  // Store the request promise for deduplication
  this.pendingRequests.set(requestKey, requestPromise);

  return await requestPromise;
}

  public static async getChatHistory(
    userId: string,
    path: string,
    limit: number = 50
  ): Promise<Array<{
    id: number;
    sender: string;
    content: string;
    timestamp: string;
  }>> {
    try {
      const { data, error } = await supabase.getClient()
        .from('chat_messages')
        .select('id, sender, content, timestamp')
        .eq('user_id', userId)
        .eq('path', path)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  // Offline queue management
  public static getOfflineQueue(): Array<{ message: string; agentType: AgentType; timestamp: number }> {
    return this.offlineQueue.getMessages();
  }

  public static async processOfflineQueue(): Promise<void> {
    if (!navigator.onLine) return;

    const messages = this.offlineQueue.getMessages();
    if (messages.length === 0) return;

    console.log(`Processing ${messages.length} offline messages...`);

    for (let i = 0; i < messages.length; i++) {
      const { message, agentType } = messages[i];
      try {
        await this.sendMessage(message, agentType, { useCache: false });
        this.offlineQueue.removeMessage(i);
        i--; // Adjust index after removal
      } catch (error) {
        console.error('Failed to process offline message:', error);
      }
    }
  }

  public static clearCache(): void {
    this.messageCache.clear();
  }

  public static clearOfflineQueue(): void {
    this.offlineQueue.clearQueue();
  }

  // Health check
  public static async healthCheck(): Promise<boolean> {
    try {
      const response = await this.sendMessage('health check', 'main', { 
        includeContext: false, 
        useCache: false 
      });
      return !response.error;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}