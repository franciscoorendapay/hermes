import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ComercialSelector } from './ComercialSelector';
import { Subordinate } from '@/hooks/useSubordinates';
import { Meta } from '@/hooks/useGestaoMetas';

interface MetaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subordinates: Subordinate[];
  existingMetas: Meta[];
  mes: number;
  ano: number;
  onSave: (data: {
    user_id: string;
    mes: number;
    ano: number;
    meta_clientes: number;
    meta_valor: number;
    meta_visitas: number;
  }) => Promise<boolean>;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MetaForm({
  open,
  onOpenChange,
  subordinates,
  existingMetas,
  mes,
  ano,
  onSave,
  initialUserId = null,
}: MetaFormProps & { initialUserId?: string | null }) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialUserId) {
        handleUserSelect(initialUserId);
      } else {
        setSelectedUserId(null);
        setMetaClientes('');
        setMetaValor('');
        setMetaVisitas('');
      }
    }
  }, [open, initialUserId]);
  const [metaClientes, setMetaClientes] = useState('');
  const [metaValor, setMetaValor] = useState('');
  const [metaVisitas, setMetaVisitas] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quando seleciona um usuário, preencher com metas existentes
  const handleUserSelect = (userId: string | null) => {
    setSelectedUserId(userId);

    if (userId) {
      const existingMeta = existingMetas.find(m => m.user_id === userId);
      if (existingMeta) {
        setMetaClientes(existingMeta.meta_clientes?.toString() || '');
        setMetaValor(existingMeta.meta_valor ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(Number(existingMeta.meta_valor)) : '');
        setMetaVisitas(existingMeta.meta_visitas?.toString() || '');
      } else {
        setMetaClientes('');
        setMetaValor('');
        setMetaVisitas('');
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedUserId) return;

    // Parse currency string back to number: "R$ 1.234,56" -> 1234.56
    const parseCurrency = (str: string) => {
      if (!str) return 0;
      return Number(str.replace(/\D/g, '')) / 100;
    };

    setIsLoading(true);
    const success = await onSave({
      user_id: selectedUserId,
      mes,
      ano,
      meta_clientes: parseInt(metaClientes) || 0,
      meta_valor: parseCurrency(metaValor),
      meta_visitas: parseInt(metaVisitas) || 0,
    });

    setIsLoading(false);
    if (success) {
      onOpenChange(false);
      setSelectedUserId(null);
      setMetaClientes('');
      setMetaValor('');
      setMetaVisitas('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Definir Meta</DialogTitle>
          <DialogDescription>
            Configure a meta mensal para {monthNames[mes - 1]} de {ano}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Comercial</Label>
            <ComercialSelector
              subordinates={subordinates}
              selectedId={selectedUserId}
              onSelect={handleUserSelect}
              showAllOption={false}
              placeholder="Selecione o comercial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-clientes">Meta de Clientes Credenciados</Label>
            <Input
              id="meta-clientes"
              type="number"
              placeholder="Ex: 10"
              value={metaClientes}
              onChange={(e) => setMetaClientes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-valor">Meta de TPV (R$)</Label>
            <Input
              id="meta-valor"
              type="text"
              placeholder="R$ 0,00"
              value={metaValor}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                const formatted = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(value) / 100);
                setMetaValor(formatted);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-visitas">Meta de Visitas</Label>
            <Input
              id="meta-visitas"
              type="number"
              placeholder="Ex: 30"
              value={metaVisitas}
              onChange={(e) => setMetaVisitas(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserId || isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar Meta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
