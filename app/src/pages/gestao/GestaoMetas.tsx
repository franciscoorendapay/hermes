import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetaForm } from '@/components/gestao/MetaForm';
import { useSubordinates } from '@/hooks/useSubordinates';
import { useGestaoMetas } from '@/hooks/useGestaoMetas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface MetaRow {
  id: string;
  nome: string;
  meta_clientes?: number;
  meta_valor?: string | number;
  meta_visitas?: number;
}

export default function GestaoMetas() {
  const [formOpen, setFormOpen] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const { subordinates, isLoading: subsLoading } = useSubordinates();
  const { metas, isLoading, saveMeta } = useGestaoMetas(mes, ano);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

  const prevMonth = () => {
    if (mes === 1) { setMes(12); setAno(ano - 1); }
    else setMes(mes - 1);
  };

  const nextMonth = () => {
    if (mes === 12) { setMes(1); setAno(ano + 1); }
    else setMes(mes + 1);
  };

  const handleEdit = (userId: string) => {
    setEditingUserId(userId);
    setFormOpen(true);
  };

  const isDataLoading = isLoading || subsLoading;

  const rows: MetaRow[] = subordinates.map(sub => {
    const meta = metas.find(m => m.user_id === sub.id);
    return {
      id: sub.id,
      nome: sub.nome,
      meta_clientes: meta?.meta_clientes,
      meta_valor: meta?.meta_valor,
      meta_visitas: meta?.meta_visitas,
    };
  });

  const columns: ColumnDef<MetaRow>[] = [
    {
      accessorKey: 'nome',
      header: ({ column }) => <SortableHeader column={column}>Comercial</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
    },
    {
      accessorKey: 'meta_clientes',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">Meta Clientes</SortableHeader>,
      cell: ({ row }) => <div className="text-right">{row.original.meta_clientes ?? '-'}</div>,
    },
    {
      accessorKey: 'meta_valor',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">Meta TPV</SortableHeader>,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.meta_valor ? formatCurrency(Number(row.original.meta_valor)) : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'meta_visitas',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">Meta Visitas</SortableHeader>,
      cell: ({ row }) => <div className="text-right">{row.original.meta_visitas ?? '-'}</div>,
    },
    {
      id: 'acoes',
      header: '',
      enableSorting: false,
      size: 50,
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original.id)}>
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Metas</h1>
          <p className="text-muted-foreground">Configure metas mensais por comercial</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Definir Meta
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="font-medium text-foreground">{monthNames[mes - 1]} {ano}</span>
        <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {isDataLoading ? (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comercial</TableHead>
                <TableHead className="text-right">Meta Clientes</TableHead>
                <TableHead className="text-right">Meta TPV</TableHead>
                <TableHead className="text-right">Meta Visitas</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <DataTable
            columns={columns}
            data={rows}
            emptyMessage="Nenhum comercial cadastrado"
          />
        </div>
      )}

      <MetaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingUserId(null);
        }}
        subordinates={subordinates}
        existingMetas={metas}
        mes={mes}
        ano={ano}
        onSave={saveMeta}
        initialUserId={editingUserId}
      />
    </div>
  );
}
