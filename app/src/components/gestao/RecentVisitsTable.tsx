import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { http } from '@/shared/api/http';
import { DataTable, SortableHeader } from '@/components/ui/data-table';

interface RecentVisitsTableProps {
  userId: string;
}

interface Visit {
  id: string;
  data_visita: string | null;
  tipo: string;
  status: string;
  lead_nome: string;
}

export function RecentVisitsTable({ userId }: RecentVisitsTableProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVisits() {
      setIsLoading(true);
      try {
        const response = await http.get(`/visits?user_ids=${userId}`);
        const visitasData = response.data || [];

        if (visitasData.length === 0) {
          setVisits([]);
          return;
        }

        const visitasFormatadas: Visit[] = visitasData.slice(0, 10).map((v: any) => ({
          id: String(v.id),
          data_visita: v.data_visita || v.dataVisita,
          tipo: v.tipo,
          status: v.status,
          lead_nome: v.leadNome || v.lead_nome || v.lead?.companyName || v.lead?.company_name || v.lead?.tradeName || v.lead?.trade_name || v.lead?.name || 'Lead não identificado',
        }));

        setVisits(visitasFormatadas);
      } catch (error) {
        console.error('Error fetching visits:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVisits();
  }, [userId]);

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      prospeccao: 'Prospecção',
      negociacao: 'Negociação',
      credenciamento: 'Credenciamento',
      suporte: 'Suporte',
    };
    return tipos[tipo] || tipo;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'realizada':
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Realizada
          </Badge>
        );
      case 'pendente':
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'cancelada':
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Visit>[] = [
    {
      accessorKey: 'data_visita',
      header: ({ column }) => <SortableHeader column={column}>Data</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {row.original.data_visita
            ? format(new Date(row.original.data_visita), 'dd/MM/yyyy', { locale: ptBR })
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      enableSorting: false,
      cell: ({ row }) => <Badge variant="outline">{getTipoLabel(row.original.tipo)}</Badge>,
    },
    {
      accessorKey: 'lead_nome',
      header: ({ column }) => <SortableHeader column={column}>Estabelecimento</SortableHeader>,
      cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.lead_nome}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableSorting: false,
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Histórico de Visitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Histórico de Visitas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma visita registrada</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={visits}
            emptyMessage="Nenhuma visita registrada"
          />
        )}
      </CardContent>
    </Card>
  );
}
