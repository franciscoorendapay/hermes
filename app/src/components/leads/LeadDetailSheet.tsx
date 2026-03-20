import { useState, useEffect } from "react";
import { Lead } from "@/hooks/useLeads";
import { FUNIL } from "@/constants/funil";
import { MCC_ABECS } from "@/constants/mccAbecs";
import { formatMoney, formatCpfCnpj, formatPhone, getRegiaoByEstado } from "@/lib/formatters";
import { calcularPrazoEntrega } from "@/lib/slaUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Pencil,
  ArrowRight,
  History,
  CheckCircle,
  Lock,
  MapPin,
  Calendar,
  Package,
  Truck,
  ScrollText,
  RefreshCw,
  PackageMinus,
  Send,
} from "lucide-react";
import { accreditationsService } from "@/features/accreditations/accreditations.service";
import { visitsService } from "@/features/visits/visits.service";
import type { Tables } from "@/integrations/supabase/types";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinuarCadastro: (lead: Lead, action: string) => void;
  onEditar: (lead: Lead, action: string) => void;
}

// Mapeia funil_app para a ação de edição correspondente
const getEditarActionByFunil = (funilId: number | null): string => {
  switch (funilId) {
    case 1: return "prospeccao";
    case 2: return "qualificacao";
    case 3: return "negociacao";
    case 4:
    case 5: return "precificacao";
    default: return "prospeccao";
  }
};

const AVATAR_COLORS: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-yellow-500",
  3: "bg-purple-500",
  4: "bg-orange-500",
  5: "bg-green-500",
  6: "bg-gray-500",
  7: "bg-amber-500",
  8: "bg-slate-500",
};

