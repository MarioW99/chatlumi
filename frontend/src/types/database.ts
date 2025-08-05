export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          level: number;
          points: number;
          path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          level?: number;
          points?: number;
          path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          level?: number;
          points?: number;
          path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: number;
          user_id: string;
          sender: 'user' | 'lumi';
          content: string;
          path: string;
          emotion?: string;
          timestamp: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          sender: 'user' | 'lumi';
          content: string;
          path: string;
          emotion?: string;
          timestamp?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          sender?: 'user' | 'lumi';
          content?: string;
          path?: string;
          emotion?: string;
          timestamp?: string;
        };
      };
      agents: {
        Row: {
          id: number;
          name: string;
          type: string;
          configuration: any;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          type: string;
          configuration?: any;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          type?: string;
          configuration?: any;
          created_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: number;
          user_id: string;
          path: string;
          level: number;
          experience_points: number;
          achievements: any;
          last_activity: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          path: string;
          level?: number;
          experience_points?: number;
          achievements?: any;
          last_activity?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          path?: string;
          level?: number;
          experience_points?: number;
          achievements?: any;
          last_activity?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: number;
          user_id: string;
          session_start: string;
          session_end?: string;
          messages_count: number;
          paths_visited: string[];
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          session_start?: string;
          session_end?: string;
          messages_count?: number;
          paths_visited?: string[];
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          session_start?: string;
          session_end?: string;
          messages_count?: number;
          paths_visited?: string[];
          created_at?: string;
        };
      };
      labeling_tasks: {
        Row: {
          id: number;
          user_id: string;
          task_type: string;
          data: any;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          task_type: string;
          data?: any;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          task_type?: string;
          data?: any;
          status?: string;
          created_at?: string;
        };
      };
      labeling_submissions: {
        Row: {
          id: number;
          task_id: number;
          user_id: string;
          result: any;
          created_at: string;
        };
        Insert: {
          id?: number;
          task_id: number;
          user_id: string;
          result: any;
          created_at?: string;
        };
        Update: {
          id?: number;
          task_id?: number;
          user_id?: string;
          result?: any;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 