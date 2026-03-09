import { useState, useEffect } from 'react';
import { User as UserIcon, X, Users } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { usersService } from '@/features/auth/users.service';
import { User } from '@/features/auth/auth.schemas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function UserImpersonationSelector() {
  const { user, impersonatedUser, isImpersonating, startImpersonation, stopImpersonation } = useAuthStore();
  const [commercialUsers, setCommercialUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Only show for admin users
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchCommercialUsers();
    }
  }, [isAdmin]);

  const fetchCommercialUsers = async () => {
    setLoading(true);
    try {
      console.log('[Impersonation] Fetching commercial users...');
      const users = await usersService.getCommercialUsers();
      console.log('[Impersonation] Fetched users:', users);
      setCommercialUsers(users);
    } catch (error: any) {
      console.error('[Impersonation] Error fetching commercial users:', error);
      console.error('[Impersonation] Response:', error.response);
      toast.error(`Erro ao carregar usuários: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    const selectedUser = commercialUsers.find(u => u.id === userId);
    if (selectedUser) {
      startImpersonation(selectedUser);
      // Invalidate all queries to force refetch with new user
      queryClient.invalidateQueries();
      toast.success(`Visualizando como: ${selectedUser.name}`);
    }
  };

  const handleStopImpersonation = () => {
    stopImpersonation();
    // Invalidate all queries to force refetch with admin user
    queryClient.invalidateQueries();
    toast.info('Voltou ao modo admin');
  };

  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-card">
      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />

      {isImpersonating && impersonatedUser ? (
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900 rounded text-sm flex-1">
            <UserIcon className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            <span className="font-medium text-amber-900 dark:text-amber-100">
              {impersonatedUser.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStopImpersonation}
            className="h-8 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Select onValueChange={handleSelectUser} disabled={loading}>
          <SelectTrigger className="flex-1 h-8">
            <SelectValue placeholder={loading ? "Carregando..." : "Ver como outro usuário"} />
          </SelectTrigger>
          <SelectContent>
            {commercialUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
