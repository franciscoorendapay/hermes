import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { formatMoney } from "@/lib/formatters";
import { useTransacionado } from "@/hooks/useTransacionado";
import { useCommissionSettings } from "@/hooks/useCommissionSettings";
import {
  Users,
  TrendingUp,
  Coins,
  Calculator,
  Trophy,
  AlertTriangle,
  Search,
  Store,
  ArrowLeft,
  BarChart2,
  RefreshCw,
  Filter
} from "lucide-react";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { LaunchVisitSheet } from "@/components/routes/LaunchVisitSheet";

const TPV_ATENCAO_THRESHOLD = 5000; // Clientes com TPV abaixo são "em atenção"

const formatCompact = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

const getSafraDiff = (lead: Lead): number => {
  const dataRef = lead.data_credenciamento || lead.data_registro;
  if (!dataRef) return 0; // fallback para M0

  const d = new Date(dataRef);
  if (isNaN(d.getTime())) return 0;

  const now = new Date();
  const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return diff < 0 ? 0 : diff;
};

export default function Carteira() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useUserRole();
  const { data: leads = [], isLoading, refetch } = useLeads(isAuthenticated);
  const { data: transacionadoMap = {}, isLoading: isLoadingTransacionado, refetch: refetchTransacionado } = useTransacionado(isAuthenticated);
  const { settings: commissionSettings, isLoading: isLoadingCommission } = useCommissionSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showVisitSheet, setShowVisitSheet] = useState(false);
  const [directAction, setDirectAction] = useState<string | null>(null);
  const [filterSafra, setFilterSafra] = useState<"todos" | "novos" | "consolidados">("todos");

  // Filtrar apenas clientes credenciados e aplicar filtros de safra
  const clientesCredenciados = useMemo(() => {
    let base = leads.filter(lead => lead.funil_app === 5 && lead.credenciado === 1);
    if (filterSafra === "novos") {
      base = base.filter(lead => getSafraDiff(lead) <= 2);
    } else if (filterSafra === "consolidados") {
      base = base.filter(lead => getSafraDiff(lead) > 2);
    }
    return base;
  }, [leads, filterSafra]);

  // KPIs
  const kpis = useMemo(() => {
    const totalClientes = clientesCredenciados.length;
    const tpvTotal = clientesCredenciados.reduce((acc, lead) => acc + Number(lead.tpv || 0), 0);

    let comissaoTotal = 0;
    let receitaLiquidaTotal = 0;
    clientesCredenciados.forEach(lead => {
      const diff = getSafraDiff(lead);
      const transData = transacionadoMap[lead.id];
      const receita = transData ? Number(transData.receita_liquida || 0) : 0;

      let rate: number;
      if (commissionSettings.type === 'fixed') {
        rate = commissionSettings.rate_fixed ?? 0.05;
      } else {
        rate = diff <= 3 ? (commissionSettings.rate_novos ?? 0.07) : (commissionSettings.rate_consolidados ?? 0.035);
      }
      receitaLiquidaTotal += receita;
      comissaoTotal += receita * rate;
    });

    const ticketMedio = totalClientes > 0 ? tpvTotal / totalClientes : 0;
    const transacionadoTotal = Object.values(transacionadoMap).reduce(
      (acc, item) => acc + Number(item.transacionado || 0), 0
    );

    return {
      totalClientes,
      tpvTotal,
      receitaLiquidaTotal,
      comissaoTotal,
      ticketMedio,
      transacionadoTotal
    };
  }, [clientesCredenciados, transacionadoMap, commissionSettings]);

  // TOP 5 Clientes por TPV
  const topClientes = useMemo(() => {
    return [...clientesCredenciados]
      .sort((a, b) => Number(b.tpv || 0) - Number(a.tpv || 0))
      .slice(0, 5);
  }, [clientesCredenciados]);

  // Clientes em Atenção (TPV = 0 ou abaixo do threshold)
  const clientesAtencao = useMemo(() => {
    return clientesCredenciados.filter(
      lead => Number(lead.tpv || 0) === 0 || Number(lead.tpv || 0) < TPV_ATENCAO_THRESHOLD
    );
  }, [clientesCredenciados]);

  // Filtrar por busca
  const clientesFiltrados = useMemo(() => {
    if (!searchTerm) return clientesCredenciados;
    const term = searchTerm.toLowerCase();
    return clientesCredenciados.filter(
      lead =>
        lead.nome_fantasia.toLowerCase().includes(term) ||
        lead.razao_social?.toLowerCase().includes(term) ||
        lead.doc?.includes(term)
    );
  }, [clientesCredenciados, searchTerm]);

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailSheet(true);
  };

  const handleLeadAction = (lead: Lead, action: string) => {
    setShowDetailSheet(false);
    setSelectedLead(lead);
    setDirectAction(action);
    setShowVisitSheet(true);
  };

  if (isLoading || isLoadingTransacionado || isLoadingCommission) {
    return (
      <div className="space-y-4 pb-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        {/* KPIs Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white border border-border rounded-xl shadow-none">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Clients Skeleton */}
        <Card className="bg-white border border-border rounded-xl shadow-none">
          <CardHeader className="pb-2 pt-3 px-3">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-2.5">
                <div className="flex gap-2.5 items-center">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2 w-12" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* List Skeleton */}
        <Card className="bg-white border border-border rounded-xl shadow-none">
          <CardHeader className="pb-2 pt-3 px-3">
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-3">
            <Skeleton className="h-9 w-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center p-2.5">
                  <div className="flex gap-2.5 items-center">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-2 w-24" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header - Padrão Dashboard */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="-ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-foreground text-base">Minha Carteira</h1>
            <p className="font-normal text-muted-foreground text-xs">Acompanhe seus clientes credenciados</p>
          </div>
        </div>

        {/* Filtros de Safra */}
        <div className="flex gap-2 w-full overflow-x-auto pb-1 no-scrollbar">
          <Button
            variant={filterSafra === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSafra("todos")}
            className="rounded-full text-xs h-8 px-4"
          >
            Todos
          </Button>
          <Button
            variant={filterSafra === "novos" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSafra("novos")}
            className="rounded-full text-xs h-8 px-4"
          >
            Novos (M0-M2)
          </Button>
          <Button
            variant={filterSafra === "consolidados" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSafra("consolidados")}
            className="rounded-full text-xs h-8 px-4"
          >
            Consolidados (M3+)
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border border-border rounded-xl shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="font-semibold text-[#454545] text-xs">Total Clientes</span>
            </div>
            <p className="font-semibold text-primary text-base">{kpis.totalClientes}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-border rounded-xl shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold text-[#454545] text-xs">TPV Prometido</span>
            </div>
            <p className="font-semibold text-primary text-base">{formatMoney(kpis.tpvTotal)}</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <BarChart2 className="h-4 w-4" />
                  <span className="font-semibold text-xs">Transacionado Real (mês)</span>
                </div>
                {isLoadingTransacionado ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24" />
                    <span className="text-[10px] text-blue-500">carregando...</span>
                  </div>
                ) : (
                  <p className="font-bold text-blue-700 text-lg">{formatMoney(kpis.transacionadoTotal)}</p>
                )}
                {!isLoadingTransacionado && kpis.transacionadoTotal === 0 && Object.keys(transacionadoMap).length === 0 && (
                  <p className="text-[10px] text-blue-400 mt-0.5">Nenhum cliente com token cadastrado</p>
                )}
              </div>
              <button
                onClick={() => { refetch(); refetchTransacionado(); }}
                className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                title="Atualizar"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-border rounded-xl shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coins className="h-4 w-4" />
              <span className="font-semibold text-[#454545] text-xs">Comissão Prevista</span>
            </div>
            <p className="font-semibold text-green-600 text-base">{formatMoney(kpis.comissaoTotal)}</p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="bg-white border border-border rounded-xl shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart2 className="h-4 w-4" />
                <span className="font-semibold text-[#454545] text-xs">Receita Líquida</span>
              </div>
              <p className="font-semibold text-primary text-base">{formatMoney(kpis.receitaLiquidaTotal)}</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white border border-border rounded-xl shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calculator className="h-4 w-4" />
              <span className="font-semibold text-[#454545] text-xs">Ticket Médio</span>
            </div>
            <p className="font-semibold text-primary text-base">{formatMoney(kpis.ticketMedio)}</p>
          </CardContent>
        </Card>
      </div>

      {/* TOP Clientes */}
      {topClientes.length > 0 && (
        <Card className="bg-white border border-border rounded-xl shadow-none">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              TOP Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            {topClientes.map((cliente, index) => {
              const trans = transacionadoMap[cliente.id];
              const safeDiff = getSafraDiff(cliente);
              const isNovo = safeDiff <= 2;
              const rate = commissionSettings.type === 'fixed'
                ? (commissionSettings.rate_fixed ?? 0.05)
                : safeDiff <= 3 ? (commissionSettings.rate_novos ?? 0.07) : (commissionSettings.rate_consolidados ?? 0.035);
              const receita = trans ? Number(trans.receita_liquida || 0) : 0;
              const comissaoCliente = receita * rate;

              return (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleViewLead(cliente)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-xs text-foreground">{cliente.nome_fantasia}</p>
                        {safeDiff <= 4 && (
                          <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 border-0 ${isNovo ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            M{safeDiff}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        TPV {formatCompact(Number(cliente.tpv || 0))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {trans ? (
                      <>
                        <p className="font-semibold text-xs text-blue-700">{formatMoney(Number(trans.transacionado))}</p>
                        {isAdmin && (
                          <p className="text-[10px] text-muted-foreground">receita: {formatMoney(receita)}</p>
                        )}
                        <p className="text-[10px] text-green-600 font-medium">comissão: {formatMoney(comissaoCliente)}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-xs text-foreground">{formatMoney(Number(cliente.tpv || 0))}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Sem dados Orenda</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Clientes em Atenção */}
      {clientesAtencao.length > 0 && (
        <Card className="bg-white border border-orange-200 rounded-xl shadow-none">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Clientes em Atenção
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0 text-[10px]">
                {clientesAtencao.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            {clientesAtencao.slice(0, 5).map(cliente => {
              const safeDiff = getSafraDiff(cliente);
              const isNovo = safeDiff <= 2;

              return (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-2.5 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => handleViewLead(cliente)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-xs text-foreground">{cliente.nome_fantasia}</p>
                        {safeDiff <= 4 && (
                          <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 border-0 ${isNovo ? 'bg-orange-200 text-orange-800' : 'bg-orange-100 text-orange-700'}`}>
                            M{safeDiff}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        TPV {formatCompact(Number(cliente.tpv || 0))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-xs text-foreground">
                      {formatMoney(Number(cliente.tpv || 0))}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">Atenção</p>
                  </div>
                </div>
              )
            })}
            {clientesAtencao.length > 5 && (
              <p className="text-[10px] text-center text-muted-foreground pt-1">
                +{clientesAtencao.length - 5} clientes em atenção
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista Completa */}
      <Card className="bg-white border border-border rounded-xl shadow-none">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Todos os Clientes
            </span>
            <Badge variant="secondary" className="text-[10px]">{clientesCredenciados.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-3 pb-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Lista */}
          {clientesFiltrados.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente na carteira'}
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {clientesFiltrados.map(cliente => {
                const trans = transacionadoMap[cliente.id];
                const safeDiff = getSafraDiff(cliente);
                const isNovo = safeDiff <= 2;
                const rate = commissionSettings.type === 'fixed'
                  ? (commissionSettings.rate_fixed ?? 0.05)
                  : safeDiff <= 3 ? (commissionSettings.rate_novos ?? 0.07) : (commissionSettings.rate_consolidados ?? 0.035);
                const receita = trans ? Number(trans.receita_liquida || 0) : 0;
                const comissaoCliente = receita * rate;

                return (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleViewLead(cliente)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-xs text-foreground">{cliente.nome_fantasia}</p>
                          {safeDiff <= 4 && (
                            <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 border-0 ${isNovo ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              M{safeDiff}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {cliente.endereco_cidade || 'Cidade não informada'} • TPV {formatCompact(Number(cliente.tpv || 0))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {trans ? (
                        <>
                          <p className="font-semibold text-xs text-blue-700">{formatMoney(Number(trans.transacionado))}</p>
                          {isAdmin && (
                            <p className="text-[10px] text-muted-foreground">receita: {formatMoney(receita)}</p>
                          )}
                          <p className="text-[10px] text-green-600 font-medium">comissão: {formatMoney(comissaoCliente)}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-xs text-foreground">
                            {formatMoney(Number(cliente.tpv || 0))}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium">Sem dados Orenda</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* LeadDetailSheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onContinuarCadastro={handleLeadAction}
        onEditar={handleLeadAction}
      />

      {/* LaunchVisitSheet */}
      <LaunchVisitSheet
        open={showVisitSheet}
        onOpenChange={(open) => {
          setShowVisitSheet(open);
          if (!open) {
            setSelectedLead(null);
            setDirectAction(null);
          }
        }}
        leads={leads}
        selectedLead={selectedLead}
        directAction={directAction}
        initialPlace={null}
        initialType={null}
        onLeadSaved={() => refetch()}
      />
    </div>
  );
}
