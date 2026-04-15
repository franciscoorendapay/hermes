import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';

export type Period = 'today' | 'week' | 'month';

interface PeriodFilterProps {
  value: Period;
  onChange: (value: Period) => void;
  showToday?: boolean;
}

export function PeriodFilter({ value, onChange, showToday = true }: PeriodFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as Period)}
      className="bg-slate-100/50 border border-slate-200/60 rounded-xl p-1 shadow-sm h-10"
    >
      {showToday && (
        <ToggleGroupItem
          value="today"
          aria-label="Hoje"
          className="data-[state=on]:bg-white data-[state=on]:text-indigo-600 data-[state=on]:shadow-sm transition-all gap-1.5 px-3 rounded-md h-8 text-slate-500 font-medium hover:text-slate-700"
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Hoje</span>
        </ToggleGroupItem>
      )}
      <ToggleGroupItem
        value="week"
        aria-label="Esta Semana"
        className="data-[state=on]:bg-white data-[state=on]:text-indigo-600 data-[state=on]:shadow-sm transition-all gap-1.5 px-3 rounded-md h-8 text-slate-500 font-medium hover:text-slate-700"
      >
        <CalendarDays className="h-4 w-4" />
        <span className="hidden sm:inline">Semana</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="month"
        aria-label="Este Mês"
        className="data-[state=on]:bg-white data-[state=on]:text-indigo-600 data-[state=on]:shadow-sm transition-all gap-1.5 px-3 rounded-md h-8 text-slate-500 font-medium hover:text-slate-700"
      >
        <CalendarRange className="h-4 w-4" />
        <span className="hidden sm:inline">Mês</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
