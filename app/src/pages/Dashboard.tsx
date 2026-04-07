import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeadItem } from "@/components/dashboard/LeadItem";
import { MapLegend } from "@/components/dashboard/MapLegend";
import { LeadsMap } from "@/components/map/LeadsMap";
import { PendingCredenciamentoAlert } from "@/components/dashboard/PendingCredenciamentoAlert";
import { TodayRemindersAlert } from "@/components/dashboard/TodayRemindersAlert";
import { formatMoney } from "@/lib/formatters";
import { RefreshCw, Plus, ChevronDown, LogOut, LayoutDashboard, Wallet, Calendar, Shield } from "lucide-react";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useMetas } from "@/hooks/useMetas";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useReminders } from "@/hooks/useReminders";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { LaunchVisitSheet } from "@/components/routes/LaunchVisitSheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { toast } from "sonner";
// Ensure imports are available, Shield is used
import { AlertTriangle } from "lucide-react"; // Adding handy icon if needed, but Shield is already there

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, isAuthenticated, logout, isImpersonating, impersonatedUser, effectiveUser } = useAuth();
  const { isManager, isLogistica, isAdmin, isLoading: roleLoading } = useUserRole();

  // Determine which profile to show
  const displayProfile = isImpersonating && impersonatedUser ? {
    nome: impersonatedUser.name,
    cargo: impersonatedUser.role === 'comercial' ? 'Executivo Comercial' : impersonatedUser.role,
  } : profile;

  // Redirecionar logística para sua área
  useEffect(() => {
    if (!roleLoading && isLogistica) {
      navigate('/logistica', { replace: true });
    }
  }, [roleLoading, isLogistica, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  const [showVisitSheet, setShowVisitSheet] = useState(false);
  const [leadsExpanded, setLeadsExpanded] = useState(false);
  const [selectedLeadForAction, setSelectedLeadForAction] = useState<Lead | null>(null);
  const [directAction, setDirectAction] = useState<string | null>(null);
  const [selectedLeadForProfile, setSelectedLeadForProfile] = useState<Lead | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [focusedLeadId, setFocusedLeadId] = useState<string | null>(null);

  const {
    data: dashboardStats,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
    isRefetching: dashboardRefetching
  } = useDashboard(isAuthenticated);

  const {
    data: leads = [],
    isLoading: leadsLoading,
    refetch: refetchLeads,
    isRefetching: leadsRefetching
  } = useLeads(isAuthenticated);

  const {
    data: metas,
    isLoading: metasLoading,
    refetch: refetchMetas,
    isRefetching: metasRefetching
  } = useMetas(isAuthenticated);

  const {
    reminders,
    refetch: refetchReminders,
    updateReminderStatus,
    markReminderAddedToRoute,
    loading: remindersLoading
  } = useReminders(isAuthenticated);

  const isRefreshing = dashboardRefetching || leadsRefetching || metasRefetching;

  const cardKpi = [{
    label: 'TPV Prometido Realizado',
    value: formatMoney(dashboardStats?.tpvPrometido || 0),
  }, {
    label: 'Carteira de Clientes',
    value: String(dashboardStats?.carteiraClientes || 0),
  }, {
    label: 'TPV Prometido Total',
    value: formatMoney(dashboardStats?.tpvTotal || 0),
  }, {
    label: 'Novos Clientes',
    value: String(dashboardStats?.novosClientes || 0),
  }];

  const onRefresh = async () => {
    await Promise.all([refetchDashboard(), refetchLeads(), refetchMetas(), refetchReminders()]);
  };

  const handleMarkReminderComplete = async (reminderId: string) => {
    const result = await updateReminderStatus(reminderId, "concluido");
    if (result.success) {
      toast.success("Lembrete concluído!");
    } else {
      toast.error("Erro ao marcar lembrete como concluído");
    }
  };

  const handleSelectReminder = (reminder: any) => {
    // Find the lead and show its detail sheet
    const lead = leads.find(l => l.id === reminder.lead_id);
    if (lead) {
      setSelectedLeadForProfile(lead);
      setShowDetailSheet(true);
    }
  };

  const handleAddReminderToRoute = async (reminder: any) => {
    const lead = leads.find(l => l.id === reminder.lead_id);
    if (lead && lead.lat && lead.lng) {
      // Mark reminder as added to route
      await markReminderAddedToRoute(reminder.id);

      // Navigate to /routes with lead data in state
      const address = lead.endereco_logradouro
        ? `${lead.endereco_logradouro}, ${lead.endereco_numero || ''} - ${lead.endereco_bairro || ''}`
        : '';

      navigate('/routes', {
        state: {
          addToRoute: {
            name: lead.nome_fantasia,
            address,
            lat: lead.lat,
            lng: lead.lng,
            placeId: lead.cod_lead.toString(),
          }
        }
      });
    } else {
      toast.error("Este lead não possui localização cadastrada");
    }
  };

  const handleLeadAction = (leadId: string, action: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setSelectedLeadForAction(lead);
    setDirectAction(action);
    setShowVisitSheet(true);
  };

  const handleVisitSheetClose = (open: boolean) => {
    setShowVisitSheet(open);
    if (!open) {
      setSelectedLeadForAction(null);
      setDirectAction(null);
      onRefresh();
    }
  };

  const handleViewProfile = (lead: Lead) => {
    setSelectedLeadForProfile(lead);
    setShowDetailSheet(true);
  };

  return (
    <div className="space-y-4 pb-6">

      {
        isImpersonating && impersonatedUser && (
          <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">
                Modo de Acesso: Você está visualizando como <strong>{impersonatedUser.name}</strong>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-white border-amber-300 hover:bg-amber-50 text-amber-900"
              onClick={() => window.location.href = '/admin'}
            >
              Sair do Acesso
            </Button>
          </div>
        )
      }

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-[#2A2A2A] text-base">{displayProfile?.nome || 'Usuário'}</h1>
          <p className="font-normal text-[#888888] text-xs">{displayProfile?.cargo || 'Executivo Comercial'}</p>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin')}
              className="text-xs"
            >
              <Shield className="h-4 w-4 mr-1" />
              Admin
            </Button>
          )}
          {isManager && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/gestao')}
              className="text-xs"
            >
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Gestão
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isRefreshing} className="text-[#888888]">
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Alerta de Credenciamentos Pendentes */}
      <PendingCredenciamentoAlert
        leads={leads}
        onSelectLead={(lead) => {
          setSelectedLeadForProfile(lead);
          setShowDetailSheet(true);
        }}
      />

      {/* Alerta de Lembretes do Dia */}
      <TodayRemindersAlert
        reminders={reminders}
        onSelectReminder={handleSelectReminder}
        onMarkComplete={handleMarkReminderComplete}
        onAddToRoute={handleAddReminderToRoute}
      />

      {/* Mapa */}
      <Card className="bg-white border border-[#E5E5E5] rounded-xl shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-[#2A2A2A]">Mapa Opay</h3>
            <button className="font-medium text-[#888888] text-xs" onClick={() => navigate('/routes')}>
              Ver mais
            </button>
          </div>
          <MapLegend />
          <div className="mt-2 cursor-pointer" onClick={() => navigate('/routes')}>
            <LeadsMap leads={leads} height="160px" focusedLeadId={focusedLeadId || undefined} />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Acesso Rápido */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-12 rounded-xl flex-col gap-1 py-2 group"
          onClick={() => navigate('/carteira')}
        >
          <Wallet className="h-5 w-5 text-primary group-hover:text-accent-foreground" />
          <span className="text-xs">Carteira</span>
        </Button>
        <Button
          variant="outline"
          className="h-12 rounded-xl flex-col gap-1 py-2 group"
          onClick={() => navigate('/routes', { state: { activeTab: 'agenda' } })}
        >
          <Calendar className="h-5 w-5 text-primary group-hover:text-accent-foreground" />
          <span className="text-xs">Planejamento</span>
        </Button>
        <Button
          className="h-12 rounded-xl flex-col gap-1 py-2 gradient-dark text-white border-0"
          onClick={() => setShowVisitSheet(true)}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs">Visita</span>
        </Button>
      </div>

      {/* Últimos Leads - Colapsável */}
      <Collapsible open={leadsExpanded} onOpenChange={setLeadsExpanded}>
        <Card className="bg-white border border-[#E5E5E5] rounded-xl shadow-none">
          <CardContent className="p-4">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#2A2A2A]">Últimos Leads</h3>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  leadsExpanded && "rotate-180"
                )} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              {dashboardLoading ? (
                <div className="space-y-3 mt-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : (dashboardStats?.latestLeads?.length || 0) === 0 ? (
                <p className="text-center text-sm font-normal text-[#888888] py-8 mt-4">
                  Nenhum lead cadastrado até o momento
                </p>
              ) : (
                <div className="mt-4">
                  {dashboardStats?.latestLeads?.map(lead => (
                    <LeadItem
                      key={lead.cod_lead}
                      lead={lead}
                      onAction={handleLeadAction}
                      onViewProfile={handleViewProfile}
                    />
                  ))}

                  <button
                    className="w-full text-center py-3 text-sm font-medium text-primary"
                    onClick={() => navigate('/leads')}
                  >
                    Ver todos
                  </button>
                </div>
              )}
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* Metas */}
      {!metasLoading && !metas ? (
        <Card className="bg-white border border-[#E5E5E5] rounded-xl shadow-none">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">Nenhuma meta definida</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <ProgressCard title="Meta do Mês" progress={metas?.atingido_valor ?? 0} progressLabel="Progresso" goal={metas?.meta_valor ?? 0} goalLabel="Meta" formatValue={formatMoney} isLoading={metasLoading} />
          <ProgressCard title="Meta de clientes do Mês" progress={metas?.atingido_clientes ?? 0} progressLabel="Progresso" goal={metas?.meta_clientes ?? 0} goalLabel="Meta" isLoading={metasLoading} />
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid gap-4 grid-cols-2">
        {cardKpi.map((card, idx) => <StatCard key={idx} label={card.label} value={card.value} isLoading={dashboardLoading} />)}
      </div>

      {/* LaunchVisitSheet */}
      <LaunchVisitSheet
        open={showVisitSheet}
        onOpenChange={handleVisitSheetClose}
        leads={leads}
        selectedLead={selectedLeadForAction}
        directAction={directAction}
        initialPlace={null}
        initialType={null}
        onLeadSaved={onRefresh}
        onLeadSavedWithId={(id) => {
          setFocusedLeadId(id);
          onRefresh();
        }}
      />

      {/* LeadDetailSheet */}
      <LeadDetailSheet
        lead={selectedLeadForProfile}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onContinuarCadastro={(lead, action) => {
          setShowDetailSheet(false);
          handleLeadAction(lead.id, action);
        }}
        onEditar={(lead, action) => {
          setShowDetailSheet(false);
          setSelectedLeadForAction(lead);
          setDirectAction(action);
          setShowVisitSheet(true);
        }}
      />
    </div >
  );
}
