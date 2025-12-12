import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nzsylckcbjelwqtupdru.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56c3lsY2tjYmplbHdxdHVwZHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MDg3OTgsImV4cCI6MjA4MTA4NDc5OH0.hWls-v2oy5oskpeJ55qmHvr7qzBvCqBAYw1tAUhFpao';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
