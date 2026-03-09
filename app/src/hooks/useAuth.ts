import { useAuthStore } from '@/features/auth/auth.store';

// Adapter to maintain compatibility with existing components
export function useAuth() {
  const store = useAuthStore();

  return {
    user: store.user,
    effectiveUser: store.getEffectiveUser(), // User for data filtering (impersonated if active)
    session: store.accessToken ? { access_token: store.accessToken } : null, // Mock session object for compatibility
    profile: store.user ? {
      nome: store.user.name,
      cargo: store.user.role === 'comercial' ? 'Executivo Comercial' : store.user.role,
      cod_usuario: 1, // Mock
      regiao: 'Região Exemplo', // Mock or derived from user
    } : null,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    isLoggingIn: store.isLoggingIn,
    isImpersonating: store.isImpersonating,
    impersonatedUser: store.impersonatedUser,

    // Map actions
    login: async (email, password) => {
      const result = await store.login({ email, password });
      if (!result.success) {
        return { error: { message: result.error } };
      }
      return { data: store.user };
    },

    signup: async () => {
      console.warn("Signup not implemented in new API adapter");
      return { error: { message: "Signup disabled" } };
    },

    logout: async () => {
      store.logout();
    },
  };
}
