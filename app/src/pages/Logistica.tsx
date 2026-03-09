import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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
import { Package, Truck, MapPin, Phone, CheckCircle, Clock, XCircle } from "lucide-react";

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
  leads?: {
    nome_fantasia: string;
    telefone: string | null;
    endereco_logradouro: string | null;
    endereco_numero: string | null;
    endereco_bairro: string | null;
    endereco_cidade: string | null;
    endereco_estado: string | null;
    endereco_cep: string | null;
  };
  profiles?: {
    nome: string;
  };
}

const statusOptions = [
  { value: "pendente", label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "concluida", label: "Concluída", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "cancelada", label: "Cancelada", color: "bg-red-100 text-red-800 border-red-300" },
];

export default function Logistica() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLogistica, isLoading: roleLoading } = useUserRole();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!authLoading && !roleLoading && !isLogistica) {
      navigate("/dashboard", { replace: true });
      toast.error("Acesso restrito ao setor de logística");
    }
  }, [authLoading, roleLoading, isLogistica, navigate]);

  useEffect(() => {
    if (isLogistica) {
      fetchOrdens();
    }
  }, [isLogistica]);

  const fetchOrdens = async () => {
    setLoading(true);
    try {
      // First fetch orders
      const { data: ordensData, error } = await supabase
        .from("ordens_servico")
        .select(`
          *,
          leads (
            nome_fantasia,
            telefone,
            endereco_logradouro,
            endereco_numero,
            endereco_bairro,
            endereco_cidade,
            endereco_estado,
            endereco_cep
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each unique user_id
      const userIds = [...new Set((ordensData || []).map(o => o.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, nome")
        .in("id", userIds);

      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

      // Merge profiles into orders
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
    }
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
    : ordens.filter(o => o.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return (
      <Badge variant="outline" className={statusConfig?.color || ""}>
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

  // Stats
  const pendentes = ordens.filter(o => o.status === "pendente").length;
  const emAndamento = ordens.filter(o => o.status === "em_andamento").length;
  const concluidas = ordens.filter(o => o.status === "concluida").length;

  if (authLoading || roleLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!isLogistica) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logística"
        description="Gerenciamento de ordens de serviço"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{emAndamento}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{concluidas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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

        <Button variant="outline" onClick={fetchOrdens}>
          Atualizar
        </Button>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton columns={7} rows={5} />
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
                {filteredOrdens.map((ordem) => (
                  <TableRow key={ordem.id}>
                    <TableCell className="text-sm">
                      {format(new Date(ordem.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {ordem.leads?.nome_fantasia || "-"}
                    </TableCell>
                    <TableCell className="capitalize">{ordem.tipo}</TableCell>
                    <TableCell>{ordem.quantidade} cx</TableCell>
                    <TableCell>{ordem.profiles?.nome || "-"}</TableCell>
                    <TableCell>{getStatusBadge(ordem.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetails(ordem)}
                      >
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
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
                    <p className="font-semibold text-lg">
                      {selectedOrdem.leads?.nome_fantasia}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Solicitado em {format(new Date(selectedOrdem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {getStatusBadge(selectedOrdem.status)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{selectedOrdem.quantidade}</strong> caixa(s) de bobina
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
                  {statusOptions.map(status => (
                    <Button
                      key={status.value}
                      size="sm"
                      variant={selectedOrdem.status === status.value ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedOrdem.id, status.value)}
                      disabled={updatingStatus || selectedOrdem.status === status.value}
                    >
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