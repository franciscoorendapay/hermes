import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
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
  Timer,
  TrendingUp,
  RefreshCw
} from "lucide-react";

interface OrdemServico {
  id: string;
  status: string;
  tipo: string;
  quantidade: number;
  created_at: string;
  data_atendimento: string | null;
  prazo_entrega: string | null;
  entregue_no_prazo: boolean | null;
}

export default function LogisticaDashboard() {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrdens = async () => {
    try {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("id, status, tipo, quantidade, created_at, data_atendimento, prazo_entrega, entregue_no_prazo")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrdens(data || []);
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

  // Métricas
  const metricas = useMemo(() => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);
    const inicioDia = startOfDay(hoje);
    const fimDia = endOfDay(hoje);

    const pendentes = ordens.filter(o => o.status === "pendente").length;
    const emRota = ordens.filter(o => o.status === "em_andamento").length;
    
    const concluidasHoje = ordens.filter(o => {
      if (o.status !== "concluida" || !o.data_atendimento) return false;
      const dataAtendimento = new Date(o.data_atendimento);
      return dataAtendimento >= inicioDia && dataAtendimento <= fimDia;
    }).length;

    const concluidasMes = ordens.filter(o => {
      if (o.status !== "concluida" || !o.data_atendimento) return false;
      const dataAtendimento = new Date(o.data_atendimento);
      return dataAtendimento >= inicioMes && dataAtendimento <= fimMes;
    });

    const totalEntregasMes = concluidasMes.length;
    
    // Calcular entregas no prazo
    const entregasNoPrazoMes = concluidasMes.filter(o => o.entregue_no_prazo === true).length;
    const percentualNoPrazo = totalEntregasMes > 0 
      ? Math.round((entregasNoPrazoMes / totalEntregasMes) * 100) 
      : 100;

    // Total de itens entregues no mês
    const quantidadeTotalMes = concluidasMes.reduce((acc, o) => acc + o.quantidade, 0);

    return {
      pendentes,
      emRota,
      concluidasHoje,
      totalEntregasMes,
      percentualNoPrazo,
      quantidadeTotalMes
    };
  }, [ordens]);

  // Últimas ordens pendentes
  const ordensPendentes = useMemo(() => {
    return ordens
      .filter(o => o.status === "pendente")
      .slice(0, 5);
  }, [ordens]);

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      bobinas: "Bobinas",
      entrega_equipamento: "Entrega Equip.",
      troca_equipamento: "Troca Equip.",
      retirada_equipamento: "Retirada Equip.",
      nova_maquina: "Nova Máquina",
    };
    return tipos[tipo] || tipo;
  };

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
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-3">
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
              <span className="text-xs font-medium text-green-700">Hoje</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{metricas.concluidasHoje}</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">No Prazo</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{metricas.percentualNoPrazo}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo do mês */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Resumo do Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Total de Entregas</span>
            <span className="font-bold text-foreground">{metricas.totalEntregasMes}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Itens Entregues</span>
            <span className="font-bold text-foreground">{metricas.quantidadeTotalMes} un</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Entregas no Prazo</span>
            <Badge 
              variant="outline" 
              className={metricas.percentualNoPrazo >= 90 
                ? "bg-green-100 text-green-700 border-green-300" 
                : metricas.percentualNoPrazo >= 70 
                  ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                  : "bg-red-100 text-red-700 border-red-300"
              }
            >
              {metricas.percentualNoPrazo}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Ordens pendentes */}
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
              <div 
                key={ordem.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {getTipoLabel(ordem.tipo)}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
