import { useCallback } from "react";
import { api } from "@/shared/api/http";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export interface Reminder {
  id: string | number; // Support both types if transitioning
  user_id: string; // Wait, API might not return this if not in group, but let's see
  lead_id: string | null;
  data_lembrete: string;
  hora_lembrete: string;
  descricao: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  adicionado_rota: boolean;
  tipo: 'lembrete' | 'agendamento';
  estabelecimento_nome: string | null;
  estabelecimento_endereco: string | null;
  estabelecimento_lat: number | null;
  estabelecimento_lng: number | null;
  estabelecimento_cep: string | null;
  estabelecimento_numero: string | null;
  estabelecimento_bairro: string | null;
  estabelecimento_cidade: string | null;
  estabelecimento_estado: string | null;
  lead?: {
    id: string | number;
    nom_fantasia: undefined, // Remove old
    tradeName: string;
    leadCode: number;
    appFunnel: number | null;
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
  } | null;
}

export interface EstabelecimentoData {
  nome: string;
  endereco?: string;
  lat?: number | null;
  lng?: number | null;
  cep?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export function useReminders(isAuthenticated: boolean) {
  const { effectiveUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading: loading, refetch: fetchReminders } = useQuery({
    queryKey: ['reminders', effectiveUser?.id],
    queryFn: async () => {
      const url = effectiveUser?.id
        ? `/reminders?user_ids=${effectiveUser.id}`
        : '/reminders';
      const response = await api.get(url);
      return response.data as Reminder[];
    },
    enabled: isAuthenticated,
  });

  const createReminderMutation = useMutation({
    mutationFn: async (vars: { leadId: string | number, dataLembrete: string, horaLembrete: string, descricao?: string }) => {
      const response = await api.post('/reminders', {
        lead_id: vars.leadId,
        data_lembrete: vars.dataLembrete,
        hora_lembrete: vars.horaLembrete,
        descricao: vars.descricao,
        status: "pendente",
        tipo: "lembrete",
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const createReminderForLeadMutation = useMutation({
    mutationFn: async (vars: { leadId: string | number, dataLembrete: string, horaLembrete: string, descricao?: string }) => {
      const response = await api.post('/reminders', {
        lead_id: vars.leadId,
        data_lembrete: vars.dataLembrete,
        hora_lembrete: vars.horaLembrete,
        descricao: vars.descricao,
        status: "pendente",
        tipo: "agendamento",
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const createReminderWithoutLeadMutation = useMutation({
    mutationFn: async (vars: { dataLembrete: string, horaLembrete: string, estabelecimentoData: EstabelecimentoData, descricao?: string }) => {
      const response = await api.post('/reminders', {
        data_lembrete: vars.dataLembrete,
        hora_lembrete: vars.horaLembrete,
        descricao: vars.descricao,
        status: "pendente",
        tipo: "agendamento",
        estabelecimento_nome: vars.estabelecimentoData.nome,
        estabelecimento_endereco: vars.estabelecimentoData.endereco,
        estabelecimento_lat: vars.estabelecimentoData.lat,
        estabelecimento_lng: vars.estabelecimentoData.lng,
        estabelecimento_cep: vars.estabelecimentoData.cep,
        estabelecimento_numero: vars.estabelecimentoData.numero,
        estabelecimento_bairro: vars.estabelecimentoData.bairro,
        estabelecimento_cidade: vars.estabelecimentoData.cidade,
        estabelecimento_estado: vars.estabelecimentoData.estado,
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const updateReminderWithLeadMutation = useMutation({
    mutationFn: async (vars: { reminderId: string | number, leadId: string | number }) => {
      const response = await api.patch(`/reminders/${vars.reminderId}`, {
        lead_id: vars.leadId,
        status: "concluido"
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const updateReminderStatusMutation = useMutation({
    mutationFn: async (vars: { reminderId: string | number, status: "pendente" | "concluido" | "cancelado" }) => {
      const response = await api.patch(`/reminders/${vars.reminderId}`, { status: vars.status });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const markReminderAddedToRouteMutation = useMutation({
    mutationFn: async (reminderId: string | number) => {
      const response = await api.patch(`/reminders/${reminderId}`, { adicionado_rota: true });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  // Wrappers for compatibility with existing code
  const createReminder = async (leadId: string | number, dataLembrete: string, horaLembrete: string, descricao?: string) => {
    try {
      const data = await createReminderMutation.mutateAsync({ leadId, dataLembrete, horaLembrete, descricao });
      return { success: true, data };
    } catch (error) {
      console.error("Error creating reminder:", error);
      return { success: false, error };
    }
  };

  const createReminderForLead = async (leadId: string | number, dataLembrete: string, horaLembrete: string, descricao?: string) => {
    try {
      const data = await createReminderForLeadMutation.mutateAsync({ leadId, dataLembrete, horaLembrete, descricao });
      return { success: true, data };
    } catch (error) {
      console.error("Error creating reminder for lead:", error);
      return { success: false, error };
    }
  };

  const createReminderWithoutLead = async (dataLembrete: string, horaLembrete: string, estabelecimentoData: EstabelecimentoData, descricao?: string) => {
    try {
      const data = await createReminderWithoutLeadMutation.mutateAsync({ dataLembrete, horaLembrete, estabelecimentoData, descricao });
      return { success: true, data };
    } catch (error) {
      console.error("Error creating reminder without lead:", error);
      return { success: false, error };
    }
  };

  const updateReminderWithLead = async (reminderId: string | number, leadId: string | number) => {
    try {
      await updateReminderWithLeadMutation.mutateAsync({ reminderId, leadId });
      return { success: true };
    } catch (error) {
      console.error("Error updating reminder with lead:", error);
      return { success: false, error };
    }
  };

  const updateReminderStatus = async (reminderId: string | number, status: "pendente" | "concluido" | "cancelado") => {
    try {
      await updateReminderStatusMutation.mutateAsync({ reminderId, status });
      return { success: true };
    } catch (error) {
      console.error("Error updating reminder status:", error);
      return { success: false, error };
    }
  };

  const markReminderAddedToRoute = async (reminderId: string | number) => {
    try {
      await markReminderAddedToRouteMutation.mutateAsync(reminderId);
      return { success: true };
    } catch (error) {
      console.error("Error marking reminder as added to route:", error);
      return { success: false, error };
    }
  };

  const getTodayReminders = () => {
    const today = new Date().toISOString().split("T")[0];
    return reminders.filter((r) => r.data_lembrete === today);
  };

  return {
    reminders,
    loading,
    refetch: fetchReminders,
    createReminder,
    createReminderForLead,
    createReminderWithoutLead,
    updateReminderWithLead,
    updateReminderStatus,
    markReminderAddedToRoute,
    getTodayReminders,
  };
}
