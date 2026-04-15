import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FUNIL, FUNIL_COLORS } from '@/constants/funil';
import { formatMoney } from '@/lib/formatters';
import { List, Search } from 'lucide-react';

interface FunilOverviewCardProps {
  data: Record<number, number>;
  leadsByFunil?: Record<number, any[]>;
  usersMap?: Record<string, string>;
  isLoading?: boolean;
}

export function FunilOverviewCard({ data, leadsByFunil, usersMap, isLoading = false }: FunilOverviewCardProps) {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const selectedFunil = selectedStage !== null ? FUNIL.find(f => f.id === selectedStage) : null;
  const stageLeads: any[] = selectedStage !== null ? (leadsByFunil?.[selectedStage] || []) : [];
  const filteredLeads = search.trim()
    ? stageLeads.filter(l => {
        const s = search.toLowerCase();
        return (
          (l.nome_fantasia || '').toLowerCase().includes(s) ||
          (l.doc || '').includes(s) ||
          (usersMap?.[l.user_id] || '').toLowerCase().includes(s) ||
          (l.endereco_cidade || '').toLowerCase().includes(s)
        );
      })
    : stageLeads;

  const handleOpen = (stageId: number) => {
    setSelectedStage(stageId);
    setSearch('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🎯 Funil de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 h-4 bg-muted/40 rounded animate-shimmer shimmer-gradient" />
                <div className="flex-1 h-8 bg-muted/30 rounded-lg animate-shimmer shimmer-gradient" />
                <div className="w-12 h-4 bg-muted/40 rounded animate-shimmer shimmer-gradient" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = Object.values(data).reduce((acc, val) => acc + val, 0);

  const stages = FUNIL.map(stage => ({
    id: stage.id,
    label: stage.label,
    value: data[stage.id] || 0,
    color: FUNIL_COLORS[stage.id] || '#6B7280',
    percentage: total > 0 ? Math.round(((data[stage.id] || 0) / total) * 100) : 0,
  }));

  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🎯 Funil de Vendas
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {total} leads total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                {/* Label */}
                <div className="w-28 text-sm text-muted-foreground truncate shrink-0">
                  {stage.label}
                </div>

                {/* Barra de progresso */}
                <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max((stage.value / maxValue) * 100, stage.value > 0 ? 8 : 0)}%`,
                      backgroundColor: stage.color,
                    }}
                  >
                    {stage.value > 0 && (
                      <span className="text-xs font-bold text-white drop-shadow-sm">
                        {stage.value}
                      </span>
                    )}
                  </div>
                </div>

                {/* Percentual */}
                <div className="w-10 text-right text-sm font-medium text-muted-foreground shrink-0">
                  {stage.percentage}%
                </div>

                {/* Botão de detalhe */}
                {leadsByFunil && stage.value > 0 ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpen(stage.id)}
                    title={`Ver ${stage.value} leads em ${stage.label}`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <div className="h-7 w-7 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Legenda de conversão */}
          {total > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de conversão (Credenciados/Total)</span>
                <span className="font-bold text-green-600">
                  {Math.round(((data[5] || 0) / total) * 100)}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhe */}
      <Dialog open={selectedStage !== null} onOpenChange={(open) => !open && setSelectedStage(null)}>
        <DialogContent className="max-w-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selectedFunil ? FUNIL_COLORS[selectedFunil.id] : '#6B7280' }}
              />
              {selectedFunil?.label} — {stageLeads.length} leads
            </DialogTitle>
          </DialogHeader>

          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento, comercial ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 mt-2">
            {filteredLeads.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">
                Nenhum lead encontrado.
              </p>
            ) : (
              filteredLeads.map((lead: any) => {
                const comercial = usersMap?.[lead.user_id];
                const cidade = lead.endereco_cidade
                  ? `${lead.endereco_cidade}${lead.endereco_estado ? `/${lead.endereco_estado}` : ''}`
                  : null;
                return (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lead.nome_fantasia}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.doc || '—'} · {lead.telefone || '—'}
                      </p>
                    </div>
                    <div className="text-right text-xs shrink-0 space-y-0.5">
                      {comercial && (
                        <Badge variant="outline" className="text-[10px] h-4 font-normal">
                          {comercial}
                        </Badge>
                      )}
                      {cidade && <p className="text-muted-foreground">{cidade}</p>}
                    </div>
                    <div className="text-right shrink-0 font-semibold min-w-[72px]">
                      {lead.tpv ? formatMoney(parseFloat(lead.tpv)) : '—'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
