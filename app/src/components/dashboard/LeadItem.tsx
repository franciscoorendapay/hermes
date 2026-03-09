import { useState } from "react";
import { ChevronRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { FUNIL } from "@/constants/funil";
import { formatCpfCnpj, formatMoney, formatDateTime, formatTimeAgo } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { getEffectiveFunilId, diasSemAtividade } from "@/lib/leadUtils";
import type { Lead } from "@/hooks/useLeads";

interface LeadItemProps {
  lead: Lead;
  onEdit?: (leadId: string) => void;
  onAction?: (leadId: string, action: string) => void;
  onViewProfile?: (lead: Lead) => void;
}

const getActionButton = (funilId: number): { label: string; color: string; action: string } | null => {
  switch (funilId) {
    case 1: // Prospecção → próximo: Qualificação
      return { label: "Qualificar", color: "bg-blue-500 hover:bg-blue-600", action: "qualificar" };
    case 2: // Qualificação → próximo: Proposta (Negociação)
      return { label: "Negociar", color: "bg-yellow-500 hover:bg-yellow-600", action: "negociar" };
    case 3: // Proposta → próximo: Precificação
      return { label: "Precificar", color: "bg-purple-500 hover:bg-purple-600", action: "precificar" };
    case 4: // Precificado → próximo: Credenciar
      return { label: "Credenciar", color: "bg-orange-500 hover:bg-orange-600", action: "credenciar" };
    // case 7 removido - Cred. Pendente é tratado via alerta no Dashboard + perfil
    case 7: // Cred. Pendente → Finalizar Credenciamento
      return { label: "Finalizar Cred.", color: "bg-amber-500 hover:bg-amber-600", action: "finalizar_credenciamento" };
    case 8: // Frio → Retomar
      return { label: "Retomar", color: "bg-slate-500 hover:bg-slate-600", action: "retomar" };
    default:
      return null;
  }
};

export function LeadItem({ lead, onEdit, onAction, onViewProfile }: LeadItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Usar status efetivo (pode ser "Frio" se sem atividade)
  const effectiveFunilId = getEffectiveFunilId(lead);
  const funilStatus = FUNIL.find(e => e.id === effectiveFunilId);
  const actionButton = getActionButton(effectiveFunilId);
  const diasParado = diasSemAtividade(lead.updated_at);

  return (
    <div className="border-b border-border last:border-b-0 py-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-xs uppercase tracking-wide text-gray-400 font-normal">
            {formatTimeAgo(lead.updated_at || lead.data_registro)}
          </span>
          <p className="font-semibold text-base text-gray-800">
            {lead.nome_fantasia || lead.nome1}
          </p>
          <div className="flex items-center gap-2">
            {funilStatus && (
              <span
                className={cn(
                  "inline-block text-xs font-medium px-3 py-0.5 rounded-full",
                  funilStatus.color,
                  funilStatus.textColor
                )}
              >
                {funilStatus.label}
              </span>
            )}
            {effectiveFunilId === 8 && diasParado > 0 && (
              <span className="text-xs text-slate-500">
                {diasParado} dias parado
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onViewProfile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile(lead);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronRight
            className={cn(
              "h-5 w-5 text-gray-300 transition-transform",
              isOpen && "rotate-90"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-2.5 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            <span className="text-sm font-normal text-gray-400">CPF/CNPJ:</span>
            <span className="text-sm font-medium text-gray-700">
              {lead.doc && lead.doc !== '0' ? formatCpfCnpj(lead.doc) : 'N/I'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-sm font-normal text-gray-400">TPV:</span>
            <span className="text-sm font-medium text-gray-700">
              {formatMoney(Number(lead.tpv || 0))}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-sm font-normal text-gray-400">Data:</span>
            <span className="text-sm font-medium text-gray-700">
              {formatDateTime(lead.data_registro)}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {actionButton && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.(lead.id, actionButton.action);
                }}
                className={cn(
                  "h-8 px-4 text-white font-semibold rounded-md",
                  actionButton.color
                )}
              >
                {actionButton.label}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
