import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Target, MapPin, TrendingUp, RefreshCw, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthlyHighlightCard } from '@/components/gestao/MonthlyHighlightCard';
import { RadialProgressKpi } from '@/components/gestao/RadialProgressKpi';
import { TeamPerformanceTable } from '@/components/gestao/TeamPerformanceTable';
import { FunilOverviewCard } from '@/components/gestao/FunilOverviewCard';
import { DailyCredenciamentosChart } from '@/components/gestao/DailyCredenciamentosChart';
import { ComercialSelector } from '@/components/gestao/ComercialSelector';
import { PeriodFilter, Period } from '@/components/gestao/PeriodFilter';
import { IndividualDashboard } from '@/components/gestao/IndividualDashboard';
import { useSubordinates } from '@/hooks/useSubordinates';
import { useGestaoStats } from '@/hooks/useGestaoStats';
import { Skeleton } from '@/components/ui/skeleton';

export default function GestaoDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('user'));
  const [period, setPeriod] = useState<Period>('month');
  const { subordinates, isLoading: subsLoading } = useSubordinates();
  const { consolidado, porUsuario, isLoading, refetch } = useGestaoStats(selectedUserId || undefined, period);

  // Sync state with URL search params
  useEffect(() => {
    const userParam = searchParams.get('user');
    if (userParam !== selectedUserId) {
      setSelectedUserId(userParam);
    }
  }, [searchParams]);

  const handleSelectUser = (id: string | null) => {
    setSelectedUserId(id);
    if (id) {
      setSearchParams({ ...Object.fromEntries(searchParams), user: id });
    } else {
      const newParams = Object.fromEntries(searchParams);
      delete newParams.user;
      setSearchParams(newParams);
    }
  };

  const handleBack = () => {
    handleSelectUser(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Preparar dados para tabela de performance
  const performanceData = porUsuario.map(user => ({
    userId: user.userId,
    nome: user.nome,
    metaNC: user.metas.metaClientes,
    realizadoNC: user.metas.realizadoClientes,
    metaTPV: user.metas.metaValor,
    realizadoTPV: user.metas.realizadoValor,
    visitas: user.visitas.total,
    metaVisitas: user.metas.metaVisitas,
  }));

  // Calcular conversão consolidada (credenciados / total de leads)
  const conversaoConsolidada = consolidado.leads.total > 0
    ? Math.round((consolidado.leads.credenciados / consolidado.leads.total) * 100)
    : 0;


  // Se um comercial específico está selecionado, mostrar dashboard individual
  const selectedUser = selectedUserId
    ? porUsuario.find(u => u.userId === selectedUserId)
    : null;

  if (selectedUser) {
    return (
      <IndividualDashboard
        user={selectedUser}
        onBack={handleBack}
        period={period}
        onPeriodChange={setPeriod}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard HRMS</h1>
          <p className="text-muted-foreground">Visão consolidada da equipe</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
          <ComercialSelector
            subordinates={subordinates}
            selectedId={selectedUserId}
            onSelect={handleSelectUser}
          />
          <Button variant="outline" size="icon" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPIs com Gauge Radial */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RadialProgressKpi
          title="Novos Clientes"
          value={consolidado.leads.credenciados}
          meta={consolidado.metas.metaClientes}
          realizado={consolidado.metas.realizadoClientes}
          icon={Target}
          formatType="number"
          isLoading={isLoading}
        />
        <RadialProgressKpi
          title="TPV Prometido"
          value={formatCurrency(consolidado.leads.tpvTotal)}
          meta={consolidado.metas.metaValor}
          realizado={consolidado.metas.realizadoValor}
          icon={TrendingUp}
          formatType="currency"
          isLoading={isLoading}
        />
        <RadialProgressKpi
          title="Visitas"
          value={consolidado.visitas.total}
          meta={consolidado.metas.metaVisitas}
          realizado={consolidado.metas.realizadoVisitas}
          icon={MapPin}
          formatType="number"
          isLoading={isLoading}
        />
        <RadialProgressKpi
          title="Conversão"
          value={`${conversaoConsolidada}%`}
          meta={100}
          realizado={conversaoConsolidada}
          icon={Percent}
          formatType="percent"
          isLoading={isLoading}
        />
      </div>

      {/* Destaque do Mês */}
      {(isLoading || porUsuario.length > 0) && (
        <MonthlyHighlightCard users={porUsuario} isLoading={isLoading} />
      )}

      {/* Funil + Gráfico lado a lado */}
      {(isLoading || porUsuario.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunilOverviewCard data={consolidado.leads.byFunil} isLoading={isLoading} />
          <DailyCredenciamentosChart data={consolidado.credenciadosPorDia} isLoading={isLoading} />
        </div>
      )}

      {/* Tabela de Performance */}
      {(isLoading || porUsuario.length > 0) && (
        <TeamPerformanceTable data={performanceData} isLoading={isLoading} />
      )}
    </div>
  );
}
