import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EquipeTable } from '@/components/gestao/EquipeTable';
import { useGestaoStats } from '@/hooks/useGestaoStats';
import { Button } from '@/components/ui/button';

export default function GestaoEquipe() {
  const navigate = useNavigate();
  const [referenceDate, setReferenceDate] = useState(() => startOfMonth(new Date()));

  const customRange = {
    start: referenceDate,
    end: endOfMonth(referenceDate),
  };

  const isCurrentMonth =
    referenceDate.getMonth() === new Date().getMonth() &&
    referenceDate.getFullYear() === new Date().getFullYear();

  const { porUsuario, isLoading } = useGestaoStats(undefined, 'month', customRange);

  const handlePrev = () => setReferenceDate(prev => subMonths(prev, 1));
  const handleNext = () => setReferenceDate(prev => addMonths(prev, 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground">Visualize a performance de cada comercial</p>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-sm w-fit">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[130px] text-center capitalize">
            {format(referenceDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNext}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EquipeTable
        data={porUsuario}
        isLoading={isLoading}
        onViewUser={(userId) => navigate(`/gestao?user=${userId}`)}
      />
    </div>
  );
}
