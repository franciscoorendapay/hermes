import { useState, useEffect, useCallback } from 'react';
import { http } from '@/shared/api/http';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Meta {
  id: string;
  user: { id: string }; // API returns user object nested likely, but our loop expects user_id for matching
  mes: number;
  ano: number;
  meta_clientes: number | null;
  meta_valor: string | null;
  meta_visitas: number | null;
  created_by: string | null;
  created_at: string;
  // helper for frontend mapping if needed
  user_id?: string;
}

interface MetaInput {
  user_id: string;
  mes: number;
  ano: number;
  meta_clientes: number;
  meta_valor: number;
  meta_visitas: number;
}

export function useGestaoMetas(mes?: number, ano?: number) {
  const { effectiveUser } = useAuth();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = mes ?? new Date().getMonth() + 1;
  const currentYear = ano ?? new Date().getFullYear();

  const fetchMetas = useCallback(async () => {
    if (!effectiveUser) return;

    setIsLoading(true);
    try {
      const response = await http.get<Meta[]>('/goals', {
        params: { mes: currentMonth, ano: currentYear }
      });

      // Transform data to ensure compatibility with consistent snake_case interface
      const mappedMetas: Meta[] = response.data.map((m: any) => ({
        id: m.id,
        user: m.user,
        mes: m.mes,
        ano: m.ano,
        // Map backend camelCase or snake_case to interface snake_case
        meta_clientes: m.metaClientes ?? m.meta_clientes,
        meta_valor: m.metaValor ?? m.meta_valor,
        meta_visitas: m.metaVisitas ?? m.meta_visitas,
        created_by: m.createdBy ?? m.created_by,
        created_at: m.createdAt ?? m.created_at,
        user_id: m.user?.id
      }));

      setMetas(mappedMetas);
    } catch (err) {
      console.error('Error fetching metas:', err);
      setMetas([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUser, currentMonth, currentYear]);

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  const saveMeta = async (input: MetaInput): Promise<boolean> => {
    if (!effectiveUser) return false;

    try {
      await http.post('/goals', input);
      toast.success('Meta salva com sucesso!');
      await fetchMetas();
      return true;
    } catch (err) {
      console.error('Error saving meta:', err);
      toast.error('Erro ao salvar meta');
      return false;
    }
  };

  return { metas, isLoading, saveMeta, refetch: fetchMetas };
}
