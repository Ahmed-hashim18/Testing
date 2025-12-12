import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { User } from '@/types/user';
import { Role } from '@/types/role';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function with timeout (reduced for faster loading)
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
};

// Faster timeout values
const FAST_TIMEOUT = 3000; // 3 seconds for critical operations
const INIT_TIMEOUT = 5000; // 5 seconds max for initialization

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create basic user from session data
  const createBasicUser = (authUser: { id: string; email?: string }): User => ({
    id: authUser.id,
    name: authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    role: 'viewer',
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  const fetchUserProfile = async (userId: string, userEmail?: string): Promise<void> => {
    try {
      // Create basic user immediately so app is usable even if profile fetch fails
      const basicUser = createBasicUser({ id: userId, email: userEmail });
      
      // Try to fetch profile - with better error handling
      let profile = null;
      let userRole = null;
      
      try {
        const profileResult = await supabase
          .from('profiles')
          .select('id, name, email, status, avatar_url, created_at')
          .eq('id', userId)
          .maybeSingle();
        
        if (profileResult.error) {
          console.warn('Profile fetch error:', profileResult.error.message);
        } else {
          profile = profileResult.data;
        }
      } catch (e) {
        console.warn('Profile fetch failed:', e);
      }
      
      try {
        const roleResult = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (roleResult.error) {
          console.warn('Role fetch error:', roleResult.error.message);
        } else {
          userRole = roleResult.data;
        }
      } catch (e) {
        console.warn('Role fetch failed:', e);
      }

      // Build user from available data
      // SECURITY: Default to 'viewer' (least privilege) if role fetch fails
      const userData: User = {
        id: userId,
        name: profile?.name || userEmail?.split('@')[0] || 'User',
        email: profile?.email || userEmail || '',
        role: userRole?.role || 'viewer',
        status: profile?.status || 'active',
        avatar: profile?.avatar_url || undefined,
        createdAt: profile?.created_at || new Date().toISOString(),
      };
      
      console.log('User profile loaded:', userData);
      setUser(userData);

      // Fetch role details in background (non-blocking, skip if fails)
      if (userRole?.role) {
        supabase
          .from('roles')
          .select('*')
          .eq('role_type', userRole.role)
          .maybeSingle()
          .then(({ data: roleData }) => {
            if (roleData) {
              setRole({
                id: roleData.id,
                name: roleData.name,
                roleType: roleData.role_type,
                description: roleData.description || '',
                permissions: [],
                userCount: 0,
                isSystemRole: roleData.is_system_role || false,
                createdAt: roleData.created_at,
              });
            }
          })
          .catch(() => {}); // Ignore errors for non-critical data
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Still set a basic user so the app works
      setUser(createBasicUser({ id: userId, email: userEmail }));
    }
  };

  useEffect(() => {
    let mounted = true;
    let initTimeout: ReturnType<typeof setTimeout> | null = null;
    let initComplete = false; // Track if initialization completed successfully
    let sessionChecked = false; // Track if session check completed

    const initializeAuth = async () => {
      try {
        // Get current session - this is critical and must complete FIRST
        // Use a separate timeout for just the session check
        let currentSession = null;
        try {
          const { data, error } = await withTimeout(
            supabase.auth.getSession(),
            FAST_TIMEOUT
          );
          
          if (!error) {
            currentSession = data.session;
          } else {
            console.error('Error getting session:', error);
          }
        } catch (sessionError) {
          console.error('Session check timed out or failed:', sessionError);
        }
        
        // Mark that we've completed the session check (update closure variable)
        // This must be set BEFORE setting the timeout to prevent race conditions
        sessionChecked = true;
        
        if (!mounted) {
          return;
        }

        // Set a maximum timeout for the profile fetching process
        // This timeout only applies AFTER session check completes
        // Note: We use initComplete flag instead of isLoading state to avoid stale closure issues
        initTimeout = setTimeout(() => {
          // Double-check mounted and initComplete right before state update to prevent race conditions
          if (mounted && !initComplete && sessionChecked) {
            // Only proceed if we've at least checked the session but init hasn't completed
            console.warn('Auth initialization timeout, proceeding without full user profile');
            // Final check before state update to prevent updates after unmount
            if (mounted) {
              setIsLoading(false);
            }
          }
        }, INIT_TIMEOUT);

        // Always set session state (even if null) - this is the source of truth
        setSession(currentSession);

        if (currentSession?.user) {
          // Profile fetching can timeout, but we already have a valid session
          await fetchUserProfile(currentSession.user.id, currentSession.user.email);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        initComplete = true; // Mark init as complete to prevent timeout from firing
        if (initTimeout) {
          clearTimeout(initTimeout);
          initTimeout = null;
        }
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        setSession(newSession);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
        } else if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Update last login timestamp on sign in
          if (event === 'SIGNED_IN') {
            await supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', newSession.user.id)
              .catch(() => {}); // Don't block if this fails
          }
          await fetchUserProfile(newSession.user.id, newSession.user.email);
        }
      }
    );

    return () => {
      mounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
        initTimeout = null;
      }
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login auth error:', error);
        return { error: error.message };
      }

      console.log('Auth successful, user:', data.user?.id);

      if (data.user) {
        setSession(data.session);
        
        // Fetch user profile immediately and wait for it to complete
        // This ensures admin permissions are available right away
        try {
          await fetchUserProfile(data.user.id, data.user.email);
        } catch (error) {
          console.warn('Failed to fetch user profile during login, using basic user:', error);
          // Fallback to basic user if profile fetch fails
          const basicUser: User = {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            role: 'viewer', // Default to least privilege if fetch fails
            status: 'active',
            createdAt: new Date().toISOString(),
          };
          setUser(basicUser);
        }
      }

      return {};
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error?.message || 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            email: email,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Note: Role assignment is handled by the database trigger (handle_new_user)
        // First user gets 'admin', subsequent users get 'viewer'
        
        if (data.session) {
          setSession(data.session);
          await fetchUserProfile(data.user.id, data.user.email);
        }
      }

      return {};
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRole(null);
      setSession(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, session, login, signup, logout, resetPassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

