import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/formatters";
import {
  Users,
  TrendingUp,
  Coins,
  Calculator,
  Trophy,
  AlertTriangle,
  Search,
  Store,
  ArrowLeft
} from "lucide-react";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { LaunchVisitSheet } from "@/components/routes/LaunchVisitSheet";

const COMISSAO_RATE = 0.005; // 0.5%
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

export default function Carteira() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: leads = [], isLoading, refetch } = useLeads(isAuthenticated);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showVisitSheet, setShowVisitSheet] = useState(false);
  const [directAction, setDirectAction] = useState<string | null>(null);

  // Filtrar apenas clientes credenciados (funil_app = 5)
  const clientesCredenciados = useMemo(() => {
    return leads.filter(lead => lead.funil_app === 5 && lead.credenciado === 1);
  }, [leads]);

  // KPIs
  const kpis = useMemo(() => {
    const totalClientes = clientesCredenciados.length;
    const tpvTotal = clientesCredenciados.reduce((acc, lead) => acc + Number(lead.tpv || 0), 0);
    const comissaoTotal = tpvTotal * COMISSAO_RATE;
    const ticketMedio = totalClientes > 0 ? tpvTotal / totalClientes : 0;

    return {
      totalClientes,
      tpvTotal,
      comissaoTotal,
      ticketMedio
    };
  }, [clientesCredenciados]);

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

  if (isLoading) {
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
      <div className="flex items-center gap-3 mb-4">
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
              <span className="font-semibold text-[#454545] text-xs">TPV Total</span>
            </div>
            <p className="font-semibold text-primary text-base">{formatMoney(kpis.tpvTotal)}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-border rounded-xl shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coins className="h-4 w-4" />
              <span className="font-semibold text-[#454545] text-xs">Comissão</span>
            </div>
            <p className="font-semibold text-green-600 text-base">{formatMoney(kpis.comissaoTotal)}</p>
          </CardContent>
        </Card>

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
            {topClientes.map((cliente, index) => (
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
                    <p className="font-medium text-xs text-foreground">{cliente.nome_fantasia}</p>
                    <p className="text-[10px] text-muted-foreground">
                      TPV {formatCompact(Number(cliente.tpv || 0))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-xs text-foreground">{formatMoney(Number(cliente.tpv || 0))}</p>
                  <p className="text-[10px] text-green-600 font-medium">
                    {formatMoney(Number(cliente.tpv || 0) * COMISSAO_RATE)}
                  </p>
                </div>
              </div>
            ))}
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
            {clientesAtencao.slice(0, 5).map(cliente => (
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
                    <p className="font-medium text-xs text-foreground">{cliente.nome_fantasia}</p>
                    <p className="text-[10px] text-muted-foreground">
                      TPV {formatCompact(Number(cliente.tpv || 0))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-xs text-foreground">
                    {formatMoney(Number(cliente.tpv || 0))}
                  </p>
                  <p className="text-[10px] text-green-600 font-medium">
                    {formatMoney(Number(cliente.tpv || 0) * COMISSAO_RATE)}
                  </p>
                </div>
              </div>
            ))}
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
              {clientesFiltrados.map(cliente => (
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
                      <p className="font-medium text-xs text-foreground">{cliente.nome_fantasia}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {cliente.endereco_cidade || 'Cidade não informada'} • TPV {formatCompact(Number(cliente.tpv || 0))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-xs text-foreground">
                      {formatMoney(Number(cliente.tpv || 0))}
                    </p>
                    <p className="text-[10px] text-green-600 font-medium">
                      {formatMoney(Number(cliente.tpv || 0) * COMISSAO_RATE)}
                    </p>
                  </div>
                </div>
              ))}
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
