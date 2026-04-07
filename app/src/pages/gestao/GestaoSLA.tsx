import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Save, AlertTriangle } from "lucide-react";

interface SlaConfig {
  id: string;
  tipo: string;
  prazo_dias: number;
  descricao: string | null;
}

const tipoLabels: Record<string, string> = {
  bobinas: "Envio de Bobinas",
  troca_equipamento: "Troca de Equipamento",
  retirada_equipamento: "Retirada de Equipamento",
  entrega_equipamento: "Entrega de Equipamento",
};

export default function GestaoSLA() {
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from("sla_config")
        .select("*")
        .order("tipo");

      if (error) throw error;

      setConfigs(data || []);
      // Inicializar valores editados
      const initialValues: Record<string, number> = {};
      (data || []).forEach((config) => {
        initialValues[config.id] = config.prazo_dias;
      });
      setEditedValues(initialValues);
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
      toast.error("Erro ao carregar configurações de SLA");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config: SlaConfig) => {
    const newValue = editedValues[config.id];
    if (newValue === config.prazo_dias) return;

    if (newValue < 1) {
      toast.error("O prazo deve ser no mínimo 1 dia útil");
      return;
    }

    setSaving((prev) => ({ ...prev, [config.id]: true }));
    try {
      const { error } = await supabase
        .from("sla_config")
        .update({ prazo_dias: newValue })
        .eq("id", config.id);

      if (error) throw error;

      toast.success(`SLA de "${tipoLabels[config.tipo] || config.tipo}" atualizado!`);
      fetchConfigs();
    } catch (err) {
      console.error("Erro ao atualizar SLA:", err);
      toast.error("Erro ao atualizar configuração");
    } finally {
      setSaving((prev) => ({ ...prev, [config.id]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuração de SLA</h1>
        <p className="text-muted-foreground mt-1">
          Defina os prazos de entrega para cada tipo de ordem de serviço
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Atenção</p>
            <p className="text-amber-700">
              Os prazos são calculados em <strong>dias úteis</strong> (excluindo sábados e domingos).
              Ordens que ultrapassarem o prazo serão marcadas como "Atrasado" na área de logística.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : configs.map((config) => {
          const hasChanges = editedValues[config.id] !== config.prazo_dias;
          const isSaving = saving[config.id];

          return (
            <Card key={config.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {tipoLabels[config.tipo] || config.tipo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`prazo-${config.id}`} className="text-sm text-muted-foreground">
                      Prazo de entrega (dias úteis)
                    </Label>
                    <Input
                      id={`prazo-${config.id}`}
                      type="number"
                      min={1}
                      max={30}
                      value={editedValues[config.id] || 1}
                      onChange={(e) =>
                        setEditedValues((prev) => ({
                          ...prev,
                          [config.id]: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="mt-1 max-w-[120px]"
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(config)}
                    disabled={!hasChanges || isSaving}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
                {config.descricao && (
                  <p className="text-xs text-muted-foreground mt-2">{config.descricao}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {configs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma configuração de SLA encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
