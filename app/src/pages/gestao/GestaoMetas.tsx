import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetaForm } from '@/components/gestao/MetaForm';
import { useSubordinates } from '@/hooks/useSubordinates';
import { useGestaoMetas } from '@/hooks/useGestaoMetas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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

  if (isLoading || subsLoading) return <Skeleton className="h-96" />;

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
            {subordinates.map((sub) => {
              const meta = metas.find(m => m.user_id === sub.id);
              return (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.nome}</TableCell>
                  <TableCell className="text-right">{meta?.meta_clientes ?? '-'}</TableCell>
                  <TableCell className="text-right">{meta?.meta_valor ? formatCurrency(Number(meta.meta_valor)) : '-'}</TableCell>
                  <TableCell className="text-right">{meta?.meta_visitas ?? '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(sub.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
