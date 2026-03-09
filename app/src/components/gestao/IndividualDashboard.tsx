import { useState } from 'react';
import { Target, TrendingUp, MapPin, Percent, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommercialHeroCard } from './CommercialHeroCard';
import { RadialProgressKpi } from './RadialProgressKpi';
import { MetasProgressCard } from './MetasProgressCard';
import { FunilOverviewCard } from './FunilOverviewCard';
import { PlanningCard } from './PlanningCard';
import { AllPlanningDialog } from './AllPlanningDialog';
import { RecentVisitsTable } from './RecentVisitsTable';
import { PeriodFilter, Period } from './PeriodFilter';
import type { UserStats, PlanningStats } from '@/hooks/useGestaoStats';

interface IndividualDashboardProps {
  user: UserStats;
  onBack: () => void;
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export function IndividualDashboard({ user, onBack, period, onPeriodChange }: IndividualDashboardProps) {
  const [showAllPlanning, setShowAllPlanning] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Calcular conversão (credenciados / total de leads)
  const conversao = user.leads.total > 0 
    ? Math.round((user.leads.credenciados / user.leads.total) * 100) 
    : 0;

  // Texto do período selecionado
  const periodLabel = period === 'week' ? 'Semanal' : 'Mensal';

  return (
    <div className="space-y-6">
      {/* Header com botão voltar e filtro de período */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Individual</h1>
            <p className="text-muted-foreground">Análise {periodLabel.toLowerCase()} de desempenho</p>
          </div>
        </div>
        <PeriodFilter 
          value={period} 
          onChange={onPeriodChange}
          showToday={false}
        />
      </div>

      {/* Hero Card do Comercial */}
      <CommercialHeroCard
        nome={user.nome}
        metaValor={user.metas.metaValor}
        realizadoValor={user.metas.realizadoValor}
      />

      {/* KPIs Radiais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RadialProgressKpi
          title="Novos Clientes"
          value={user.leads.credenciados}
          meta={user.metas.metaClientes}
          realizado={user.metas.realizadoClientes}
          icon={Target}
          formatType="number"
        />
        <RadialProgressKpi
          title="TPV Total"
          value={formatCurrency(user.leads.tpvTotal)}
          meta={user.metas.metaValor}
          realizado={user.metas.realizadoValor}
          icon={TrendingUp}
          formatType="currency"
        />
        <RadialProgressKpi
          title="Visitas"
          value={user.visitas.total}
          meta={user.metas.metaVisitas}
          realizado={user.metas.realizadoVisitas}
          icon={MapPin}
          formatType="number"
        />
        <RadialProgressKpi
          title="Conversão"
          value={`${conversao}%`}
          meta={100}
          realizado={conversao}
          icon={Percent}
          formatType="percent"
        />
      </div>

      {/* Planejamento + Funil lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanningCard 
          data={user.planejamento} 
          onViewAll={() => setShowAllPlanning(true)} 
        />
        <FunilOverviewCard data={user.leads.byFunil} />
      </div>

      {/* Dialog com todos os agendamentos */}
      <AllPlanningDialog
        open={showAllPlanning}
        onOpenChange={setShowAllPlanning}
        userId={user.userId}
      />

      {/* Progresso das Metas */}
      <MetasProgressCard
        metaClientes={user.metas.metaClientes}
        realizadoClientes={user.metas.realizadoClientes}
        metaValor={user.metas.metaValor}
        realizadoValor={user.metas.realizadoValor}
        metaVisitas={user.metas.metaVisitas}
        realizadoVisitas={user.metas.realizadoVisitas}
      />

      {/* Histórico de Visitas */}
      <RecentVisitsTable userId={user.userId} />
    </div>
  );
}
