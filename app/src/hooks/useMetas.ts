import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import { useAuth } from "@/hooks/useAuth";

export interface Metas {
  id: string; // Changed from number to string to match UUID
  user_id?: string;
  mes: number;
  ano: number;
  meta_clientes: number;
  atingido_clientes: number; // This needs to be calculated or fetched separately in real app
  meta_valor: number;
  atingido_valor: number; // This needs to be calculated or fetched separately in real app
  meta_visitas?: number;
}

export function useMetas(enabled: boolean = false) {
  const { effectiveUser: user, isAuthenticated } = useAuth(); // Use effectiveUser instead of logged in user

  return useQuery({
    queryKey: ['metas', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const now = new Date();
      const mes = now.getMonth() + 1;
      const ano = now.getFullYear();

      // Fetch goals configuration
      const response = await http.get<any[]>('/goals', {
        params: { mes, ano }
      });

      // Filter for current user (though backend endpoint returns list for all if no user filter logic applied yet, 
      // but usually endpoint should filter or we filter here if it returns all goals for month)
      // The current backend implementation returns ALL goals for the month. We must filter for current user.
      const myGoal = response.data.find((g: any) => g.user?.id === user.id);

      if (!myGoal) return null;

      // Fetch progress (atingido_clientes, atingido_valor) from leads/stats
      const statsUrl = user?.id ? `/leads/stats?user_id=${user.id}` : '/leads/stats';
      const statsResponse = await http.get(statsUrl);
      const stats = statsResponse.data || {};

      return {
        id: myGoal.id,
        user_id: myGoal.user?.id,
        mes: myGoal.mes,
        ano: myGoal.ano,
        meta_clientes: myGoal.meta_clientes || 0,
        meta_valor: parseFloat(myGoal.meta_valor || '0'),
        meta_visitas: myGoal.meta_visitas || 0,
        atingido_clientes: stats.novosClientes || 0,
        atingido_valor: parseFloat(stats.tpvPrometido || '0'),
      } as Metas;
    },
    enabled: enabled && isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
