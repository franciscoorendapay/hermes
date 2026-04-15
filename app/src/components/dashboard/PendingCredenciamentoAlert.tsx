import { useState, forwardRef } from "react";
import { Bell, ChevronRight } from "lucide-react";
import { Lead } from "@/hooks/useLeads";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PendingCredenciamentoAlertProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export const PendingCredenciamentoAlert = forwardRef<HTMLDivElement, PendingCredenciamentoAlertProps>(
  function PendingCredenciamentoAlert({ leads, onSelectLead }, _ref) {
  const [showSheet, setShowSheet] = useState(false);
  
  // Filtrar leads com credenciamento pendente (funil_app === 7)
  const pendingLeads = leads.filter(l => l.funil_app === 7);
  
  if (pendingLeads.length === 0) return null;

  const handleSelectLead = (lead: Lead) => {
    setShowSheet(false);
    onSelectLead(lead);
  };

  return (
    <>
      {/* Alerta clicável - discreto */}
      <button
        onClick={() => setShowSheet(true)}
        className={cn(
          "w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-lg",
          "bg-muted/50 hover:bg-muted transition-colors",
          "text-muted-foreground text-sm",
          "cursor-pointer"
        )}
      >
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span className="text-amber-600">
            <span className="font-medium">{pendingLeads.length}</span>
            {" "}credenciamento{pendingLeads.length > 1 ? 's' : ''} pendente{pendingLeads.length > 1 ? 's' : ''}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 opacity-40 flex-shrink-0" />
      </button>

      {/* Sheet com lista de leads pendentes */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-left">
                Credenciamentos Pendentes
              </SheetTitle>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              {pendingLeads.length} cliente{pendingLeads.length > 1 ? 's' : ''} aguardando envio de documentos
            </p>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {pendingLeads.map((lead) => (
                <button
                  key={lead.cod_lead}
                  onClick={() => handleSelectLead(lead)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 p-4 rounded-xl",
                    "bg-muted/50 hover:bg-muted transition-colors",
                    "text-left"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {(lead.nome_fantasia || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {lead.nome_fantasia}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aguardando envio de documentos
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
});
