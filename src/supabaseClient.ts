import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface GameScore {
  id?: number;
  created_at?: string;
  username: string;
  completion_time: number;
  found_words: string[];
}
