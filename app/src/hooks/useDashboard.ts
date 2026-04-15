import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import { adaptLeadApiToApp } from "@/features/leads/leads.adapter";
import { Lead } from "@/hooks/useLeads";

export interface DashboardStats {
  tpvPrometido: number;
  carteiraClientes: number;
  tpvTotal: number;
  novosClientes: number;
  latestLeads: Lead[];
}

import { useAuth } from "@/hooks/useAuth";

export function useDashboard(enabled: boolean = true) {
  const { effectiveUser, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', effectiveUser?.id],
    queryFn: async () => {
      const url = effectiveUser?.id
        ? `/leads/stats?user_id=${effectiveUser.id}`
        : '/leads/stats';

      const { data } = await http.get(url);

      return {
        ...data,
        latestLeads: (data.latestLeads || []).map(adaptLeadApiToApp)
      } as DashboardStats;
    },
    enabled: enabled && isAuthenticated && !!effectiveUser?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
