import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';

interface PerformanceData {
  userId: string;
  nome: string;
  metaNC: number;
  realizadoNC: number;
  metaTPV: number;
  realizadoTPV: number;
  visitas: number;
  metaVisitas: number;
}

interface TeamPerformanceTableProps {
  data: PerformanceData[];
  isLoading?: boolean;
}

export function TeamPerformanceTable({ data, isLoading = false }: TeamPerformanceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500/10 text-green-700 border-green-500/30';
    if (percentage >= 60) return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30';
    return 'bg-red-500/10 text-red-700 border-red-500/30';
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 100) return <TrendingUp className="h-3 w-3" />;
    if (percentage >= 60) return <Minus className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  // Ordenar por TPV realizado (maior primeiro)
  const sortedData = [...data].sort((a, b) => b.realizadoTPV - a.realizadoTPV);

  const columns: ColumnDef<PerformanceData>[] = [
    {
      id: 'rank',
      header: '#',
      enableSorting: false,
      cell: ({ row }) => <span className="font-medium text-muted-foreground">{row.index + 1}</span>,
      size: 40,
    },
    {
      accessorKey: 'nome',
      header: ({ column }) => <SortableHeader column={column}>Comercial</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {row.original.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className="truncate max-w-[120px]">{row.original.nome}</span>
        </div>
      ),
    },
    {
      id: 'nc',
      accessorFn: (row) => row.realizadoNC,
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">NC (Meta/Real)</SortableHeader>,
      cell: ({ row }) => {
        const ncPercentage = row.original.metaNC > 0 ? Math.round((row.original.realizadoNC / row.original.metaNC) * 100) : 0;
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">{row.original.realizadoNC}/{row.original.metaNC}</span>
            <Badge variant="outline" className={`text-xs ${getPercentageColor(ncPercentage)}`}>{ncPercentage}%</Badge>
          </div>
        );
      },
    },
    {
      id: 'tpv',
      accessorFn: (row) => row.realizadoTPV,
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">TPV (Meta/Real)</SortableHeader>,
      cell: ({ row }) => {
        const tpvPercentage = row.original.metaTPV > 0 ? Math.round((row.original.realizadoTPV / row.original.metaTPV) * 100) : 0;
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">{formatCurrency(row.original.realizadoTPV)}/{formatCurrency(row.original.metaTPV)}</span>
            <Badge variant="outline" className={`text-xs ${getPercentageColor(tpvPercentage)}`}>{tpvPercentage}%</Badge>
          </div>
        );
      },
    },
    {
      id: 'visitas',
      accessorFn: (row) => row.visitas,
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">Visitas</SortableHeader>,
      cell: ({ row }) => {
        const visitasPercentage = row.original.metaVisitas > 0 ? Math.round((row.original.visitas / row.original.metaVisitas) * 100) : 0;
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">{row.original.visitas}/{row.original.metaVisitas}</span>
            <Badge variant="outline" className={`text-xs ${getPercentageColor(visitasPercentage)}`}>{visitasPercentage}%</Badge>
          </div>
        );
      },
    },
    {
      id: 'atingimento',
      accessorFn: (row) => {
        const ncPct = row.metaNC > 0 ? Math.round((row.realizadoNC / row.metaNC) * 100) : 0;
        const tpvPct = row.metaTPV > 0 ? Math.round((row.realizadoTPV / row.metaTPV) * 100) : 0;
        const visPct = row.metaVisitas > 0 ? Math.round((row.visitas / row.metaVisitas) * 100) : 0;
        return Math.round((ncPct + tpvPct * 2 + visPct) / 4);
      },
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">Ating. Geral</SortableHeader>,
      cell: ({ row }) => {
        const ncPercentage = row.original.metaNC > 0 ? Math.round((row.original.realizadoNC / row.original.metaNC) * 100) : 0;
        const tpvPercentage = row.original.metaTPV > 0 ? Math.round((row.original.realizadoTPV / row.original.metaTPV) * 100) : 0;
        const visitasPercentage = row.original.metaVisitas > 0 ? Math.round((row.original.visitas / row.original.metaVisitas) * 100) : 0;
        const atingimentoGeral = Math.round((ncPercentage + tpvPercentage * 2 + visitasPercentage) / 4);
        return (
          <div className="flex justify-center">
            <Badge variant="outline" className={`${getPercentageColor(atingimentoGeral)} flex items-center gap-1`}>
              {getTrendIcon(atingimentoGeral)}
              {atingimentoGeral}%
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Performance da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Comercial</TableHead>
                  <TableHead className="text-center">NC (Meta/Real)</TableHead>
                  <TableHead className="text-center">TPV (Meta/Real)</TableHead>
                  <TableHead className="text-center">Visitas</TableHead>
                  <TableHead className="text-center">Ating. Geral</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><div className="h-4 w-4 bg-muted/40 rounded animate-shimmer shimmer-gradient" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted/40 animate-shimmer shimmer-gradient" />
                        <div className="h-4 w-24 bg-muted/40 rounded animate-shimmer shimmer-gradient" />
                      </div>
                    </TableCell>
                    <TableCell><div className="h-4 w-16 mx-auto bg-muted/40 rounded animate-shimmer shimmer-gradient" /></TableCell>
                    <TableCell><div className="h-4 w-16 mx-auto bg-muted/40 rounded animate-shimmer shimmer-gradient" /></TableCell>
                    <TableCell><div className="h-4 w-12 mx-auto bg-muted/40 rounded animate-shimmer shimmer-gradient" /></TableCell>
                    <TableCell><div className="h-6 w-12 mx-auto bg-muted/40 rounded-full animate-shimmer shimmer-gradient" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={sortedData}
            emptyMessage="Nenhum dado de performance encontrado"
          />
        )}
      </CardContent>
    </Card>
  );
}
