import { useNavigate } from "react-router-dom";
import { MapPin, ClipboardList, History, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant?: "default" | "primary" | "success";
}

function QuickAction({ icon, label, description, onClick, variant = "default" }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200",
        "active:scale-95 hover:shadow-md",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "success" && "bg-green-500 text-white hover:bg-green-600",
        variant === "default" && "bg-muted hover:bg-muted/80"
      )}
    >
      <div className="rounded-lg bg-white/20 p-2">
        {icon}
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm">{label}</p>
        <p className={cn(
          "text-xs",
          variant === "default" ? "text-muted-foreground" : "text-white/80"
        )}>
          {description}
        </p>
      </div>
    </button>
  );
}

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <span className="text-lg">⚡</span> Ações Rápidas
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <QuickAction
          icon={<MapPin className="h-5 w-5" />}
          label="Planejar Rotas"
          description="Organizar entregas"
          onClick={() => navigate("/logistica/rotas")}
          variant="primary"
        />
        <QuickAction
          icon={<ClipboardList className="h-5 w-5" />}
          label="Ver Ordens"
          description="Gerenciar pedidos"
          onClick={() => navigate("/logistica/ordens")}
          variant="success"
        />
        <QuickAction
          icon={<Package className="h-5 w-5" />}
          label="Em Andamento"
          description="Entregas ativas"
          onClick={() => navigate("/logistica/ordens?status=em_andamento")}
        />
        <QuickAction
          icon={<History className="h-5 w-5" />}
          label="Histórico"
          description="Entregas passadas"
          onClick={() => navigate("/logistica/historico")}
        />
      </div>
    </div>
  );
}
