import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  nome: string;
  cargo: string;
  cod_usuario: number;
  regiao?: string;
}

export type UserRole = 'comercial' | 'regional' | 'nacional' | 'diretor' | 'logistica';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  isManager: boolean;
  isLogistica: boolean;
  login: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signup: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  logout: () => Promise<void>;
}

const roleLabels: Record<string, string> = {
  comercial: 'Executivo Comercial',
  regional: 'Gerente Regional',
  nacional: 'Gerente Nacional',
  diretor: 'Diretor(a)',
  logistica: 'Logística',
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('comercial');

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile and role in parallel
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('nome, regiao')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const userRole = (roleResult.data?.role as UserRole) || 'comercial';
      setRole(userRole);

      setProfile({
        nome: profileResult.data?.nome || 'Usuário',
        cargo: roleLabels[userRole] || 'Executivo Comercial',
        cod_usuario: 1,
        regiao: profileResult.data?.regiao || undefined,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setRole('comercial');
      setProfile({
        nome: 'Usuário',
        cargo: 'Executivo Comercial',
        cod_usuario: 1,
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // If user logged out, clear profile and role
        if (!newSession?.user) {
          setProfile(null);
          setRole('comercial');
          setIsLoading(false);
        } else {
          // Defer Supabase call with setTimeout to prevent deadlock
          setTimeout(() => {
            if (isMounted) {
              fetchUserData(newSession.user.id).finally(() => {
                if (isMounted) setIsLoading(false);
              });
            }
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!isMounted) return;
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchUserData(existingSession.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    return { data };
  };

  const signup = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      return { error };
    }

    return { data };
  };

  const logout = async () => {
    try {
      // Limpar estado local primeiro para feedback imediato
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole('comercial');

      // signOut com scope 'local' funciona sem depender de rede
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const isManager = role === 'regional' || role === 'nacional' || role === 'diretor';
  const isLogistica = role === 'logistica';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        isAuthenticated: !!session,
        isManager,
        isLogistica,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
