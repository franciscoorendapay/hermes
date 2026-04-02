import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/shared/api/http';

export interface CommissionSettings {
  type: 'variable' | 'fixed';
  rate_novos?: number;       // Decimal: 0.07 = 7%
  rate_consolidados?: number; // Decimal: 0.035 = 3.5%
  rate_fixed?: number;       // Decimal: 0.05 = 5%
  updated_at?: string;
  updated_by?: { id: string; name: string } | null;
}

const DEFAULT_SETTINGS: CommissionSettings = {
  type: 'variable',
  rate_novos: 0.07,
  rate_consolidados: 0.035,
  rate_fixed: 0.05,
};

export function useCommissionSettings() {
  const queryClient = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery<CommissionSettings>({
    queryKey: ['commissionSettings'],
    queryFn: async () => {
      const res = await http.get<CommissionSettings>('/settings/commission');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: Omit<CommissionSettings, 'updated_at' | 'updated_by'>) => {
      const res = await http.post<CommissionSettings>('/settings/commission', newSettings);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['commissionSettings'], data);
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}
