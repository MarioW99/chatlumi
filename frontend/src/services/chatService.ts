import { apiClient } from '../lib/api';
import { realtimeService } from './realtimeService';

export interface ChatMessage {
  id: number;
  sender: 'user' | 'lumi';
  content: string;
  timestamp: Date;
  emotion?: string;
  path?: string;
}

export interface AgentResponse {
  response: string;
  emotion?: string;
  suggestions?: string[];
  agent_type: string;
}

export interface ChatContext {
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
}

export class ChatService {
  private static instance: ChatService;
  private authToken?: string;

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = undefined;
    // Clean up any active realtime subscriptions when auth is cleared
    realtimeService.unsubscribeFromAll();
  }

  async sendMessage(
    message: string,
    agentType: string = 'main',
    options: {
      path?: string;
      context?: ChatContext;
    } = {}
  ): Promise<AgentResponse> {
    try {
      const response = await apiClient.sendMessage(
        message,
        agentType,
        {
          ...options,
          token: this.authToken,
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data as AgentResponse;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getChatHistory(
    path: string = 'main',
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.getChatHistory(path, limit, this.authToken);

      if (response.error) {
        throw new Error(response.error);
      }

      return (response.data || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  async clearChatHistory(path?: string): Promise<void> {
    try {
      const response = await apiClient.clearChatHistory(path, this.authToken);

      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }

  // Fallback method for when backend is not available
  async sendMessageFallback(
    message: string,
    agentType: string = 'main'
  ): Promise<AgentResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const fallbackResponses = {
      main: [
        "I'm here to support you on your journey. How are you feeling today?",
        "Thank you for sharing that with me. What would you like to explore together?",
        "I can sense your dedication. Let's work on this step by step.",
        "Your growth mindset is inspiring. What's your next goal?"
      ],
      fitness: [
        "Let's get moving! What kind of workout are you in the mood for today?",
        "Your strength is growing every day. How did your last workout feel?",
        "Remember, consistency beats perfection. What's your fitness goal this week?",
        "I believe in your potential! Let's create a workout plan that excites you."
      ],
      nutrition: [
        "Nourishing your body is an act of self-love. What are you curious about?",
        "Every healthy choice you make is a step toward your best self. How can I help?",
        "Let's explore what makes you feel energized and satisfied. What sounds good?",
        "Your body deserves the best fuel. What nutritional goals are you working on?"
      ],
      'mental-strength': [
        "Your mental strength is like a muscle - it grows with practice. How are you feeling?",
        "I'm here to listen and support you. What's on your mind today?",
        "Every challenge is an opportunity to grow stronger. What would help you right now?",
        "Your resilience inspires me. Let's work through this together."
      ]
    };

    const responses = fallbackResponses[agentType as keyof typeof fallbackResponses] || fallbackResponses.main;
    const response = responses[Math.floor(Math.random() * responses.length)];

    return {
      response,
      emotion: 'supportive',
      agent_type: agentType,
      suggestions: [
        "Tell me more about that",
        "How does that make you feel?",
        "What would help you right now?",
        "Let's explore this together"
      ]
    };
  }
}

export const chatService = ChatService.getInstance();