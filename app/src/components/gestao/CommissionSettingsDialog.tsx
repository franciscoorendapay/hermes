import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCommissionSettings, CommissionSettings } from '@/hooks/useCommissionSettings';
import { Settings2, TrendingUp, Minus, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommissionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommissionSettingsDialog({ open, onOpenChange }: CommissionSettingsDialogProps) {
  const { settings, isLoading, updateSettings, isUpdating } = useCommissionSettings();

  const [type, setType] = useState<'variable' | 'fixed'>(settings.type);
  const [rateNovos, setRateNovos] = useState<string>(String((settings.rate_novos ?? 0.07) * 100));
  const [rateConsolidados, setRateConsolidados] = useState<string>(String((settings.rate_consolidados ?? 0.035) * 100));
  const [rateFixed, setRateFixed] = useState<string>(String((settings.rate_fixed ?? 0.05) * 100));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when settings load
  useEffect(() => {
    setType(settings.type);
    setRateNovos(String(+((settings.rate_novos ?? 0.07) * 100).toFixed(2)));
    setRateConsolidados(String(+((settings.rate_consolidados ?? 0.035) * 100).toFixed(2)));
    setRateFixed(String(+((settings.rate_fixed ?? 0.05) * 100).toFixed(2)));
  }, [settings]);

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    try {
      const payload: Omit<CommissionSettings, 'updated_at' | 'updated_by'> =
        type === 'variable'
          ? {
              type: 'variable',
              rate_novos: parseFloat(rateNovos) / 100,
              rate_consolidados: parseFloat(rateConsolidados) / 100,
            }
          : {
              type: 'fixed',
              rate_fixed: parseFloat(rateFixed) / 100,
            };
      await updateSettings(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erro ao salvar configurações');
    }
  };

  const updatedAt = settings.updated_at
    ? format(new Date(settings.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-5 w-5 text-indigo-500" />
            Configuração de Comissão
          </DialogTitle>
          <DialogDescription>
            Define como a comissão dos comerciais é calculada na plataforma.
          </DialogDescription>
        </DialogHeader>

        {/* Last updated by */}
        {settings.updated_by && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              Última alteração por <strong>{settings.updated_by.name}</strong>
              {updatedAt && <> em {updatedAt}</>}
            </span>
          </div>
        )}

        {/* Type Selector - pill cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setType('variable')}
            className={`relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all ${
              type === 'variable'
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {type === 'variable' && (
              <CheckCircle className="absolute top-2.5 right-2.5 h-4 w-4 text-indigo-500" />
            )}
            <TrendingUp className={`h-5 w-5 ${type === 'variable' ? 'text-indigo-500' : 'text-slate-400'}`} />
            <div>
              <p className={`text-xs font-semibold ${type === 'variable' ? 'text-indigo-700' : 'text-slate-700'}`}>
                Taxa Variável
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                Baseada na safra do cliente<br />(M0–M3 e M4+)
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setType('fixed')}
            className={`relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all ${
              type === 'fixed'
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {type === 'fixed' && (
              <CheckCircle className="absolute top-2.5 right-2.5 h-4 w-4 text-indigo-500" />
            )}
            <Minus className={`h-5 w-5 ${type === 'fixed' ? 'text-indigo-500' : 'text-slate-400'}`} />
            <div>
              <p className={`text-xs font-semibold ${type === 'fixed' ? 'text-indigo-700' : 'text-slate-700'}`}>
                Taxa Fixa
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                Mesma % para todos<br />os clientes
              </p>
            </div>
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3 pt-1">
          {type === 'variable' ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-2">
                  Taxa Novos Clientes
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">M0 – M3</Badge>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={rateNovos}
                    onChange={(e) => setRateNovos(e.target.value)}
                    className="pr-8 h-9 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Clientes credenciados há 0 a 3 meses completos
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-2">
                  Taxa Consolidados
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-gray-100 text-gray-600 border-0">M4+</Badge>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={rateConsolidados}
                    onChange={(e) => setRateConsolidados(e.target.value)}
                    className="pr-8 h-9 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Clientes credenciados há 4+ meses
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Taxa Fixa para todos os clientes</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={rateFixed}
                  onChange={(e) => setRateFixed(e.target.value)}
                  className="pr-8 h-9 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Percentual aplicado igualmente para todos, independente da safra
              </p>
            </div>
          )}
        </div>

        {/* Feedback */}
        {saved && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            Configurações salvas com sucesso!
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isUpdating || isLoading}>
            {isUpdating ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
