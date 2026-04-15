import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Subordinate } from '@/hooks/useSubordinates';

interface ComercialSelectorProps {
  subordinates: Subordinate[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showAllOption?: boolean;
  placeholder?: string;
}

export function ComercialSelector({
  subordinates,
  selectedId,
  onSelect,
  showAllOption = true,
  placeholder = 'Selecione um comercial',
}: ComercialSelectorProps) {
  return (
    <Select
      value={selectedId || (showAllOption ? 'all' : '')}
      onValueChange={(value) => onSelect(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-[220px] sm:w-[250px] bg-white border border-slate-200/60 shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0 rounded-xl h-10 font-medium text-slate-700">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">Todos os comerciais</SelectItem>
        )}
        {subordinates.map((sub) => (
          <SelectItem key={sub.id} value={sub.id}>
            {sub.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
