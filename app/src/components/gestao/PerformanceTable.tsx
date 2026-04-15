import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable, SortableHeader } from '@/components/ui/data-table';

interface UserPerformance {
  userId: string;
  nome: string;
  metaNC: number;
  realizadoNC: number;
  metaTPV: number;
  realizadoTPV: number;
}

interface PerformanceTableProps {
  data: UserPerformance[];
}

export function PerformanceTable({ data }: PerformanceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getPercentage = (realizado: number, meta: number) => {
    if (meta === 0) return 0;
    return Math.round((realizado / meta) * 100);
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
          <TrendingUp className="h-3 w-3" />
          {percentage}%
        </Badge>
      );
    }
    if (percentage >= 60) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 gap-1">
          <Minus className="h-3 w-3" />
          {percentage}%
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 gap-1">
        <TrendingDown className="h-3 w-3" />
        {percentage}%
      </Badge>
    );
  };

  // Calcular totais
  const totals = data.reduce(
    (acc, user) => ({
      metaNC: acc.metaNC + user.metaNC,
      realizadoNC: acc.realizadoNC + user.realizadoNC,
      metaTPV: acc.metaTPV + user.metaTPV,
      realizadoTPV: acc.realizadoTPV + user.realizadoTPV,
    }),
    { metaNC: 0, realizadoNC: 0, metaTPV: 0, realizadoTPV: 0 }
  );

  const columns: ColumnDef<UserPerformance>[] = [
    {
      accessorKey: 'nome',
      header: ({ column }) => <SortableHeader column={column}>Comercial</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
    },
    {
      accessorKey: 'metaNC',
      header: ({ column }) => <SortableHeader column={column} className="mx-auto font-semibold">Meta NC</SortableHeader>,
      cell: ({ row }) => <div className="text-center">{row.original.metaNC}</div>,
    },
    {
      accessorKey: 'realizadoNC',
      header: ({ column }) => <SortableHeader column={column} className="mx-auto font-semibold">Realiz. NC</SortableHeader>,
      cell: ({ row }) => <div className="text-center font-semibold">{row.original.realizadoNC}</div>,
    },
    {
      id: 'pctNC',
      accessorFn: (row) => getPercentage(row.realizadoNC, row.metaNC),
      header: ({ column }) => <SortableHeader column={column} className="mx-auto font-semibold">% Conv NC</SortableHeader>,
      cell: ({ row }) => <div className="text-center">{getStatusBadge(getPercentage(row.original.realizadoNC, row.original.metaNC))}</div>,
    },
    {
      accessorKey: 'metaTPV',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto font-semibold">Meta TPV</SortableHeader>,
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.metaTPV)}</div>,
    },
    {
      accessorKey: 'realizadoTPV',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto font-semibold">Realiz. TPV</SortableHeader>,
      cell: ({ row }) => <div className="text-right font-semibold">{formatCurrency(row.original.realizadoTPV)}</div>,
    },
    {
      id: 'pctTPV',
      accessorFn: (row) => getPercentage(row.realizadoTPV, row.metaTPV),
      header: ({ column }) => <SortableHeader column={column} className="mx-auto font-semibold">% Ating.</SortableHeader>,
      cell: ({ row }) => <div className="text-center">{getStatusBadge(getPercentage(row.original.realizadoTPV, row.original.metaTPV))}</div>,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          📊 Performance da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <DataTable
            columns={columns}
            data={data}
            emptyMessage="Nenhum comercial encontrado"
            renderAfterRows={() =>
              data.length > 0 ? (
                <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                  <TableCell className="font-bold text-primary">TOTAL</TableCell>
                  <TableCell className="text-center">{totals.metaNC}</TableCell>
                  <TableCell className="text-center">{totals.realizadoNC}</TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(getPercentage(totals.realizadoNC, totals.metaNC))}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.metaTPV)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.realizadoTPV)}</TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(getPercentage(totals.realizadoTPV, totals.metaTPV))}
                  </TableCell>
                </TableRow>
              ) : null
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
