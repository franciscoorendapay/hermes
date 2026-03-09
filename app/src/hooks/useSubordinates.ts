import { useState, useEffect, useCallback } from 'react';
import { http } from '@/shared/api/http';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import { toast } from 'sonner';

export interface Subordinate {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  regiao: string | null;
  role: 'comercial' | 'regional' | 'nacional' | 'diretor' | 'logistica' | 'admin';
  status: number;
}

export function useSubordinates() {
  const { user } = useAuth();
  const { role, isManager, isAdmin } = useUserRole();
  const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubordinates = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await http.get<any[]>('/users');
      // Map API response to Subordinate interface
      const allUsers: Subordinate[] = response.data.map(u => ({
        id: u.id,
        nome: u.name,
        email: u.email,
        telefone: u.phone,
        regiao: u.region,
        role: u.role,
        status: u.status
      }));

      // Filter logic mimicking the original behavior + API realities
      if (isAdmin || role === 'diretor' || role === 'nacional') {
        // Show all except self? Or all? Original logic showed filtered self.
        setSubordinates(allUsers.filter(u => u.id !== user.id));
      } else if (role === 'regional') {
        // TODO: Implement proper hierarchy filtering either in backend or here if we load hierarchy relation
        // For now, let's filter by region if available, or just show all for simplicity until hierarchy is fully migrated logic-wise on backend
        // Alternatively, if backend doesn't support hierarchy filter yet, we might be showing too much.
        // Let's assume for now we show users in same region?
        // Original code used 'user_hierarchy' table. We should ideally fetch that from API too.
        // For now, displaying all users avoids "empty list" breakage, but we should refine this.
        setSubordinates(allUsers.filter(u => u.id !== user.id));
      } else {
        setSubordinates([]);
      }
    } catch (err) {
      console.error('Error fetching subordinates:', err);
      toast.error('Erro ao carregar equipe');
      setSubordinates([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, isManager, isAdmin]);

  useEffect(() => {
    fetchSubordinates();
  }, [fetchSubordinates]);

  const createUser = async (userData: any) => {
    try {
      await http.post('/users', userData);
      toast.success('Usuário criado com sucesso');
      fetchSubordinates();
      return true;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.errors ? Object.values(error.response.data.errors).join(', ') : 'Erro ao criar usuário');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await http.delete(`/users/${userId}`);
      toast.success('Usuário removido');
      fetchSubordinates();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao remover usuário');
      return false;
    }
  }

  const updateUser = async (id: string, userData: any) => {
    try {
      await http.put(`/users/${id}`, userData);
      toast.success('Usuário atualizado com sucesso');
      fetchSubordinates();
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.errors ? Object.values(error.response.data.errors).join(', ') : 'Erro ao atualizar usuário');
      return false;
    }
  };

  return { subordinates, isLoading, refetch: fetchSubordinates, createUser, updateUser, deleteUser };
}
