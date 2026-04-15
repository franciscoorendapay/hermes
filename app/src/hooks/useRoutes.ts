import { useState, useCallback } from 'react';
import { api } from '@/shared/api/http';
import { toast } from 'sonner';
import { Reminder } from './useReminders';
import { format } from 'date-fns';

export interface RouteItem {
  id: number;
  sequence: number;
  reminder: Reminder;
}

export interface VisitRoute {
  id: number;
  date: string;
  name: string;
  status: string;
  items: RouteItem[];
}

export function useRoutes(enabled: boolean = true) {
  const [loading, setLoading] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<VisitRoute | null>(null);

  const fetchRoute = useCallback(async (date: Date) => {
    if (!enabled) return;

    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await api.get(`/visit-routes?date=${dateStr}`);

      if (response.data && response.data.length > 0) {
        setCurrentRoute(response.data[0]);
      } else {
        setCurrentRoute(null);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      toast.error('Erro ao carregar rota');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const saveRoute = useCallback(async (date: Date, reminderIds: string[], status?: string) => {
    if (!enabled) return;

    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const items = reminderIds.map((id, index) => ({
        reminderId: id,
        sequence: index
      }));

      const payload = {
        date: dateStr,
        items,
        status
      };

      const response = await api.post('/visit-routes', payload);
      setCurrentRoute(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Erro ao salvar rota');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  return {
    loading,
    currentRoute,
    fetchRoute,
    saveRoute
  };
}
