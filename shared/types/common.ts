/**
 * Common TypeScript types shared between frontend and backend
 */

// Base entity interface
export interface BaseEntity {
  id: string | number;
  created_at: string;
  updated_at?: string;
}

// User types
export interface User extends BaseEntity {
  id: string;
  email: string;
  created_at: string;
  last_active?: string;
  path?: string;
  level: number;
  points: number;
  silver_keys: number;
  gold_keys: number;
  last_emotion?: string;
  familiarization_completed: boolean;
  familiarization_completed_at?: string;
  familiarization_answers?: string[];
  primary_path?: string;
  motivation_level?: number;
  main_challenges?: string[];
  support_needs?: string[];
}

// Chat types
export interface ChatMessage extends BaseEntity {
  id: number;
  user_id?: string;
  sender: 'user' | 'lumi';
  content: string;
  timestamp: string;
  path: string;
  emotion?: string;
}

export interface AgentResponse {
  response: string;
  emotion?: string;
  suggestions?: string[];
  error?: string;
}

export interface ChatContext {
  path?: string;
  previous_messages?: Array<{
    sender: string;
    content: string;
    timestamp: string;
  }>;
  user_profile?: {
    level?: number;
    points?: number;
    path?: string;
  };
}

// Labeling types
export interface LabelingTask extends BaseEntity {
  id: number;
  data: Record<string, any>;
  project_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  created_at: string;
  updated_at?: string;
}

export interface LabelingSubmission extends BaseEntity {
  id: number;
  task_id: number;
  annotations: Array<Record<string, any>>;
  created_at: string;
  status: 'submitted' | 'approved' | 'rejected';
}

export interface LabelingProject extends BaseEntity {
  id: number;
  title: string;
  description?: string;
  label_config: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  code?: string;
  timestamp?: string;
}

// Theme types
export type Theme = 'goldtag' | 'silbernacht';

export interface ThemeConfig {
  theme: Theme;
  auto_mode: boolean;
}

// Agent types
export type AgentType = 'main' | 'fitness' | 'nutrition' | 'mental-strength';

export interface AgentConfig {
  name: string;
  personality: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

// Path types
export type PathType = 'main' | 'fitness' | 'nutrition' | 'mental-strength';

export interface PathConfig {
  id: PathType;
  title: string;
  description: string;
  color: string;
  icon: string;
}

// Familiarization types
export interface FamiliarizationStep {
  question: string;
  category: string;
  required: boolean;
}

export interface FamiliarizationResult {
  primary_path: PathType;
  motivation_level: number;
  main_challenges: string[];
  support_needs: string[];
}

// Statistics types
export interface UserStats {
  total_messages: number;
  total_sessions: number;
  current_streak: number;
  favorite_path?: PathType;
  progress_percentage: number;
  last_active?: string;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Rate limiting types
export interface RateLimitInfo {
  remaining_requests: number;
  reset_time: string;
  limit: number;
  window_duration: number;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

// Search types
export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: SearchQuery;
  took: number; // Search time in milliseconds
}