import { useQuery } from '@tanstack/react-query';
import { http } from '@/shared/api/http';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { adaptLeadApiToApp } from '@/features/leads/leads.adapter';

export type Period = 'today' | 'week' | 'month';

interface LeadStats {
  total: number;
  byFunil: Record<number, number>;
  leadsByFunil: Record<number, any[]>;
  credenciados: number; // No período
  credenciadosTotal: number; // Geral histórico
  tpvTotal: number; // No período (Prometido/Progress)
  tpvGeral: number; // Total histórico
}

interface VisitaStats {
  total: number;
  byTipo: Record<string, number>;
  byStatus: Record<string, number>;
}

interface MetaStats {
  metaClientes: number;
  metaValor: number;
  metaVisitas: number;
  realizadoClientes: number;
  realizadoValor: number;
  realizadoVisitas: number;
}

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  estabelecimento: string;
  status: string;
}

export interface PlanningStats {
  agendadas: number;
  realizadas: number;
  pendentes: number;
  canceladas: number;
  proximosAgendamentos: Agendamento[];
}

export interface UserStats {
  userId: string;
  nome: string;
  leads: LeadStats;
  visitas: VisitaStats;
  metas: MetaStats;
  planejamento: PlanningStats;
}

interface GestaoStats {
  consolidado: {
    leads: LeadStats;
    visitas: VisitaStats;
    metas: MetaStats;
    planejamento: PlanningStats;
    credenciadosPorDia: any[];
  };
  porUsuario: UserStats[];
  usersMap: Record<string, string>;
  isLoading: boolean;
}

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export function useGestaoStats(
  selectedUserId?: string,
  period: Period = 'month',
  customRange?: { start: Date; end: Date }
): GestaoStats & { refetch: () => void } {
  const { effectiveUser } = useAuth();
  const { role, isManager, isAdmin } = useUserRole();

  const emptyPlanning: PlanningStats = { agendadas: 0, realizadas: 0, pendentes: 0, canceladas: 0, proximosAgendamentos: [] };

  const initialStats: Omit<GestaoStats, 'isLoading'> = {
    consolidado: {
      leads: { total: 0, byFunil: {}, leadsByFunil: {}, credenciados: 0, credenciadosTotal: 0, tpvTotal: 0, tpvGeral: 0 },
      visitas: { total: 0, byTipo: {}, byStatus: {} },
      metas: { metaClientes: 0, metaValor: 0, metaVisitas: 0, realizadoClientes: 0, realizadoValor: 0, realizadoVisitas: 0 },
      planejamento: emptyPlanning,
      credenciadosPorDia: [],
    },
    porUsuario: [],
    usersMap: {},
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gestaoStats', period, selectedUserId, effectiveUser?.id, role, customRange?.start?.toISOString(), customRange?.end?.toISOString()],
    queryFn: async () => {
      if (!effectiveUser || (!isManager && !isAdmin)) {
        return initialStats;
      }

      const { start: periodStart, end: periodEnd } = customRange ?? getDateRange(period);
      const currentMonth = periodStart.getMonth() + 1;
      const currentYear = periodStart.getFullYear();

      // 1. Fetch Users to Determine Scope
      const usersResponse = await http.get<any[]>('/users');
      let allUsers = usersResponse.data;
      let targetUsers: any[] = [];

      // Filter users based on role
      if (isAdmin || role === 'diretor' || role === 'nacional') {
        targetUsers = allUsers;
      } else if (role === 'regional') {
        const userRegion = allUsers.find(u => u.id === effectiveUser.id)?.region;
        if (userRegion) {
          targetUsers = allUsers.filter(u => u.region === userRegion);
        } else {
          targetUsers = allUsers.filter(u => u.id !== effectiveUser.id);
        }
      } else {
        targetUsers = [];
      }

      // Exclude test/inactive users from stats calculations
      targetUsers = targetUsers.filter(u => u.includeInStats !== false);

      let userIds = targetUsers.map(u => u.id);

      if (selectedUserId) {
        userIds = userIds.filter(id => id === selectedUserId);
      }

      if (userIds.length === 0) {
        return initialStats;
      }

      const idsParam = userIds.join(',');

      // 2. Fetch Data from API in Parallel
      const [leadsRes, visitsRes, metasRes, remindersRes] = await Promise.all([
        http.get(`/leads?user_ids=${idsParam}`),
        http.get(`/visits?user_ids=${idsParam}`),
        http.get(`/goals?mes=${currentMonth}&ano=${currentYear}&user_ids=${idsParam}`),
        http.get(`/reminders?user_ids=${idsParam}`)
      ]);

      const allLeadsRaw = leadsRes.data || [];
      const allLeads = allLeadsRaw.map((l: any) => adaptLeadApiToApp(l));
      const visitas = visitsRes.data || [];
      const metas = metasRes.data || [];
      const lembretes = remindersRes.data || [];

      // Filter leads credenciados by date
      // Priority: data_credenciamento (accreditation date) → data_registro (creation date)
      const leadsCredenciadosPeriodo = allLeads?.filter((l: any) => {
        if (l.credenciado !== 1) return false;
        const dateStr = l.data_credenciamento || l.data_registro;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= periodStart && d <= periodEnd;
      }) || [];

      // Filter visits by date
      const visitasPeriodo = visitas?.filter((v: any) => {
        const d = new Date(v.data_visita);
        return d >= periodStart && d <= periodEnd;
      }) || [];

      // Filter reminders by date
      const lembretesPeriodo = lembretes?.filter((l: any) => {
        if (l.tipo && l.tipo !== 'agendamento') return false;
        const d = new Date(l.data_lembrete);
        const dStr = d.toISOString().split('T')[0];
        const periodStartStr = periodStart.toISOString().split('T')[0];
        const periodEndStr = periodEnd.toISOString().split('T')[0];
        return dStr >= periodStartStr && dStr <= periodEndStr;
      }) || [];

      const profilesMap = new Map(targetUsers.map(p => [p.id, p.name || p.email]));

      const safeParseNumber = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const cleaned = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      };

      // 3. Calculate Consolidated Stats
      const filterByDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= periodStart && d <= periodEnd;
      };

      const leadsAccreditedTotal = allLeads.filter((l: any) => l.credenciado === 1);
      const leadsAccreditedPeriod = leadsAccreditedTotal.filter((l: any) =>
        filterByDate(l.data_credenciamento || l.data_registro)
      );

      const consolidadoLeads: LeadStats = {
        total: allLeads.length,
        byFunil: {},
        leadsByFunil: {},
        credenciados: leadsAccreditedPeriod.length,
        credenciadosTotal: leadsAccreditedTotal.length,
        tpvTotal: leadsAccreditedPeriod.reduce((acc: number, l: any) => acc + safeParseNumber(l.tpv), 0),
        tpvGeral: leadsAccreditedTotal.reduce((acc: number, l: any) => acc + safeParseNumber(l.tpv), 0),
      };

      allLeads.forEach((l: any) => {
        const funil = l.funil_app || 1;
        const dateStr = funil === 5 ? (l.data_credenciamento || l.data_registro) : l.data_registro;
        if (filterByDate(dateStr)) {
          consolidadoLeads.byFunil[funil] = (consolidadoLeads.byFunil[funil] || 0) + 1;
          if (!consolidadoLeads.leadsByFunil[funil]) consolidadoLeads.leadsByFunil[funil] = [];
          consolidadoLeads.leadsByFunil[funil].push(l);
        }
      });

      // Daily Credenciamentos Chart Data
      const dailyMap = new Map<string, { quantidade: number, tpv: number }>();
      leadsAccreditedPeriod.forEach((l: any) => {
        const dateStr = l.data_credenciamento || l.data_registro;
        if (!dateStr) return;
        const day = new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const current = dailyMap.get(day) || { quantidade: 0, tpv: 0 };
        current.quantidade += 1;
        current.tpv += safeParseNumber(l.tpv);
        dailyMap.set(day, current);
      });

      const sortedDays = Array.from(dailyMap.keys()).sort((a, b) => {
        const [da, ma] = a.split('/');
        const [db, mb] = b.split('/');
        return (Number(ma) - Number(mb)) || (Number(da) - Number(db));
      });

      const credenciadosPorDia = sortedDays.map(day => ({
        dia: day,
        ...dailyMap.get(day)!
      }));

      const consolidadoVisitas: VisitaStats = {
        total: visitasPeriodo.length,
        byTipo: {},
        byStatus: {},
      };

      visitasPeriodo.forEach((v: any) => {
        const tipo = v.tipo || 'visita';
        const status = v.status || 'realizada';
        consolidadoVisitas.byTipo[tipo] = (consolidadoVisitas.byTipo[tipo] || 0) + 1;
        consolidadoVisitas.byStatus[status] = (consolidadoVisitas.byStatus[status] || 0) + 1;
      });

      const consolidadoMetas: MetaStats = {
        metaClientes: metas?.reduce((acc: number, m: any) => acc + (m.meta_clientes || 0), 0) || 0,
        metaValor: metas?.reduce((acc: number, m: any) => acc + (Number(m.meta_valor) || 0), 0) || 0,
        metaVisitas: metas?.reduce((acc: number, m: any) => acc + (m.meta_visitas || 0), 0) || 0,
        realizadoClientes: consolidadoLeads.credenciados,
        realizadoValor: consolidadoLeads.tpvTotal,
        realizadoVisitas: consolidadoVisitas.total,
      };

      const consolidadoPlanejamento: PlanningStats = {
        agendadas: lembretesPeriodo.length,
        realizadas: lembretesPeriodo.filter((l: any) => l.status === 'concluido').length,
        pendentes: lembretesPeriodo.filter((l: any) => l.status === 'pendente').length,
        canceladas: lembretesPeriodo.filter((l: any) => l.status === 'cancelado').length,
        proximosAgendamentos: lembretesPeriodo
          .filter((l: any) => l.status === 'pendente')
          .sort((a: any, b: any) => `${a.data_lembrete}${a.hora_lembrete}`.localeCompare(`${b.data_lembrete}${b.hora_lembrete}`))
          .slice(0, 5)
          .map((l: any) => ({
            id: l.id,
            data: l.data_lembrete,
            hora: l.hora_lembrete,
            estabelecimento: l.estabelecimento_nome || 'Local não definido',
            status: l.status,
          })),
      };

      // 4. Calculate Stats per User
      const porUsuario: UserStats[] = [];
      for (const uid of userIds) {
        const userLeads = allLeads.filter((l: any) => l.user_id === uid);
        const userLeadsAccreditedTotal = userLeads.filter((l: any) => l.credenciado === 1);
        const userLeadsAccreditedPeriod = userLeadsAccreditedTotal.filter((l: any) =>
          filterByDate(l.data_credenciamento || l.data_registro)
        );

        const userVisitas = visitasPeriodo?.filter((v: any) => (v.user?.id || v.user_id) === uid) || [];
        const userMeta = metas?.find((m: any) => (m.user?.id || m.user_id) === uid);

        const userLeadStats: LeadStats = {
          total: userLeads.length,
          byFunil: {},
          leadsByFunil: {},
          credenciados: userLeadsAccreditedPeriod.length,
          credenciadosTotal: userLeadsAccreditedTotal.length,
          tpvTotal: userLeadsAccreditedPeriod.reduce((acc: number, l: any) => acc + safeParseNumber(l.tpv), 0),
          tpvGeral: userLeadsAccreditedTotal.reduce((acc: number, l: any) => acc + safeParseNumber(l.tpv), 0),
        };

        userLeads.forEach((l: any) => {
          const funil = l.funil_app || 1;
          const dateStr = funil === 5 ? (l.data_credenciamento || l.data_registro) : l.data_registro;
          if (filterByDate(dateStr)) {
            userLeadStats.byFunil[funil] = (userLeadStats.byFunil[funil] || 0) + 1;
            if (!userLeadStats.leadsByFunil[funil]) userLeadStats.leadsByFunil[funil] = [];
            userLeadStats.leadsByFunil[funil].push(l);
          }
        });

        const userVisitaStats: VisitaStats = {
          total: userVisitas.length,
          byTipo: {},
          byStatus: {},
        };

        userVisitas.forEach((v: any) => {
          const tipo = v.tipo || 'visita';
          const status = v.status || 'realizada';
          userVisitaStats.byTipo[tipo] = (userVisitaStats.byTipo[tipo] || 0) + 1;
          userVisitaStats.byStatus[status] = (userVisitaStats.byStatus[status] || 0) + 1;
        });

        const userLembretes = lembretesPeriodo?.filter((l: any) => l.user?.id === uid || l.user_id === uid) || [];
        const userPlanejamento: PlanningStats = {
          agendadas: userLembretes.length,
          realizadas: userLembretes.filter((l: any) => l.status === 'concluido').length,
          pendentes: userLembretes.filter((l: any) => l.status === 'pendente').length,
          canceladas: userLembretes.filter((l: any) => l.status === 'cancelado').length,
          proximosAgendamentos: userLembretes
            .filter((l: any) => l.status === 'pendente')
            .sort((a: any, b: any) => `${a.data_lembrete}${a.hora_lembrete}`.localeCompare(`${b.data_lembrete}${b.hora_lembrete}`))
            .slice(0, 5)
            .map((l: any) => ({
              id: l.id,
              data: l.data_lembrete,
              hora: l.hora_lembrete,
              estabelecimento: l.estabelecimento_nome || 'Local não definido',
              status: l.status,
            })),
        };

        porUsuario.push({
          userId: uid,
          nome: profilesMap.get(uid) || 'Usuário',
          leads: userLeadStats,
          visitas: userVisitaStats,
          metas: {
            metaClientes: userMeta?.meta_clientes || 0,
            metaValor: Number(userMeta?.meta_valor) || 0,
            metaVisitas: userMeta?.meta_visitas || 0,
            realizadoClientes: userLeadStats.credenciados,
            realizadoValor: userLeadStats.tpvTotal,
            realizadoVisitas: userVisitaStats.total,
          },
          planejamento: userPlanejamento,
        });
      }

      return {
        consolidado: {
          leads: consolidadoLeads,
          visitas: consolidadoVisitas,
          metas: consolidadoMetas,
          planejamento: consolidadoPlanejamento,
          credenciadosPorDia,
        },
        porUsuario: porUsuario.sort((a, b) => b.leads.tpvTotal - a.leads.tpvTotal),
        usersMap: Object.fromEntries(profilesMap),
      };
    },
    enabled: !!effectiveUser && (isManager || isAdmin),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData
  });

  return {
    ...(data || initialStats),
    isLoading,
    refetch
  };
}
