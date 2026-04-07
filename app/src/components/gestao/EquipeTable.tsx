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
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';

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
  isLoading?: boolean;
}

export function EquipeTable({ data, onViewUser, isLoading = false }: EquipeTableProps) {
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

  const columns: ColumnDef<UserStats>[] = [
    {
      accessorKey: 'nome',
      header: ({ column }) => <SortableHeader column={column}>Comercial</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
    },
    {
      id: 'leads',
      accessorFn: (row) => row.leads.total,
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">Leads</SortableHeader>,
      cell: ({ row }) => <div className="text-center">{row.original.leads.total}</div>,
    },
    {
      id: 'credenciados',
      accessorFn: (row) => row.leads.credenciados,
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">Credenciados</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          {row.original.leads.credenciados}
          {getTrendIcon(row.original.metas.realizadoClientes, row.original.metas.metaClientes)}
        </div>
      ),
    },
    {
      id: 'visitas',
      accessorFn: (row) => row.visitas.total,
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">Visitas</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          {row.original.visitas.total}
          {getTrendIcon(row.original.metas.realizadoVisitas, row.original.metas.metaVisitas)}
        </div>
      ),
    },
    {
      id: 'tpv',
      accessorFn: (row) => row.leads.tpvTotal,
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">TPV</SortableHeader>,
      cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.original.leads.tpvTotal)}</div>,
    },
    {
      id: 'metaClientes',
      accessorFn: (row) => row.metas.realizadoClientes / Math.max(row.metas.metaClientes, 1),
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">Meta Clientes</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant={getProgressColor(row.original.metas.realizadoClientes, row.original.metas.metaClientes) as any}>
            {row.original.metas.realizadoClientes}/{row.original.metas.metaClientes}
          </Badge>
        </div>
      ),
    },
    {
      id: 'metaVisitas',
      accessorFn: (row) => row.metas.realizadoVisitas / Math.max(row.metas.metaVisitas, 1),
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">Meta Visitas</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant={getProgressColor(row.original.metas.realizadoVisitas, row.original.metas.metaVisitas) as any}>
            {row.original.metas.realizadoVisitas}/{row.original.metas.metaVisitas}
          </Badge>
        </div>
      ),
    },
    {
      id: 'acoes',
      header: () => <div className="text-center">Ações</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button variant="ghost" size="icon" onClick={() => onViewUser?.(row.original.userId)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const headerSection = (
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
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl">
        {headerSection}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {['Comercial', 'Leads', 'Credenciados', 'Visitas', 'TPV', 'Meta Clientes', 'Meta Visitas', 'Ações'].map(h => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-8 w-8 mx-auto rounded-md" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl">
      {headerSection}
      <DataTable
        columns={columns}
        data={filteredData}
        emptyMessage="Nenhum comercial encontrado"
      />
    </div>
  );
}
