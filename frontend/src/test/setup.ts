import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('import.meta.env', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_SUPABASE_FUNCTIONS_BASE_URL: 'https://test.supabase.co/functions/v1',
    VITE_API_BASE_URL: 'http://localhost:8000',
    VITE_ENABLE_OFFLINE_MODE: 'true',
    VITE_ENABLE_ANALYTICS: 'false',
    VITE_ENABLE_DEBUG_MODE: 'true',
    VITE_MESSAGE_CACHE_DURATION: '300000',
    VITE_MAX_MESSAGE_LENGTH: '2000',
    DEV: true
  }
}));

// Mock Supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    getClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        auth: {
          getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null }))
        }
      })),
      healthCheck: vi.fn(() => Promise.resolve(true)),
      clearCache: vi.fn(),
      getClient: vi.fn()
    })
  }
}));

// Mock AgentService
vi.mock('../services/agentService', () => ({
  AgentService: {
    sendMessage: vi.fn(() => Promise.resolve({
      response: 'Test response',
      emotion: 'supportive',
      suggestions: ['Test suggestion']
    })),
    getChatHistory: vi.fn(() => Promise.resolve([])),
    getOfflineQueue: vi.fn(() => []),
    processOfflineQueue: vi.fn(() => Promise.resolve()),
    clearCache: vi.fn(),
    clearOfflineQueue: vi.fn(),
    healthCheck: vi.fn(() => Promise.resolve(true))
  }
}));

// Mock realtime service
vi.mock('../services/realtimeService', () => ({
  RealtimeService: {
    subscribe: vi.fn(() => ({
      unsubscribe: vi.fn()
    }))
  }
}));

// Mock performance tracking
vi.mock('../hooks/usePerformanceTracking', () => ({
  usePerformanceTracking: vi.fn(() => ({
    trackOperation: vi.fn(),
    getMetrics: vi.fn(() => []),
    clearMetrics: vi.fn(),
    getAverageResponseTime: vi.fn(() => 0),
    getSuccessRate: vi.fn(() => 100)
  })),
  useAsyncOperationTracking: vi.fn(() => ({
    trackAsyncOperation: vi.fn((operation, fn) => fn())
  })),
  useRenderTracking: vi.fn(),
  useInteractionTracking: vi.fn(() => ({
    trackInteraction: vi.fn()
  })),
  PerformanceMonitorComponent: vi.fn(() => null)
}));

// Mock authentication
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    needsFamiliarization: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshUserProfile: vi.fn(() => Promise.resolve())
  }))
}));

// Mock theme context
vi.mock('../context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    theme: 'goldtag',
    toggleTheme: vi.fn(),
    setTheme: vi.fn()
  })),
  ThemeProvider: vi.fn(({ children }) => children)
}));

// Mock rate limit hook
vi.mock('../hooks/useRateLimit', () => ({
  useRateLimit: vi.fn(() => ({
    isLimited: false,
    remainingRequests: 100,
    resetTime: Date.now() + 60000
  }))
}));

// Mock realtime chat hook
vi.mock('../hooks/useRealtimeChat', () => ({
  useRealtimeChat: vi.fn(() => {})
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null;
    return {
      message: () => `expected ${received} to be in the document`,
      pass,
    };
  },
  toHaveClass(received, className) {
    const pass = received.classList.contains(className);
    return {
      message: () => `expected ${received} to have class ${className}`,
      pass,
    };
  },
});

// Test utilities
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  level: 1,
  points: 0,
  path: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockMessage = {
  id: 1,
  sender: 'user' as const,
  content: 'Test message',
  timestamp: new Date(),
  emotion: 'neutral'
};

export const mockAgentResponse = {
  response: 'Test response from Lumi',
  emotion: 'supportive',
  suggestions: ['Tell me more', 'How are you feeling?'],
  error: undefined
};

// Helper function to wait for async operations
export const waitFor = (callback: () => void, timeout = 1000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for condition: ${error}`));
        } else {
          setTimeout(check, 10);
        }
      }
    };
    
    check();
  });
};

// Helper function to mock API responses
export const mockApiResponse = (url: string, response: any) => {
  (global.fetch as any).mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response))
    })
  );
};

// Helper function to mock API errors
export const mockApiError = (url: string, error: any) => {
  (global.fetch as any).mockImplementationOnce(() =>
    Promise.resolve({
      ok: false,
      status: error.status || 500,
      statusText: error.statusText || 'Internal Server Error',
      text: () => Promise.resolve(error.message || 'Unknown error')
    })
  );
};