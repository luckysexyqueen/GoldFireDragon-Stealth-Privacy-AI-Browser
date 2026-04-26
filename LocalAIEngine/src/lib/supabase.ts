import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching DB schema
export interface DBChatSession {
  id: string;
  title: string;
  engine_type: string | null;
  model_id: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  meta: Record<string, unknown>;
}

export interface DBChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  engine: string | null;
  model: string | null;
  token_count: number | null;
  timestamp: number;
  created_at: string;
}

export interface DBModelProfile {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  repetition_penalty: number;
  stream: boolean;
  stop_sequences: string[];
  created_at: string;
  updated_at: string;
}

export interface DBRagDocument {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  storage_path: string | null;
  content: string | null;
  chunk_count: number;
  created_at: string;
  meta: Record<string, unknown>;
}

export interface DBGgufUpload {
  id: string;
  name: string;
  display_name: string;
  file_size: number;
  storage_path: string;
  quantization: string | null;
  description: string | null;
  download_url: string | null;
  created_at: string;
}
