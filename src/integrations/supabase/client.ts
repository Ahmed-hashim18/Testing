import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hlfnmnyobvxddoksnaev.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsZm5tbnlvYnZ4ZGRva3NuYWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTkzODUsImV4cCI6MjA4MDg5NTM4NX0.ZrxJlc-QOofY6DpVwdN6nTguEZ5smQkvYq00aJHCTGY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
