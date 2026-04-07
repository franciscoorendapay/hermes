import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DataTable, SortableHeader } from '@/components/ui/data-table';

interface UserVisitas {
  userId: string;
  nome: string;
  metaNC: number;
  realizadoNC: number;
  visitas: number;
}

interface VisitasConversaoTableProps {
  data: UserVisitas[];
}

export function VisitasConversaoTable({ data }: VisitasConversaoTableProps) {
  const getConversao = (realizadoNC: number, visitas: number) => {
    if (visitas === 0) return 0;
    return Math.round((realizadoNC / visitas) * 100);
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 50) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
          <TrendingUp className="h-3 w-3" />
          {percentage}%
        </Badge>
      );
    }
    if (percentage >= 25) {
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
      visitas: acc.visitas + user.visitas,
    }),
    { metaNC: 0, realizadoNC: 0, visitas: 0 }
  );

  const columns: ColumnDef<UserVisitas>[] = [
    {
      accessorKey: 'nome',
      header: ({ column }) => <SortableHeader column={column} className="font-semibold">Comercial</SortableHeader>,
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
      accessorKey: 'visitas',
      header: ({ column }) => <SortableHeader column={column} className="mx-auto font-semibold">Visitas</SortableHeader>,
      cell: ({ row }) => <div className="text-center">{row.original.visitas}</div>,
    },
    {
      id: 'conversao',
      accessorFn: (row) => getConversao(row.realizadoNC, row.visitas),
      header: ({ column }) => <SortableHeader column={column} className="mx-auto font-semibold">Conversão</SortableHeader>,
      cell: ({ row }) => <div className="text-center">{getStatusBadge(getConversao(row.original.realizadoNC, row.original.visitas))}</div>,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          📈 Visitas e Conversão
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
                  <TableCell className="text-center">{totals.visitas}</TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(getConversao(totals.realizadoNC, totals.visitas))}
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
