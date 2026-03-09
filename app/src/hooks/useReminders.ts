import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared/api/http";

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

import { useAuth } from "@/hooks/useAuth";

export function useReminders(isAuthenticated: boolean) {
  const { effectiveUser } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!isAuthenticated) {
      setReminders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const url = effectiveUser?.id
        ? `/reminders?user_ids=${effectiveUser.id}`
        : '/reminders';
      const response = await api.get(url);
      setReminders(response.data);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const createReminder = async (
    leadId: string | number,
    dataLembrete: string,
    horaLembrete: string,
    descricao?: string
  ) => {
    try {
      const response = await api.post('/reminders', {
        lead_id: leadId,
        data_lembrete: dataLembrete,
        hora_lembrete: horaLembrete,
        descricao,
        status: "pendente",
        tipo: "lembrete",
      });
      await fetchReminders();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating reminder:", error);
      return { success: false, error };
    }
  };

  const createReminderForLead = async (
    leadId: string | number,
    dataLembrete: string,
    horaLembrete: string,
    descricao?: string
  ) => {
    try {
      // Check local duplicate or rely on backend return?
      // Let's rely on backend or just send it.
      const response = await api.post('/reminders', {
        lead_id: leadId,
        data_lembrete: dataLembrete,
        hora_lembrete: horaLembrete,
        descricao,
        status: "pendente",
        tipo: "agendamento",
      });
      await fetchReminders();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating reminder for lead:", error);
      return { success: false, error };
    }
  };

  const createReminderWithoutLead = async (
    dataLembrete: string,
    horaLembrete: string,
    estabelecimentoData: EstabelecimentoData,
    descricao?: string
  ) => {
    try {
      const response = await api.post('/reminders', {
        data_lembrete: dataLembrete,
        hora_lembrete: horaLembrete,
        descricao,
        status: "pendente",
        tipo: "agendamento",
        estabelecimento_nome: estabelecimentoData.nome,
        estabelecimento_endereco: estabelecimentoData.endereco,
        estabelecimento_lat: estabelecimentoData.lat,
        estabelecimento_lng: estabelecimentoData.lng,
        estabelecimento_cep: estabelecimentoData.cep,
        estabelecimento_numero: estabelecimentoData.numero,
        estabelecimento_bairro: estabelecimentoData.bairro,
        estabelecimento_cidade: estabelecimentoData.cidade,
        estabelecimento_estado: estabelecimentoData.estado,
      });
      await fetchReminders();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating reminder without lead:", error);
      return { success: false, error };
    }
  };

  const updateReminderWithLead = async (reminderId: string | number, leadId: string | number) => {
    try {
      await api.patch(`/reminders/${reminderId}`, {
        lead_id: leadId,
        status: "concluido"
      });
      await fetchReminders();
      return { success: true };
    } catch (error) {
      console.error("Error updating reminder with lead:", error);
      return { success: false, error };
    }
  };

  const updateReminderStatus = async (
    reminderId: string | number,
    status: "pendente" | "concluido" | "cancelado"
  ) => {
    try {
      await api.patch(`/reminders/${reminderId}`, { status });
      await fetchReminders();
      return { success: true };
    } catch (error) {
      console.error("Error updating reminder status:", error);
      return { success: false, error };
    }
  };

  const markReminderAddedToRoute = async (reminderId: string | number) => {
    try {
      await api.patch(`/reminders/${reminderId}`, { adicionado_rota: true });
      await fetchReminders();
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
