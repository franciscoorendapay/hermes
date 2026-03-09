import { useAuthStore } from '@/features/auth/auth.store';

// Define the UserRole type (mocked or imported if you have it in schemas.ts)
// For now, mirroring what was likely there or in schemas
export const USER_ROLES = {
  ADMIN: 'admin',
  DIRETOR: 'diretor',
  NACIONAL: 'nacional',
  REGIONAL: 'regional',
  COMERCIAL: 'comercial',
  LOGISTICA: 'logistica',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

interface UserRoleData {
  role: UserRole;
  isManager: boolean;
  isLogistica: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useUserRole(): UserRoleData {
  const { user, isLoading } = useAuthStore();

  // Default to 'comercial' if no user
  const role = (user?.role as UserRole) || 'comercial';

  const isManager = role === 'regional' || role === 'nacional' || role === 'diretor';
  const isLogistica = role === 'logistica';
  const isAdmin = role === 'admin';

  return {
    role,
    isManager,
    isLogistica,
    isAdmin,
    isLoading,
  };
}
