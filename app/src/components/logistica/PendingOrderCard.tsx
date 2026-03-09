import { Package, Truck, RefreshCw, MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PendingOrderCardProps {
  ordem: {
    id: string;
    tipo: string;
    quantidade: number;
    created_at: string;
    leads?: {
      nome_fantasia: string;
      endereco_bairro?: string | null;
      endereco_cidade?: string | null;
    } | null;
  };
  onClick?: () => void;
}

const tipoConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  bobinas: { label: "Bobinas", icon: Package, color: "bg-blue-500" },
  entrega_equipamento: { label: "Equipamento", icon: Truck, color: "bg-green-500" },
  troca_equipamento: { label: "Troca", icon: RefreshCw, color: "bg-amber-500" },
};

export function PendingOrderCard({ ordem, onClick }: PendingOrderCardProps) {
  const config = tipoConfig[ordem.tipo] || tipoConfig.bobinas;
  const Icon = config.icon;

  const endereco = ordem.leads?.endereco_bairro && ordem.leads?.endereco_cidade
    ? `${ordem.leads.endereco_bairro}, ${ordem.leads.endereco_cidade}`
    : ordem.leads?.endereco_cidade || "Endereço não informado";

  const tempoDecorrido = formatDistanceToNow(new Date(ordem.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-lg p-2.5", config.color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm truncate">
              {ordem.leads?.nome_fantasia || "Cliente"}
            </p>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {ordem.quantidade} un
            </Badge>
          </div>
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {endereco}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tempoDecorrido}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
