import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Target, MapPin, TrendingUp, RefreshCw, Percent, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { MonthlyHighlightCard } from '@/components/gestao/MonthlyHighlightCard';
import { RadialProgressKpi } from '@/components/gestao/RadialProgressKpi';
import { TeamPerformanceTable } from '@/components/gestao/TeamPerformanceTable';
import { FunilOverviewCard } from '@/components/gestao/FunilOverviewCard';
import { DailyCredenciamentosChart } from '@/components/gestao/DailyCredenciamentosChart';
import { ComercialSelector } from '@/components/gestao/ComercialSelector';
import { PeriodFilter, Period } from '@/components/gestao/PeriodFilter';
import { IndividualDashboard } from '@/components/gestao/IndividualDashboard';
import { CommissionSettingsDialog } from '@/components/gestao/CommissionSettingsDialog';
import { useSubordinates } from '@/hooks/useSubordinates';
import { useGestaoStats } from '@/hooks/useGestaoStats';
import { useUserRole } from '@/hooks/useUserRole';
import { Skeleton } from '@/components/ui/skeleton';

export default function GestaoDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('user'));
  const [period, setPeriod] = useState<Period>('month');
  const [referenceDate, setReferenceDate] = useState(() => startOfMonth(new Date()));
  const [showCommissionSettings, setShowCommissionSettings] = useState(false);
  const { subordinates, isLoading: subsLoading } = useSubordinates();

  const isCurrentMonth =
    referenceDate.getMonth() === new Date().getMonth() &&
    referenceDate.getFullYear() === new Date().getFullYear();

  const customRange = period === 'month'
    ? { start: referenceDate, end: endOfMonth(referenceDate) }
    : undefined;

  const { consolidado, porUsuario, usersMap, isLoading, refetch } = useGestaoStats(selectedUserId || undefined, period, customRange);
  const { role } = useUserRole();
  const canManageCommission = role === 'diretor' || role === 'admin';

  const handlePrevMonth = () => setReferenceDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setReferenceDate(prev => addMonths(prev, 1));

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    if (p === 'month') setReferenceDate(startOfMonth(new Date()));
  };

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
        onPeriodChange={handlePeriodChange}
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
          <PeriodFilter value={period} onChange={handlePeriodChange} />
          {period === 'month' && (
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1.5 shadow-sm">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center capitalize">
                {format(referenceDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleNextMonth}
                disabled={isCurrentMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <ComercialSelector
            subordinates={subordinates}
            selectedId={selectedUserId}
            onSelect={handleSelectUser}
          />
          {canManageCommission && (
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2 border-slate-200/60 shadow-sm bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-slate-600 rounded-xl transition-colors"
              onClick={() => setShowCommissionSettings(true)}
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">Comissão</span>
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white border border-slate-200/60 shadow-sm hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors" onClick={refetch} disabled={isLoading}>
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
          <FunilOverviewCard
            data={consolidado.leads.byFunil}
            leadsByFunil={consolidado.leads.leadsByFunil}
            usersMap={usersMap}
            isLoading={isLoading}
          />
          <DailyCredenciamentosChart data={consolidado.credenciadosPorDia} isLoading={isLoading} />
        </div>
      )}

      {/* Tabela de Performance */}
      {(isLoading || porUsuario.length > 0) && (
        <TeamPerformanceTable data={performanceData} isLoading={isLoading} />
      )}

      {/* Commission Settings Dialog - Directors only */}
      <CommissionSettingsDialog
        open={showCommissionSettings}
        onOpenChange={setShowCommissionSettings}
      />
    </div>
  );
}
