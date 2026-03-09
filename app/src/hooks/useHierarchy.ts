import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { UserRole } from './useUserRole';

interface HierarchyRelation {
  id: string;
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
      const { data, error } = await supabase
        .from('user_hierarchy')
        .select('id, manager_id, subordinate_id');

      if (error) throw error;

      // Buscar profiles para os nomes
      const allUserIds = [...new Set([
        ...(data?.map(h => h.manager_id) || []),
        ...(data?.map(h => h.subordinate_id) || []),
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', allUserIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.nome]) || []);

      const relations = data?.map(h => ({
        id: h.id,
        manager_id: h.manager_id,
        subordinate_id: h.subordinate_id,
        manager_nome: profilesMap.get(h.manager_id) || 'Desconhecido',
        subordinate_nome: profilesMap.get(h.subordinate_id) || 'Desconhecido',
      })) || [];

      setHierarchy(relations);
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
      const { error } = await supabase
        .from('user_hierarchy')
        .insert({
          manager_id: managerId,
          subordinate_id: subordinateId,
        });

      if (error) throw error;
      toast.success('Subordinado adicionado com sucesso!');
      await fetchHierarchy();
      return true;
    } catch (err: any) {
      console.error('Error adding subordinate:', err);
      if (err.code === '23505') {
        toast.error('Este subordinado já está vinculado a este gestor');
      } else {
        toast.error('Erro ao adicionar subordinado');
      }
      return false;
    }
  };

  const removeSubordinate = async (relationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_hierarchy')
        .delete()
        .eq('id', relationId);

      if (error) throw error;
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
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
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
