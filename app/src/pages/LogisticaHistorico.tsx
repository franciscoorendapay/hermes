import { useState, useEffect } from "react";
import { logisticaService, OrdemLogistica } from "@/features/logistica/logistica.service";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Timer,
  Package,
  RefreshCw,
  TrendingUp
} from "lucide-react";

const tipoLabels: Record<string, string> = {
  bobinas: "Bobinas",
  entrega_equipamento: "Entrega Equip.",
  troca_equipamento: "Troca Equip.",
  retirada_equipamento: "Retirada Equip.",
  nova_maquina: "Nova Máquina",
};

export default function LogisticaHistorico() {
  const [ordens, setOrdens] = useState<OrdemLogistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mesFilter, setMesFilter] = useState("atual");

  const getMesRange = (filter: string) => {
    const hoje = new Date();
    if (filter === "anterior") {
      const mesAnterior = subMonths(hoje, 1);
      return { inicio: startOfMonth(mesAnterior), fim: endOfMonth(mesAnterior) };
    }
    return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
  };

  const fetchOrdens = async () => {
    try {
      const { inicio, fim } = getMesRange(mesFilter);
      const data = await logisticaService.listarOrdens({
        status: "concluido",
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
      });
      setOrdens(data);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrdens();
  }, [mesFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrdens();
  };

  const stats = {
    total: ordens.length,
    quantidadeTotal: ordens.reduce((acc, o) => acc + o.quantidade, 0),
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Histórico</h2>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Filter */}
      <Select value={mesFilter} onValueChange={setMesFilter}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="atual">Mês Atual</SelectItem>
          <SelectItem value="anterior">Mês Anterior</SelectItem>
        </SelectContent>
      </Select>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Resumo do Período
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Entregas</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-2xl font-bold text-foreground">{stats.quantidadeTotal}</p>
            <p className="text-xs text-muted-foreground">Itens</p>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      {ordens.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma entrega concluída neste período</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {ordens.map((ordem) => (
            <Card key={ordem.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {ordem.leads?.nome_fantasia || "Cliente"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tipoLabels[ordem.tipo] || ordem.tipo} • {ordem.quantidade} un
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">
                      {format(new Date(ordem.updated_at || ordem.created_at), "dd/MM", { locale: ptBR })}
                    </p>
                    <Badge variant="outline" className="text-[10px] bg-green-100 text-green-700 border-green-300">
                      Concluído
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
