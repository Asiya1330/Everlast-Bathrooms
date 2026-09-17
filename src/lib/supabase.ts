import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const ATTACHMENTS_BUCKET = 'service-call-media';
