import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X,
  Plus,
  Loader2,
  UserPlus,
  RotateCcw,
  Heart,
  RefreshCw,
  FileText,
} from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useReminders, Reminder, EstabelecimentoData } from "@/hooks/useReminders";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { AddVisitDialog } from "./AddVisitDialog";
import { LaunchVisitSheet } from "./LaunchVisitSheet";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { toast } from "sonner";
import type { PlaceResult } from "@/components/routes/PlacesSearch";
import { FUNIL } from "@/constants/funil";

interface ScheduledVisit {
  id: string;
  leadId: string | null;
  leadName: string;
  leadCod: number;
  address: string;
  date: Date;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  description: string | null;
  hasLead: boolean;
  funilApp: number | null;
  estabelecimentoData: {
    nome: string | null;
    endereco: string | null;
    lat: number | null;
    lng: number | null;
    cep: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
  } | null;
}

const statusConfig = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700",
  },
  confirmed: {
    label: "Confirmada",
    color: "bg-green-100 text-green-700",
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-100 text-red-700",
  },
};

function mapReminderToVisit(reminder: Reminder): ScheduledVisit {
  const statusMap: Record<string, "pending" | "confirmed" | "cancelled"> = {
    pendente: "pending",
    concluido: "confirmed",
    cancelado: "cancelled",
  };

  const hasLead = !!reminder.lead_id && !!reminder.lead;

  return {
    id: String(reminder.id),
    leadId: reminder.lead_id,
    leadName: reminder.lead?.tradeName || reminder.estabelecimento_nome || "Estabelecimento",
    leadCod: reminder.lead?.leadCode || 0,
    address: "", // Will be filled from leads data if available
    date: parseISO(reminder.data_lembrete),
    time: reminder.hora_lembrete.substring(0, 5), // Format HH:MM
    status: statusMap[reminder.status] || "pending",
    description: reminder.descricao,
    hasLead,
    funilApp: reminder.lead?.appFunnel ?? null,
    estabelecimentoData: !hasLead ? {
      nome: reminder.estabelecimento_nome,
      endereco: reminder.estabelecimento_endereco,
      lat: reminder.estabelecimento_lat,
      lng: reminder.estabelecimento_lng,
      cep: reminder.estabelecimento_cep,
      numero: reminder.estabelecimento_numero,
      bairro: reminder.estabelecimento_bairro,
      cidade: reminder.estabelecimento_cidade,
      estado: reminder.estabelecimento_estado,
    } : null,
  };
}

type ActionType = "prospeccao" | "retorno" | "cliente" | "reativar" | "acompanhar" | "qualificar" | "negociar" | "precificar" | "credenciar";

interface ActionConfig {
  type: ActionType;
  label: string;
  icon: typeof UserPlus;
  variant: "default" | "outline" | "secondary";
}

interface AgendaTabProps {
  addVisitOpen?: boolean;
  setAddVisitOpen?: (open: boolean) => void;
  addVisitInitialPlace?: PlaceResult | null;
}

