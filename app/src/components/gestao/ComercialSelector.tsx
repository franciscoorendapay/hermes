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
      <SelectTrigger className="w-[250px]">
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
