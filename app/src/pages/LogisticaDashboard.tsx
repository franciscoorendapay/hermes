import { useState, useEffect, useMemo } from "react";
import { logisticaService, OrdemLogistica } from "@/features/logistica/logistica.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  PackageMinus,
} from "lucide-react";

const tipoConfig = {
  bobinas: {
    label: "Bobinas",
    icon: Package,
    bg: "bg-white border-gray-200",
    text: "text-foreground",
  },
  troca_equipamento: {
    label: "Troca de Máquina",
    icon: RefreshCw,
    bg: "bg-white border-gray-200",
    text: "text-foreground",
  },
  retirada_equipamento: {
    label: "Retirada de Equip.",
    icon: PackageMinus,
    bg: "bg-white border-gray-200",
    text: "text-foreground",
  },
} as const;

const tipoLabels: Record<string, string> = {
  bobinas: "Bobinas",
  entrega_equipamento: "Entrega Equip.",
  troca_equipamento: "Troca de Máquina",
  retirada_equipamento: "Retirada Equip.",
};

export default function LogisticaDashboard() {
  const [ordens, setOrdens] = useState<OrdemLogistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrdens = async () => {
    try {
      const data = await logisticaService.listarOrdens();
      setOrdens(data);
    } catch (err) {
      console.error("Erro ao carregar ordens:", err);
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

  const metricas = useMemo(() => ({
    pendentes:   ordens.filter(o => o.status === "pendente").length,
    emRota:      ordens.filter(o => o.status === "em_andamento").length,
    concluidos:  ordens.filter(o => o.status === "concluido").length,
    total:       ordens.length,
  }), [ordens]);

  const tipoStats = (tipo: string) => ({
    pendente:  ordens.filter(o => o.tipo === tipo && o.status === "pendente").length,
    concluido: ordens.filter(o => o.tipo === tipo && o.status === "concluido").length,
    total:     ordens.filter(o => o.tipo === tipo).length,
  });

  const ordensPendentes = useMemo(() =>
    ordens.filter(o => o.status === "pendente").slice(0, 5),
  [ordens]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Métricas gerais */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{metricas.pendentes}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Em Rota</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{metricas.emRota}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Concluídos</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{metricas.concluidos}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards por tipo de solicitação */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" /> Por tipo de solicitação
        </p>
        <div className="grid grid-cols-1 gap-3">
          {(Object.entries(tipoConfig) as [keyof typeof tipoConfig, typeof tipoConfig[keyof typeof tipoConfig]][]).map(([tipo, cfg]) => {
            const Icon = cfg.icon;
            const stats = tipoStats(tipo);
            return (
              <Card key={tipo} className={`border ${cfg.bg}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${cfg.text}`} />
                      <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
                    </div>
                    <span className={`text-xl font-bold ${cfg.text}`}>{stats.total}</span>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
                      {stats.pendente} pendente{stats.pendente !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                      {stats.concluido} concluído{stats.concluido !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Aguardando atendimento */}
      {ordensPendentes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-yellow-500" />
              Aguardando Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordensPendentes.map(ordem => (
              <div key={ordem.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {ordem.leads?.nome_fantasia || "Cliente"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tipoLabels[ordem.tipo] || ordem.tipo} •{" "}
                    {format(new Date(ordem.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  {ordem.quantidade} un
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
