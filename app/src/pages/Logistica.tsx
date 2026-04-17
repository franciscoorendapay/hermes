import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { logisticaService, OrdemLogistica } from "@/features/logistica/logistica.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Package, Truck, MapPin, Phone, CheckCircle, Clock, XCircle, RefreshCw, PackageMinus } from "lucide-react";

const statusOptions = [
  { value: "pendente",     label: "Pendente",     color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "concluido",    label: "Concluído",    color: "bg-green-100 text-green-800 border-green-300" },
  { value: "cancelado",    label: "Cancelado",    color: "bg-red-100 text-red-800 border-red-300" },
];

const tipoConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  bobinas:              { label: "Bobinas",              icon: Package,      color: "text-blue-600" },
  entrega_equipamento:  { label: "Entrega de Equip.",    icon: Truck,        color: "text-green-600" },
  troca_equipamento:    { label: "Troca de Máquina",     icon: RefreshCw,    color: "text-amber-600" },
  retirada_equipamento: { label: "Retirada de Equip.",   icon: PackageMinus, color: "text-red-600" },
};

export default function Logistica() {
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();
  const { isLogistica, isAdmin, isLoading: roleLoading } = useUserRole();
  const [ordens, setOrdens] = useState<OrdemLogistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemLogistica | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!authLoading && !roleLoading && !isLogistica && !isAdmin) {
      navigate("/dashboard", { replace: true });
      toast.error("Acesso restrito ao setor de logística");
    }
  }, [authLoading, roleLoading, isLogistica, isAdmin, navigate]);

  useEffect(() => {
    if (isLogistica || isAdmin) {
      fetchOrdens();
    }
  }, [isLogistica, isAdmin]);

  const fetchOrdens = async () => {
    setLoading(true);
    try {
      const data = await logisticaService.listarOrdens();
      setOrdens(data);
    } catch (err) {
      console.error("Erro ao carregar ordens:", err);
      toast.error("Erro ao carregar ordens de serviço");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ordemId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await logisticaService.atualizarStatus(ordemId, newStatus);
      toast.success("Status atualizado com sucesso!");
      setSelectedOrdem(prev => prev ? { ...prev, status: newStatus } : null);
      setOrdens(prev => prev.map(o => o.id === ordemId ? { ...o, status: newStatus } : o));
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
    : ordens.filter(o => o.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const s = statusOptions.find(x => x.value === status);
    return (
      <Badge variant="outline" className={s?.color || ""}>
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

  // Stats gerais
  const pendentes    = ordens.filter(o => o.status === "pendente").length;
  const emAndamento  = ordens.filter(o => o.status === "em_andamento").length;
  const concluidos   = ordens.filter(o => o.status === "concluido").length;

  // Stats por tipo
  const tipoStats = (tipo: string) => ({
    pendente:  ordens.filter(o => o.tipo === tipo && o.status === "pendente").length,
    concluido: ordens.filter(o => o.tipo === tipo && o.status === "concluido").length,
    total:     ordens.filter(o => o.tipo === tipo).length,
  });

  if (authLoading || roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!isLogistica && !isAdmin) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logística"
        description="Gerenciamento de ordens de serviço"
      />

      {/* Cards de status geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{emAndamento}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{concluidos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cards por tipo de solicitação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["bobinas", "troca_equipamento", "retirada_equipamento"] as const).map(tipo => {
          const cfg = tipoConfig[tipo];
          const Icon = cfg.icon;
          const stats = tipoStats(tipo);
          return (
            <Card key={tipo} className="border-dashed">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{cfg.label}</CardTitle>
                <Icon className={`h-4 w-4 ${cfg.color}`} />
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
                    {stats.pendente} pendente{stats.pendente !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                    {stats.concluido} concluído{stats.concluido !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchOrdens}>Atualizar</Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton columns={6} rows={5} />
          ) : filteredOrdens.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ordem de serviço encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdens.map(ordem => {
                  const cfg = tipoConfig[ordem.tipo];
                  const Icon = cfg?.icon ?? Package;
                  return (
                    <TableRow key={ordem.id}>
                      <TableCell className="text-sm">
                        {format(new Date(ordem.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {ordem.leads?.nome_fantasia || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm">
                          <Icon className={`h-3.5 w-3.5 ${cfg?.color ?? ""}`} />
                          {cfg?.label ?? ordem.tipo}
                        </span>
                      </TableCell>
                      <TableCell>{ordem.quantidade}</TableCell>
                      <TableCell>{ordem.created_by?.name || "-"}</TableCell>
                      <TableCell>{getStatusBadge(ordem.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedOrdem(ordem); setDetailsOpen(true); }}>
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem</DialogTitle>
          </DialogHeader>

          {selectedOrdem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">{selectedOrdem.leads?.nome_fantasia || "Cliente"}</p>
                    <p className="text-sm text-muted-foreground">
                      Solicitado em {format(new Date(selectedOrdem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {selectedOrdem.created_by && (
                      <p className="text-xs text-muted-foreground">por {selectedOrdem.created_by.name}</p>
                    )}
                  </div>
                  {getStatusBadge(selectedOrdem.status)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{tipoConfig[selectedOrdem.tipo]?.label ?? selectedOrdem.tipo}</strong>
                    {" — "}{selectedOrdem.quantidade} un.
                  </span>
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
                    <span className="text-sm">{selectedOrdem.leads.telefone}</span>
                  </div>
                )}

                {selectedOrdem.observacao && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Observação:</p>
                    <p className="text-sm">{selectedOrdem.observacao}</p>
                  </div>
                )}
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
