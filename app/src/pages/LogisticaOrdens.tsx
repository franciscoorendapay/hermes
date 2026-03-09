import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Package, Truck, MapPin, Phone, CheckCircle, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { isOrdemAtrasada } from "@/lib/slaUtils";

interface OrdemServico {
  id: string;
  lead_id: string;
  user_id: string;
  tipo: string;
  quantidade: number;
  status: string;
  observacao: string | null;
  atendido_por: string | null;
  data_atendimento: string | null;
  created_at: string;
  prazo_entrega: string | null;
  entregue_no_prazo: boolean | null;
  leads?: {
    nome_fantasia: string;
    telefone: string | null;
    endereco_logradouro: string | null;
    endereco_numero: string | null;
    endereco_bairro: string | null;
    endereco_cidade: string | null;
    endereco_estado: string | null;
    endereco_cep: string | null;
    lead_credenciamento?: {
      responsavel_nome: string | null;
    } | null;
  };
  profiles?: {
    nome: string;
  } | null;
}

const statusOptions = [
  { value: "pendente", label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "concluida", label: "Concluída", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "cancelada", label: "Cancelada", color: "bg-red-100 text-red-800 border-red-300" },
];

const tipoLabels: Record<string, string> = {
  bobinas: "Envio de Bobinas",
  entrega_equipamento: "Entrega de Equipamento",
  troca_equipamento: "Troca de Equipamento",
  retirada_equipamento: "Retirada de Equipamento",
  nova_maquina: "Nova Máquina",
};

export default function LogisticaOrdens() {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("pendente");
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrdens = async () => {
    try {
      const { data: ordensData, error } = await supabase
        .from("ordens_servico")
        .select(`
          *,
          leads!inner (
            nome_fantasia,
            telefone,
            endereco_logradouro,
            endereco_numero,
            endereco_bairro,
            endereco_cidade,
            endereco_estado,
            endereco_cep,
            lead_credenciamento (
              responsavel_nome
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const userIds = [...new Set((ordensData || []).map(o => o.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, nome")
        .in("id", userIds);
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      const ordensWithProfiles = (ordensData || []).map(ordem => ({
        ...ordem,
        profiles: profilesMap.get(ordem.user_id) || null
      }));
      
      setOrdens(ordensWithProfiles as OrdemServico[]);
    } catch (err) {
      console.error("Erro ao carregar ordens:", err);
      toast.error("Erro ao carregar ordens de serviço");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrdens();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrdens();
  };

  const handleStatusChange = async (ordemId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const updateData: Record<string, unknown> = { 
        status: newStatus 
      };
      
      if (newStatus === "concluida" && user) {
        updateData.atendido_por = user.id;
        updateData.data_atendimento = new Date().toISOString();
        // Verificar se foi entregue no prazo
        const ordem = ordens.find(o => o.id === ordemId);
        if (ordem?.prazo_entrega) {
          updateData.entregue_no_prazo = new Date() <= new Date(ordem.prazo_entrega);
        } else {
          updateData.entregue_no_prazo = true; // Se não tem prazo, considera no prazo
        }
      }

      const { error } = await supabase
        .from("ordens_servico")
        .update(updateData)
        .eq("id", ordemId);

      if (error) throw error;

      toast.success("Status atualizado com sucesso!");
      fetchOrdens();
      setDetailsOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrdens = filterStatus === "all" 
    ? ordens 
    : filterStatus === "atrasados"
    ? ordens.filter(o => isOrdemAtrasada(o.status, o.prazo_entrega))
    : ordens.filter(o => o.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return (
      <Badge variant="outline" className={`whitespace-nowrap ${statusConfig?.color || ""}`}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const openDetails = (ordem: OrdemServico) => {
    setSelectedOrdem(ordem);
    setDetailsOpen(true);
  };

  const formatEndereco = (leads: OrdemServico["leads"]) => {
    if (!leads) return "-";
    const parts = [
      leads.endereco_logradouro,
      leads.endereco_numero,
      leads.endereco_bairro,
      leads.endereco_cidade,
      leads.endereco_estado,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "-";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Ordens de Serviço</h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filter */}
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="atrasados">
            <span className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Atrasados
            </span>
          </SelectItem>
          {statusOptions.map(s => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Orders List */}
      {filteredOrdens.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma ordem encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrdens.map((ordem) => (
            <Card 
              key={ordem.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openDetails(ordem)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {ordem.leads?.nome_fantasia || "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tipoLabels[ordem.tipo] || ordem.tipo} • {ordem.quantidade} un
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ordem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {isOrdemAtrasada(ordem.status, ordem.prazo_entrega) && (
                        <Badge variant="destructive" className="whitespace-nowrap text-[10px] px-1.5 py-0">
                          <AlertTriangle className="h-3 w-3 mr-0.5" />
                          Atrasado
                        </Badge>
                      )}
                      {getStatusBadge(ordem.status)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {ordem.profiles?.nome || "Comercial"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem</DialogTitle>
          </DialogHeader>
          
          {selectedOrdem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">
                      {selectedOrdem.leads?.nome_fantasia}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tipoLabels[selectedOrdem.tipo] || selectedOrdem.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado em {format(new Date(selectedOrdem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isOrdemAtrasada(selectedOrdem.status, selectedOrdem.prazo_entrega) && (
                      <Badge variant="destructive" className="whitespace-nowrap">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Atrasado
                      </Badge>
                    )}
                    {getStatusBadge(selectedOrdem.status)}
                  </div>
                </div>
                
                {selectedOrdem.prazo_entrega && (
                  <div className={`flex items-center gap-2 text-sm mt-2 ${isOrdemAtrasada(selectedOrdem.status, selectedOrdem.prazo_entrega) ? 'text-red-600' : 'text-muted-foreground'}`}>
                    <Clock className="h-4 w-4" />
                    <span>
                      Prazo: {format(new Date(selectedOrdem.prazo_entrega), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{selectedOrdem.quantidade}</strong> unidade(s)
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{formatEndereco(selectedOrdem.leads)}</p>
                    {selectedOrdem.leads?.endereco_cep && (
                      <p className="text-muted-foreground">
                        CEP: {selectedOrdem.leads.endereco_cep}
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedOrdem.leads?.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${selectedOrdem.leads.telefone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedOrdem.leads.telefone}
                    </a>
                  </div>
                )}

                {selectedOrdem.observacao && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Observação:</p>
                    <p className="text-sm">{selectedOrdem.observacao}</p>
                  </div>
                )}

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Responsável (TD):</p>
                  <p className="text-sm font-medium">
                    {selectedOrdem.leads?.lead_credenciamento?.responsavel_nome || "Não informado"}
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Solicitante:</p>
                  <p className="text-sm font-medium">{selectedOrdem.profiles?.nome || "Não informado"}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Atualizar Status:</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <Button
                      key={status.value}
                      size="sm"
                      variant={selectedOrdem.status === status.value ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedOrdem.id, status.value)}
                      disabled={updatingStatus || selectedOrdem.status === status.value}
                    >
                      {status.value === "em_andamento" && <Truck className="h-3 w-3 mr-1" />}
                      {status.value === "concluida" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {status.value === "pendente" && <Clock className="h-3 w-3 mr-1" />}
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
