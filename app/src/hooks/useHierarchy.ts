import { useState, useEffect, useCallback } from 'react';
import { http } from '@/shared/api/http';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { UserRole } from './useUserRole';

interface HierarchyRelation {
  id: string | number;
  manager_id: string;
  subordinate_id: string;
  manager_nome: string;
  subordinate_nome: string;
}

export function useHierarchy() {
  const { user } = useAuth();
  const [hierarchy, setHierarchy] = useState<HierarchyRelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHierarchy = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data } = await http.get('/hierarchy');
      setHierarchy(data || []);
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
      setHierarchy([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const addSubordinate = async (managerId: string, subordinateId: string): Promise<boolean> => {
    try {
      await http.post('/hierarchy', {
        manager_id: managerId,
        subordinate_id: subordinateId,
      });

      toast.success('Subordinado adicionado com sucesso!');
      await fetchHierarchy();
      return true;
    } catch (err: any) {
      console.error('Error adding subordinate:', err);
      if (err.response?.status === 409) {
        toast.error('Este subordinado já está vinculado a este gestor');
      } else {
        toast.error('Erro ao adicionar subordinado');
      }
      return false;
    }
  };

  const removeSubordinate = async (relationId: string | number): Promise<boolean> => {
    try {
      await http.delete(`/hierarchy/${relationId}`);

      toast.success('Subordinado removido com sucesso!');
      await fetchHierarchy();
      return true;
    } catch (err) {
      console.error('Error removing subordinate:', err);
      toast.error('Erro ao remover subordinado');
      return false;
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      await http.put(`/users/${userId}`, { role: newRole });

      toast.success('Cargo atualizado com sucesso!');
      return true;
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Erro ao atualizar cargo');
      return false;
    }
  };

  return { hierarchy, isLoading, addSubordinate, removeSubordinate, updateUserRole, refetch: fetchHierarchy };
}