const getProximaAcao = (funilId: number | null): { action: string; label: string } | null => {
  switch (funilId) {
    case 1: return { action: "qualificar", label: "Qualificar" };
    case 2: return { action: "negociar", label: "Negociar" };
    case 3: return { action: "precificar", label: "Precificar" };
    case 4: return { action: "credenciar", label: "Credenciar" };
    case 7: return { action: "finalizar_credenciamento", label: "Finalizar Credenciamento" };
    default: return null;
  }
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const getMccDescription = (mccCode: string | null | undefined): string => {
  if (!mccCode) return "-";
  const mcc = MCC_ABECS.find(m => m.code === mccCode);
  return mcc ? `${mccCode} - ${mcc.description.toUpperCase()}` : mccCode;
};

interface InfoFieldProps {
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

const InfoField = ({ label, value, className = "" }: InfoFieldProps) => (
  <div className={className}>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-sm font-medium text-foreground">{value || "-"}</p>
  </div>
);

import { type Visit } from "@/features/visits/visits.types";

interface OrdemServico {
  id: string;
  tipo: string;
  quantidade: number;
  status: string;
  observacao: string | null;
  created_at: string;
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  onContinuarCadastro,
  onEditar,
}: LeadDetailSheetProps) {
  const [visitas, setVisitas] = useState<Visit[]>([]);
  const [loadingVisitas, setLoadingVisitas] = useState(false);

  // Estados para ordens de serviço
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loadingOrdens, setLoadingOrdens] = useState(false);

  // Estados para modal de bobinas
  const [showBobinasModal, setShowBobinasModal] = useState(false);
  const [qtdBobinas, setQtdBobinas] = useState("2");
  const [observacaoBobinas, setObservacaoBobinas] = useState("");
  const [submittingBobinas, setSubmittingBobinas] = useState(false);

  // Estados para modal de troca de máquina
  const [showTrocaModal, setShowTrocaModal] = useState(false);
  const [observacaoTroca, setObservacaoTroca] = useState("");
  const [submittingTroca, setSubmittingTroca] = useState(false);

  // Estados para modal de retirada de equipamento
  const [showRetiradaModal, setShowRetiradaModal] = useState(false);
  const [qtdRetirada, setQtdRetirada] = useState("1");
  const [observacaoRetirada, setObservacaoRetirada] = useState("");
  const [submittingRetirada, setSubmittingRetirada] = useState(false);

  // Estados para reenviar credenciamento
  const [resendingAccreditation, setResendingAccreditation] = useState(false);

  const fetchOrdensServico = async () => {
    if (!lead?.id) return;
    setLoadingOrdens(true);
    const { data } = await supabase
      .from("ordens_servico")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });
    setOrdensServico(data || []);
    setLoadingOrdens(false);
  };

  useEffect(() => {
    if (lead?.id && open) {
      // Carregar histórico de visitas
      setLoadingVisitas(true);
      visitsService.fetchLeadVisits(lead.id)
        .then((data) => {
          setVisitas(data || []);
        })
        .catch((err) => {
          console.error("Erro ao carregar visitas:", err);
          setVisitas([]);
        })
        .finally(() => {
          setLoadingVisitas(false);
        });

      // Carregar ordens de serviço
      fetchOrdensServico();
    } else if (!open) {
      setVisitas([]);
      setOrdensServico([]);
    }
  }, [lead?.id, open]);

  const handleSolicitarBobinas = async () => {
    if (!lead) return;

    setSubmittingBobinas(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      // Buscar configuração de SLA
      const { data: slaConfig } = await supabase
        .from("sla_config")
        .select("prazo_dias")
        .eq("tipo", "bobinas")
        .maybeSingle();

      const prazoEntrega = calcularPrazoEntrega(slaConfig?.prazo_dias || 1);

      const { error } = await supabase.from("ordens_servico").insert({
        lead_id: lead.id,
        user_id: userData.user.id,
        tipo: "bobinas",
        quantidade: parseInt(qtdBobinas),
        observacao: observacaoBobinas || null,
        prazo_entrega: prazoEntrega.toISOString(),
      });

      if (error) throw error;

      toast.success("Solicitação de bobinas enviada!");
      setShowBobinasModal(false);
      setQtdBobinas("2");
      setObservacaoBobinas("");
      fetchOrdensServico();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao solicitar bobinas");
    } finally {
      setSubmittingBobinas(false);
    }
  };

  const handleSolicitarTroca = async () => {
    if (!lead) return;

    setSubmittingTroca(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      // Buscar configuração de SLA
      const { data: slaConfig } = await supabase
        .from("sla_config")
        .select("prazo_dias")
        .eq("tipo", "troca_equipamento")
        .maybeSingle();

      const prazoEntrega = calcularPrazoEntrega(slaConfig?.prazo_dias || 2);

      const { error } = await supabase.from("ordens_servico").insert({
        lead_id: lead.id,
        user_id: userData.user.id,
        tipo: "troca_equipamento",
        quantidade: 1,
        observacao: observacaoTroca || null,
        prazo_entrega: prazoEntrega.toISOString(),
      });

      if (error) throw error;

      toast.success("Solicitação de troca de máquina enviada!");
      setShowTrocaModal(false);
      setObservacaoTroca("");
      fetchOrdensServico();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao solicitar troca");
    } finally {
      setSubmittingTroca(false);
    }
  };

  const handleSolicitarRetirada = async () => {
    if (!lead) return;

    setSubmittingRetirada(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      // Buscar configuração de SLA
      const { data: slaConfig } = await supabase
        .from("sla_config")
        .select("prazo_dias")
        .eq("tipo", "retirada_equipamento")
        .maybeSingle();

      const prazoEntrega = calcularPrazoEntrega(slaConfig?.prazo_dias || 3);

      const { error } = await supabase.from("ordens_servico").insert({
        lead_id: lead.id,
        user_id: userData.user.id,
        tipo: "retirada_equipamento",
        quantidade: parseInt(qtdRetirada),
        observacao: observacaoRetirada || null,
        prazo_entrega: prazoEntrega.toISOString(),
      });

      if (error) throw error;

      toast.success("Solicitação de retirada enviada!");
      setShowRetiradaModal(false);
      setQtdRetirada("1");
      setObservacaoRetirada("");
      fetchOrdensServico();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao solicitar retirada");
    } finally {
      setSubmittingRetirada(false);
    }
  };

  // Função para obter label do tipo de ordem
  const getTipoOrdemLabel = (tipo: string, quantidade: number): string => {
    switch (tipo) {
      case "bobinas":
        return quantidade === 10 ? "1 caixa (10 un)" : `${quantidade} bobinas`;
      case "troca_equipamento":
        return "Troca de Máquina";
      case "retirada_equipamento":
        return `Retirada (${quantidade} equip.)`;
      default:
        return tipo;
    }
  };

  // Handler para reenviar credenciamento
  const handleResendAccreditation = async () => {
    if (!lead?.cod_lead || !lead?.id) return;

    setResendingAccreditation(true);
    try {
      const result = await accreditationsService.resendAccreditation(lead.id);

      if (result.success) {
        toast.success(result.message || "Credenciamento reenviado com sucesso!");
        onOpenChange(false); // Fecha o sheet
      } else {
        toast.error(result.error || "Erro ao reenviar credenciamento");
      }
    } catch (error: any) {
      console.error("Erro ao reenviar credenciamento:", error);
      toast.error("Erro ao reenviar credenciamento");
    } finally {
      setResendingAccreditation(false);
    }
  };

  if (!lead) return null;

  const funilId = lead.funil_app ?? 1;
  const funilStatus = FUNIL.find((f) => f.id === funilId);
  const proximaAcao = getProximaAcao(lead.funil_app);
  const isCliente = lead.funil_app === 5;
  const isCredenciado = lead.funil_app === 5 && lead.credenciado === 1;
  const isEmAnalise = lead.funil_app === 7; // Status "em análise"
  const avatarColor = AVATAR_COLORS[funilId] || "bg-gray-500";

  const formatTaxa = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "-";
    return `${value}%`;
  };

  const bandeiras = [
    { nome: "Visa", prefixo: "visa" },
    { nome: "Mastercard", prefixo: "master" },
    { nome: "Elo", prefixo: "elo" },
    { nome: "Outras", prefixo: "outras" },
  ] as const;

  const endereco = [
    lead.endereco_logradouro,
    lead.endereco_numero,
    lead.endereco_cidade,
  ]
    .filter(Boolean)
    .join(", ");

  const enderecoCompleto = endereco
    ? `${endereco}${lead.endereco_estado ? ` - ${lead.endereco_estado}` : ""}${lead.endereco_cep ? ` - ${lead.endereco_cep}` : ""}`
    : "-";

  const regiao = getRegiaoByEstado(lead.endereco_estado);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden">
        <SheetHeader className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div
              className={`h-14 w-14 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold text-lg flex-shrink-0`}
            >
              {getInitials(lead.nome_fantasia)}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left text-lg truncate">
                {lead.nome_fantasia}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1 text-left">
                {lead.endereco_cidade ? `${lead.endereco_cidade}, ${lead.endereco_estado}` : "Endereço não informado"}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 pb-4 flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs defaultValue="resumo" className="w-full flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full bg-muted/50 rounded-full p-1 h-auto">
              <TabsTrigger
                value="resumo"
                className="flex-1 rounded-full py-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Resumo
              </TabsTrigger>
              <TabsTrigger
                value="negociacao"
                className="flex-1 rounded-full py-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Negociação
              </TabsTrigger>
              <TabsTrigger
                value="logistica"
                className="flex-1 rounded-full py-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Logística
              </TabsTrigger>
              <TabsTrigger
                value="historico"
                className="flex-1 rounded-full py-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Histórico
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              {/* Tab Resumo */}
              <TabsContent value="resumo" className="mt-0">
                <Card className="border shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoField
                        label="Nome do cliente"
                        value={lead.nome_fantasia}
                      />
                      <InfoField
                        label="Contato"
                        value={lead.nome1 || "-"}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <InfoField
                        label="Telefone"
                        value={lead.telefone ? formatPhone(lead.telefone) : "-"}
                      />
                      <InfoField
                        label="Email"
                        value={lead.email || "-"}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <InfoField
                        label="CPF/CNPJ"
                        value={lead.doc ? formatCpfCnpj(lead.doc) : "-"}
                      />
                      <InfoField
                        label="Data de cadastro"
                        value={lead.data_registro
                          ? format(new Date(lead.data_registro), "dd/MM/yyyy", { locale: ptBR })
                          : "-"
                        }
                      />
                    </div>

                    <InfoField
                      label="Razão Social"
                      value={lead.razao_social || "-"}
                    />

                    <InfoField
                      label="MCC"
                      value={getMccDescription(lead.mcc)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InfoField
                        label="TPV Informado"
                        value={lead.tpv ? formatMoney(Number(lead.tpv)) : "-"}
                      />
                      <InfoField
                        label="Segmento"
                        value={lead.segmento || "-"}
                      />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status do cadastro</p>
                      {funilStatus && (
                        <Badge
                          variant="outline"
                          className={`${funilStatus.color} ${funilStatus.textColor} border-0`}
                        >
                          {funilStatus.label}
                        </Badge>
                      )}
                    </div>

                    <InfoField
                      label="Endereço"
                      value={enderecoCompleto}
                    />

                    <InfoField
                      label="Região"
                      value={regiao}
                    />

                    {lead.observacao && (
                      <InfoField
                        label="Observações"
                        value={lead.observacao}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Negociação */}
              <TabsContent value="negociacao" className="mt-0">
                <Card className="border shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    {/* Indicador de status - bloqueado após credenciamento */}
                    {isCliente && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                        <Lock className="h-4 w-4" />
                        <span>Taxas aprovadas — não podem ser alteradas</span>
                      </div>
                    )}

                    {!lead.taxa_pix && !lead.taxa_antecipacao ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <div className="text-center">
                          <p className="text-sm">Nenhuma precificação registrada</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Taxa PIX e Antecipação */}
                        <div className="grid grid-cols-2 gap-4">
                          <InfoField
                            label="Taxa PIX"
                            value={formatTaxa(lead.taxa_pix)}
                          />
                          <InfoField
                            label="Taxa Antecipação"
                            value={formatTaxa(lead.taxa_antecipacao)}
                          />
                        </div>

                        {/* Taxas por Bandeira */}
                        {bandeiras.map((bandeira) => (
                          <div key={bandeira.prefixo} className="pt-3 border-t">
                            <p className="text-sm font-medium text-foreground mb-3">{bandeira.nome}</p>
                            <div className="grid grid-cols-3 gap-3">
                              <InfoField
                                label="Débito"
                                value={formatTaxa(lead[`${bandeira.prefixo}_debito` as keyof Lead] as number | null)}
                              />
                              <InfoField
                                label="Crédito"
                                value={formatTaxa(lead[`${bandeira.prefixo}_credito_vista` as keyof Lead] as number | null)}
                              />
                              <InfoField
                                label="2-6x"
                                value={formatTaxa(lead[`${bandeira.prefixo}_parcelado_2a6` as keyof Lead] as number | null)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <InfoField
                                label="7-12x"
                                value={formatTaxa(lead[`${bandeira.prefixo}_parcelado_7a12` as keyof Lead] as number | null)}
                              />
                              <InfoField
                                label="13-18x"
                                value={formatTaxa(lead[`${bandeira.prefixo}_parcelado_13a18` as keyof Lead] as number | null)}
                              />
                            </div>
                          </div>
                        ))}

                        {/* Prazo de Recebimento */}
                        <div className="pt-3 border-t">
                          <InfoField
                            label="Prazo de Recebimento"
                            value={lead.prazo_recebimento || "-"}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Logística */}
              <TabsContent value="logistica" className="mt-0">
                <Card className="border shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Equipamentos</h3>
                    </div>

                    <InfoField
                      label="Quantidade de Equipamentos"
                      value={lead.qtd_equipamentos ? `${lead.qtd_equipamentos} máquina(s)` : "Não informado"}
                    />

                    {/* Placeholder para futura lista de equipamentos */}
                    <div className="p-4 border rounded-lg bg-muted/30 text-center">
                      <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Informações de serial number e chip serão adicionadas após instalação
                      </p>
                    </div>

                    {/* Seção Solicitações */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Solicitações</h3>
                      </div>

                      {!isCredenciado ? (
                        <p className="text-xs text-muted-foreground mb-3">
                          Disponível apenas para clientes credenciados
                        </p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setShowBobinasModal(true)}
                          >
                            <ScrollText className="h-4 w-4 mr-2" />
                            Solicitar Bobinas
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setShowTrocaModal(true)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Solicitar Troca de Máquina
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setShowRetiradaModal(true)}
                          >
                            <PackageMinus className="h-4 w-4 mr-2" />
                            Solicitar Retirada de Equipamento
                          </Button>
                        </div>
                      )}

                      {/* Lista de solicitações */}
                      <p className="text-xs text-muted-foreground mb-2">Histórico de Solicitações</p>
                      {loadingOrdens ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
                      ) : ordensServico.length > 0 ? (
                        <div className="space-y-2">
                          {ordensServico.map(ordem => (
                            <div key={ordem.id} className="p-3 bg-muted/50 rounded-lg border">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{getTipoOrdemLabel(ordem.tipo, ordem.quantidade)}</span>
                                <Badge
                                  variant={ordem.status === 'concluida' ? 'default' : 'outline'}
                                  className={ordem.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 whitespace-nowrap' : 'whitespace-nowrap'}
                                >
                                  {ordem.status === 'pendente' ? 'Pendente' :
                                    ordem.status === 'em_andamento' ? 'Em Andamento' :
                                      ordem.status === 'concluida' ? 'Concluída' : ordem.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Solicitado em {format(new Date(ordem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                              {ordem.observacao && (
                                <p className="text-xs text-foreground mt-1">{ordem.observacao}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma solicitação registrada
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Histórico */}
              <TabsContent value="historico" className="mt-0">
                <Card className="border shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <InfoField
                      label="Observações"
                      value={lead.observacao || "Nenhuma observação registrada."}
                    />

                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-3">Histórico de Visitas</p>
                      {loadingVisitas ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                          <p className="text-sm">Carregando visitas...</p>
                        </div>
                      ) : visitas.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                          <div className="text-center">
                            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma visita registrada</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {visitas.map((visita) => (
                            <div
                              key={visita.id}
                              className="p-3 bg-muted/50 rounded-lg border border-border"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {format(new Date(visita.data_visita || visita.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {visita.status}
                                </Badge>
                              </div>
                              <div className="mt-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground leading-snug">
                                      {visita.endereco_visita && !visita.endereco_visita.startsWith('Erro:') 
                                        ? visita.endereco_visita 
                                        : (visita.lat ? `Coord: ${parseFloat(visita.lat).toFixed(4)}, ${parseFloat(visita.lng || '0').toFixed(4)}` : 'Local não registrado')}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                      {visita.endereco_visita?.startsWith('Erro:') ? visita.endereco_visita : (visita.tipo || '').replace(/_/g, ' ')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {visita.observacao && (
                                <p className="text-sm text-foreground mt-2 line-clamp-2">
                                  {visita.observacao}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Footer Actions - Oculto para leads credenciados */}
        {!isCredenciado && (
          <div className="flex-shrink-0 p-4 border-t bg-background flex gap-3">
            {/* Botão Reenviar Credenciamento para leads em análise */}
            {isEmAnalise ? (
              <Button
                className="flex-1 gradient-dark text-white border-0"
                onClick={handleResendAccreditation}
                disabled={resendingAccreditation}
              >
                {resendingAccreditation ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Reenviar Credenciamento
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEditar(lead, getEditarActionByFunil(lead.funil_app))}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {proximaAcao && (
                  <Button
                    className="flex-1 gradient-dark text-white border-0"
                    onClick={() => onContinuarCadastro(lead, proximaAcao.action)}
                  >
                    {proximaAcao.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </SheetContent>

      {/* Modal Solicitar Bobinas */}
      <Dialog open={showBobinasModal} onOpenChange={setShowBobinasModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Bobinas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantidade de Bobinas</Label>
              <Select value={qtdBobinas} onValueChange={setQtdBobinas}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 unidades</SelectItem>
                  <SelectItem value="4">4 unidades</SelectItem>
                  <SelectItem value="6">6 unidades</SelectItem>
                  <SelectItem value="8">8 unidades</SelectItem>
                  <SelectItem value="10">10 unidades (1 caixa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Informações adicionais para a logística..."
                value={observacaoBobinas}
                onChange={(e) => setObservacaoBobinas(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setShowBobinasModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitarBobinas} disabled={submittingBobinas}>
              {submittingBobinas ? "Enviando..." : "Solicitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Solicitar Troca de Máquina */}
      <Dialog open={showTrocaModal} onOpenChange={setShowTrocaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Troca de Máquina</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              A máquina atual será substituída por uma nova. Informe o motivo da troca para que a logística possa providenciar o equipamento adequado.
            </p>

            <div className="space-y-2">
              <Label>Motivo da Troca</Label>
              <Textarea
                placeholder="Ex: Máquina com defeito no visor, problemas de conexão..."
                value={observacaoTroca}
                onChange={(e) => setObservacaoTroca(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setShowTrocaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitarTroca} disabled={submittingTroca}>
              {submittingTroca ? "Enviando..." : "Solicitar Troca"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Solicitar Retirada de Equipamento */}
      <Dialog open={showRetiradaModal} onOpenChange={setShowRetiradaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Retirada de Equipamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Solicite a retirada de equipamentos do cliente. Esta ação pode indicar encerramento de contrato ou devolução parcial.
            </p>

            <div className="space-y-2">
              <Label>Quantidade de Equipamentos</Label>
              <Select value={qtdRetirada} onValueChange={setQtdRetirada}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: lead?.qtd_equipamentos || 5 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={String(num)}>
                      {num} equipamento(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo da Retirada</Label>
              <Textarea
                placeholder="Ex: Encerramento de contrato, redução de operação..."
                value={observacaoRetirada}
                onChange={(e) => setObservacaoRetirada(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setShowRetiradaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitarRetirada} disabled={submittingRetirada}>
              {submittingRetirada ? "Enviando..." : "Solicitar Retirada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
