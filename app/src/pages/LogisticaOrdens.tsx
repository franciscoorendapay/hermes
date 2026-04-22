import { useState, useEffect } from "react";
import { logisticaService, OrdemLogistica } from "@/features/logistica/logistica.service";
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
import { Package, Truck, MapPin, Phone, CheckCircle, Clock, RefreshCw } from "lucide-react";

const statusOptions = [
  { value: "pendente",     label: "Pendente",     color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "concluido",    label: "Concluído",    color: "bg-green-100 text-green-800 border-green-300" },
  { value: "cancelado",    label: "Cancelado",    color: "bg-red-100 text-red-800 border-red-300" },
];

const tipoLabels: Record<string, string> = {
  bobinas:              "Envio de Bobinas",
  entrega_equipamento:  "Entrega de Maquininha",
  troca_equipamento:    "Troca de Equipamento",
  retirada_equipamento: "Retirada de Equipamento",
};

const tipoOptions = [
  { value: "all",                  label: "Todos os tipos" },
  { value: "entrega_equipamento",  label: "Entrega de Maquininha" },
  { value: "bobinas",              label: "Envio de Bobinas" },
  { value: "troca_equipamento",    label: "Troca de Equipamento" },
  { value: "retirada_equipamento", label: "Retirada de Equipamento" },
];

export default function LogisticaOrdens() {
  const [ordens, setOrdens] = useState<OrdemLogistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("pendente");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemLogistica | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrdens = async () => {
    try {
      const data = await logisticaService.listarOrdens();
      setOrdens(data);
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
      await logisticaService.atualizarStatus(ordemId, selectedOrdem!.tipo, newStatus);
      toast.success("Status atualizado com sucesso!");
      setOrdens(prev => prev.map(o => o.id === ordemId ? { ...o, status: newStatus } : o));
      setSelectedOrdem(prev => prev ? { ...prev, status: newStatus } : null);
      setDetailsOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrdens = ordens.filter(o => {
    const statusOk = filterStatus === "all" || o.status === filterStatus;
    const tipoOk   = filterTipo   === "all" || o.tipo   === filterTipo;
    return statusOk && tipoOk;
  });

  const getStatusBadge = (status: string) => {
    const s = statusOptions.find(x => x.value === status);
    return (
      <Badge variant="outline" className={`whitespace-nowrap ${s?.color || ""}`}>
        {s?.label || status}
      </Badge>
    );
  };

  const formatEndereco = (leads: OrdemLogistica["leads"]) => {
    if (!leads) return "-";
    return [
      leads.endereco_logradouro,
      leads.endereco_numero,
      leads.endereco_bairro,
      leads.endereco_cidade,
      leads.endereco_estado,
    ].filter(Boolean).join(", ") || "-";
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Ordens de Serviço</h2>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            {tipoOptions.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredOrdens.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma ordem encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrdens.map(ordem => (
            <Card
              key={ordem.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => { setSelectedOrdem(ordem); setDetailsOpen(true); }}
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
                    {getStatusBadge(ordem.status)}
                    <span className="text-[10px] text-muted-foreground">
                      {ordem.created_by?.name || "Comercial"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem</DialogTitle>
          </DialogHeader>

          {selectedOrdem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">{selectedOrdem.leads?.nome_fantasia || "Cliente"}</p>
                    <p className="text-sm text-muted-foreground">
                      {tipoLabels[selectedOrdem.tipo] || selectedOrdem.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado em {format(new Date(selectedOrdem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {getStatusBadge(selectedOrdem.status)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm"><strong>{selectedOrdem.quantidade}</strong> unidade(s)</span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{formatEndereco(selectedOrdem.leads)}</p>
                    {selectedOrdem.leads?.endereco_cep && (
                      <p className="text-muted-foreground">CEP: {selectedOrdem.leads.endereco_cep}</p>
                    )}
                  </div>
                </div>

                {selectedOrdem.leads?.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedOrdem.leads.telefone}`} className="text-sm text-primary hover:underline">
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
                  <p className="text-xs text-muted-foreground mb-1">Solicitante:</p>
                  <p className="text-sm font-medium">{selectedOrdem.created_by?.name || "Não informado"}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Atualizar Status:</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(s => (
                    <Button
                      key={s.value}
                      size="sm"
                      variant={selectedOrdem.status === s.value ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedOrdem.id, s.value)}
                      disabled={updatingStatus || selectedOrdem.status === s.value}
                    >
                      {s.value === "em_andamento" && <Truck className="h-3 w-3 mr-1" />}
                      {s.value === "concluido"    && <CheckCircle className="h-3 w-3 mr-1" />}
                      {s.value === "pendente"     && <Clock className="h-3 w-3 mr-1" />}
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
