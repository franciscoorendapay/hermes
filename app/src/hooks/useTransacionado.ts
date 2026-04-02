import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/http";
import { useAuth } from "@/hooks/useAuth";

export interface TransacionadoItem {
  token: string;
  transacionado: number;
  receita_bruta: number;
  custos: number;
  receita_liquida: number;
}

// Map keyed by lead ID
export type TransacionadoMap = Record<string, TransacionadoItem>;

export interface TransacionadoOptions {
  enabled?: boolean;
  startDate?: string;
  endDate?: string;
  month?: string; // YYYY-MM
  userId?: string;
}

export function useTransacionado(options: TransacionadoOptions | boolean = false) {
  const { effectiveUser, isAuthenticated } = useAuth();
  
  const isEnabled = typeof options === 'boolean' ? options : (options.enabled ?? true);
  const startDate = typeof options === 'object' ? options.startDate : undefined;
  const endDate = typeof options === 'object' ? options.endDate : undefined;
  const month = typeof options === 'object' ? options.month : undefined;
  const targetUserId = typeof options === 'object' ? options.userId : undefined;

  return useQuery<TransacionadoMap>({
    queryKey: ["transacionado", targetUserId || effectiveUser?.id, startDate, endDate, month],
    queryFn: async (): Promise<TransacionadoMap> => {
      const params: Record<string, string> = {};
      const uid = targetUserId || effectiveUser?.id;
      if (uid) {
        params.user_id = uid;
      }
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (month) params.month = month;
      
      const response = await api.get("/leads/transacionado", { params });
      return response.data as TransacionadoMap;
    },
    enabled: isEnabled && isAuthenticated && (!!effectiveUser?.id || !!targetUserId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
