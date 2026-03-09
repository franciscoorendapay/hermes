import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserStats {
  userId: string;
  nome: string;
  leads: {
    total: number;
    credenciados: number;
    tpvTotal: number;
  };
  visitas: {
    total: number;
  };
  metas: {
    metaClientes: number;
    metaValor: number;
    metaVisitas: number;
    realizadoClientes: number;
    realizadoValor: number;
    realizadoVisitas: number;
  };
}

interface EquipeTableProps {
  data: UserStats[];
  onViewUser?: (userId: string) => void;
}

export function EquipeTable({ data, onViewUser }: EquipeTableProps) {
  const [search, setSearch] = useState('');

  const filteredData = data.filter(user =>
    user.nome.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProgressColor = (realizado: number, meta: number) => {
    if (meta === 0) return 'muted';
    const percentage = (realizado / meta) * 100;
    if (percentage >= 100) return 'success';
    if (percentage >= 70) return 'warning';
    return 'destructive';
  };

  const getTrendIcon = (realizado: number, meta: number) => {
    if (meta === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const percentage = (realizado / meta) * 100;
    if (percentage >= 100) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (percentage < 50) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-foreground">Equipe</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar comercial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comercial</TableHead>
              <TableHead className="text-center">Leads</TableHead>
              <TableHead className="text-center">Credenciados</TableHead>
              <TableHead className="text-center">Visitas</TableHead>
              <TableHead className="text-right">TPV</TableHead>
              <TableHead className="text-center">Meta Clientes</TableHead>
              <TableHead className="text-center">Meta Visitas</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum comercial encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell className="text-center">{user.leads.total}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {user.leads.credenciados}
                      {getTrendIcon(user.metas.realizadoClientes, user.metas.metaClientes)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {user.visitas.total}
                      {getTrendIcon(user.metas.realizadoVisitas, user.metas.metaVisitas)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(user.leads.tpvTotal)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getProgressColor(user.metas.realizadoClientes, user.metas.metaClientes) as any}>
                      {user.metas.realizadoClientes}/{user.metas.metaClientes}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getProgressColor(user.metas.realizadoVisitas, user.metas.metaVisitas) as any}>
                      {user.metas.realizadoVisitas}/{user.metas.metaVisitas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewUser?.(user.userId)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