export function AgendaTab({ 
  addVisitOpen: externalAddVisitOpen, 
  setAddVisitOpen: externalSetAddVisitOpen,
  addVisitInitialPlace 
}: AgendaTabProps = {}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [internalAddVisitOpen, setInternalAddVisitOpen] = useState(false);
  
  const addVisitOpen = externalAddVisitOpen !== undefined ? externalAddVisitOpen : internalAddVisitOpen;
  const setAddVisitOpen = externalSetAddVisitOpen || setInternalAddVisitOpen;

  const [prospeccaoSheetOpen, setProspeccaoSheetOpen] = useState(false);
  const [prospeccaoData, setProspeccaoData] = useState<{
    reminderId: string;
    place: PlaceResult;
  } | null>(null);

  // New states for retorno and profile flows
  const [retornoSheetOpen, setRetornoSheetOpen] = useState(false);
  const [retornoData, setRetornoData] = useState<{
    reminderId: string;
    lead: Lead;
    visitType: string;
  } | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [selectedLeadForProfile, setSelectedLeadForProfile] = useState<Lead | null>(null);

  const { isAuthenticated } = useAuth();
  const {
    reminders,
    loading: remindersLoading,
    createReminderWithoutLead,
    createReminderForLead,
    updateReminderStatus,
    updateReminderWithLead,
    refetch,
  } = useReminders(isAuthenticated);
  const { data: leads = [], isLoading: leadsLoading } = useLeads(isAuthenticated);

  // Map reminders to visits format with address from leads
  const visits = useMemo(() => {
    return reminders.map((reminder) => {
      const visit = mapReminderToVisit(reminder);

      if (visit.hasLead && visit.leadId) {
        // Se tem lead, busca o endereço do lead
        const lead = leads.find((l) => l.id === reminder.lead_id);
        if (lead) {
          const addressParts = [
            lead.endereco_logradouro,
            lead.endereco_numero,
            lead.endereco_bairro,
          ].filter(Boolean);
          visit.address = addressParts.length > 0
            ? addressParts.join(", ")
            : "Endereço não cadastrado";
          // Update funilApp from current lead data
          visit.funilApp = lead.funil_app;
        }
      } else if (visit.estabelecimentoData?.endereco) {
        // Se não tem lead, usa o endereço do estabelecimento
        visit.address = visit.estabelecimentoData.endereco;
      } else {
        visit.address = "Endereço não informado";
      }

      return visit;
    });
  }, [reminders, leads]);

  const visitsForSelectedDate = useMemo(() => {
    return visits.filter((visit) => isSameDay(visit.date, selectedDate));
  }, [visits, selectedDate]);

  const datesWithVisits = useMemo(() => {
    return visits.map((visit) => visit.date);
  }, [visits]);

  const cancelVisit = async (id: string) => {
    const result = await updateReminderStatus(id, "cancelado");
    if (result.success) {
      toast.success("Visita cancelada");
    } else {
      toast.error("Erro ao cancelar visita");
    }
  };

  const handleSaveVisit = async (
    estabelecimentoData: EstabelecimentoData,
    date: string,
    time: string,
    description?: string
  ) => {
    const result = await createReminderWithoutLead(date, time, estabelecimentoData, description);
    if (result.success) {
      toast.success("Visita agendada com sucesso!");
    } else if ((result as any).error === "duplicate") {
      toast.warning((result as any).message || "Visita já agendada para este horário");
    } else {
      toast.error("Erro ao agendar visita");
    }
    return result;
  };

  // Handler for scheduling visits to existing leads
  const handleSaveVisitWithLead = async (
    leadId: string,
    date: string,
    time: string,
    description?: string
  ) => {
    const result = await createReminderForLead(leadId, date, time, description);
    if (result.success) {
      toast.success("Visita agendada para cliente existente!");
    } else if ((result as any).error === "duplicate") {
      toast.warning((result as any).message || "Visita já agendada para esta data");
    } else {
      toast.error("Erro ao agendar visita");
    }
    return result;
  };

  // Action handlers
  const openProspeccao = useCallback((visit: ScheduledVisit) => {
    if (!visit.estabelecimentoData) return;

    const ed = visit.estabelecimentoData;

    setProspeccaoData({
      reminderId: visit.id,
      place: {
        name: ed.nome || "",
        address: ed.endereco || "",
        lat: ed.lat || 0,
        lng: ed.lng || 0,
        placeId: "",
        // Pass structured address components from scheduled visit
        addressComponents: {
          route: ed.endereco?.split(',')[0]?.trim(),
          streetNumber: ed.numero || undefined,
          neighborhood: ed.bairro || undefined,
          city: ed.cidade || undefined,
          state: ed.estado || undefined,
          postalCode: ed.cep || undefined,
        },
      },
    });
    setProspeccaoSheetOpen(true);
  }, []);

  const openRetorno = useCallback((visit: ScheduledVisit, visitType: string) => {
    const lead = leads.find(l => l.id === visit.leadId);
    if (!lead) return;

    setRetornoData({
      reminderId: visit.id,
      lead,
      visitType,
    });
    setRetornoSheetOpen(true);
  }, [leads]);

  const openPerfil = useCallback((visit: ScheduledVisit) => {
    const lead = leads.find(l => l.id === visit.leadId);
    if (!lead) return;

    setSelectedLeadForProfile(lead);
    setProfileSheetOpen(true);
  }, [leads]);

  const handleLeadSaved = async (leadId: string) => {
    if (prospeccaoData?.reminderId) {
      await updateReminderWithLead(prospeccaoData.reminderId, leadId);
      toast.success("Prospecção concluída e visita finalizada!");
    }
    setProspeccaoSheetOpen(false);
    setProspeccaoData(null);
    refetch();
  };

  const handleRetornoCompleted = async () => {
    if (retornoData?.reminderId) {
      await updateReminderStatus(retornoData.reminderId, "concluido");
      toast.success("Visita concluída!");
    }
    setRetornoSheetOpen(false);
    setRetornoData(null);
    refetch();
  };

  // Determine which action to show based on lead status
  const getActionConfig = useCallback((visit: ScheduledVisit): ActionConfig => {
    // Sem lead: prospecção
    if (!visit.hasLead || !visit.leadId) {
      return {
        type: "prospeccao",
        label: "Prospecção",
        icon: UserPlus,
        variant: "outline",
      };
    }

    const funilApp = visit.funilApp ?? 1;

    // Credenciado (5) - visita de cliente
    if (funilApp === 5) {
      return {
        type: "cliente",
        label: "Visita Cliente",
        icon: Heart,
        variant: "outline",
      };
    }

    // Congelado (6) - reativar
    if (funilApp === 6) {
      return {
        type: "reativar",
        label: "Reativar",
        icon: RefreshCw,
        variant: "outline",
      };
    }

    // Cred. Pendente (7) - acompanhar
    if (funilApp === 7) {
      return {
        type: "acompanhar",
        label: "Acompanhar",
        icon: FileText,
        variant: "outline",
      };
    }

    // Lead em andamento (1-4) - Sugerir próxima etapa

    // Funil 1 (Prospecção) -> Prox: Qualificar
    if (funilApp === 1) {
      return { type: "qualificar", label: "Qualificar", icon: UserPlus, variant: "default" };
    }
    // Funil 2 (Qualificação) -> Prox: Negociar
    if (funilApp === 2) {
      return { type: "negociar", label: "Negociar", icon: UserPlus, variant: "default" };
    }
    // Funil 3 (Negociação) -> Prox: Precificar
    if (funilApp === 3) {
      return { type: "precificar", label: "Precificar", icon: UserPlus, variant: "default" };
    }
    // Funil 4 (Precificação) -> Prox: Credenciar
    if (funilApp === 4) {
      return { type: "credenciar", label: "Credenciar", icon: UserPlus, variant: "default" };
    }

    return {
      type: "retorno",
      label: "Retorno",
      icon: RotateCcw,
      variant: "outline",
    };
  }, []);

  const handleActionClick = useCallback((visit: ScheduledVisit, actionType: ActionType) => {
    switch (actionType) {
      case "prospeccao":
        openProspeccao(visit);
        break;
      case "retorno":
      case "qualificar":
      case "negociar":
      case "precificar":
      case "credenciar":
        openRetorno(visit, actionType);
        break;
      case "cliente":
        openRetorno(visit, "visita-cliente");
        break;
      case "reativar":
        openRetorno(visit, "reativar");
        break;
      case "acompanhar":
        openPerfil(visit);
        break;
    }
  }, [openProspeccao, openRetorno, openPerfil]);

  // Get funil info for badge
  const getFunilInfo = (funilApp: number | null) => {
    if (!funilApp) return null;
    return FUNIL.find(f => f.id === funilApp);
  };

  const isLoading = remindersLoading || leadsLoading;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Calendar */}
      <Card className="glass lg:w-auto">
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            modifiers={{
              hasVisit: datesWithVisits,
            }}
            modifiersStyles={{
              hasVisit: {
                fontWeight: "bold",
                textDecoration: "underline",
                textDecorationColor: "hsl(var(--primary))",
              },
            }}
            className="pointer-events-auto w-full"
          />
        </CardContent>
      </Card>

      {/* Visits List */}
      <Card className="glass flex-1 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="capitalize">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="whitespace-nowrap">
                {visitsForSelectedDate.length} visita(s)
              </Badge>
              <Button
                size="sm"
                onClick={() => setAddVisitOpen(true)}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 overflow-y-auto max-h-[calc(100vh-350px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : visitsForSelectedDate.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma visita agendada</p>
              <p className="text-xs mt-1">
                Clique em "Nova" para agendar uma visita
              </p>
            </div>
          ) : (
            visitsForSelectedDate.map((visit) => {
              const actionConfig = getActionConfig(visit);
              const Icon = actionConfig.icon;
              const funilInfo = getFunilInfo(visit.funilApp);

              return (
                <div
                  key={visit.id}
                  className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold truncate">
                          {visit.hasLead ? `#${visit.leadCod} - ` : ""}{visit.leadName}
                        </h4>
                        <Badge
                          variant="secondary"
                          className={statusConfig[visit.status].color}
                        >
                          {statusConfig[visit.status].label}
                        </Badge>
                        {/* Funil Badge for leads */}
                        {visit.hasLead && funilInfo && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${funilInfo.color} ${funilInfo.textColor} border-0`}
                          >
                            {funilInfo.label}
                          </Badge>
                        )}
                        {/* Novo badge for appointments without lead */}
                        {!visit.hasLead && (
                          <Badge variant="outline" className="text-xs">
                            Novo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{visit.address}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {visit.time}
                        </span>
                        {visit.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {visit.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {visit.status === "pending" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        variant={actionConfig.variant}
                        className="flex-1 h-9"
                        onClick={() => handleActionClick(visit, actionConfig.type)}
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {actionConfig.label}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9"
                        onClick={() => cancelVisit(visit.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add Visit Dialog */}
      <AddVisitDialog
        open={addVisitOpen}
        onOpenChange={setAddVisitOpen}
        leads={leads}
        leadsLoading={leadsLoading}
        selectedDate={selectedDate}
        onSave={handleSaveVisit}
        onSaveWithLead={handleSaveVisitWithLead}
        initialPlace={addVisitInitialPlace}
      />

      {/* Prospecção Sheet - for new leads */}
      <LaunchVisitSheet
        open={prospeccaoSheetOpen}
        onOpenChange={setProspeccaoSheetOpen}
        leads={leads}
        initialPlace={prospeccaoData?.place}
        initialType="novo-cliente"
        reminderId={prospeccaoData?.reminderId}
        onLeadSavedWithId={handleLeadSaved}
      />

      {/* Retorno Sheet - for existing leads */}
      <LaunchVisitSheet
        open={retornoSheetOpen}
        onOpenChange={setRetornoSheetOpen}
        leads={leads}
        selectedLead={retornoData?.lead}
        initialType="retorno"
        directAction={retornoData?.visitType}
        reminderId={retornoData?.reminderId}
        onLeadSaved={handleRetornoCompleted}
      />

      {/* Profile Sheet - for pending credenciamento */}
      <LeadDetailSheet
        lead={selectedLeadForProfile}
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        onContinuarCadastro={(lead, action) => {
          setProfileSheetOpen(false);
          // Find the visit for this lead to get reminderId
          const visit = visits.find(v => v.leadId === lead.id && v.status === "pending");
          if (visit) {
            updateReminderStatus(visit.id, "concluido");
          }
          refetch();
        }}
        onEditar={(lead, action) => {
          setProfileSheetOpen(false);
          setRetornoData({
            reminderId: visits.find(v => v.leadId === lead.id)?.id || "",
            lead,
            visitType: action,
          });
          setRetornoSheetOpen(true);
        }}
      />
    </div>
  );
}
