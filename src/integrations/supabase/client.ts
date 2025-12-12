import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yhwwalxtxzzgpprswqpm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlod3dhbHh0eHp6Z3BwcnN3cXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDMzNTYsImV4cCI6MjA4MTExOTM1Nn0.shHjTBS9-CdlhculohVKthGV2TrYWiJFJu_aTMVa9JU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
