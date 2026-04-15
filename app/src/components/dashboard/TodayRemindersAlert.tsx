import { useState } from "react";
import { Bell, ChevronRight, Clock, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Reminder } from "@/hooks/useReminders";

interface TodayRemindersAlertProps {
  reminders: Reminder[];
  onSelectReminder: (reminder: Reminder) => void;
  onMarkComplete: (reminderId: string) => void;
  onAddToRoute: (reminder: Reminder) => void;
}

export function TodayRemindersAlert({
  reminders,
  onSelectReminder,
  onMarkComplete,
  onAddToRoute,
}: TodayRemindersAlertProps) {
  const [sheetType, setSheetType] = useState<"today" | "tomorrow" | null>(null);

  // Calculate today and tomorrow dates
  const today = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split("T")[0];

  // Filter only explicit reminders (not scheduled visits from route planning)
  const todayReminders = reminders.filter(
    (r) => r.data_lembrete === today && !r.adicionado_rota && r.tipo === 'lembrete'
  );
  const tomorrowReminders = reminders.filter(
    (r) => r.data_lembrete === tomorrow && !r.adicionado_rota && r.tipo === 'lembrete'
  );

  // If no reminders for today or tomorrow, return null
  if (todayReminders.length === 0 && tomorrowReminders.length === 0) return null;

  const handleSelectReminder = (reminder: Reminder) => {
    setSheetType(null);
    onSelectReminder(reminder);
  };

  const formatTime = (time: string) => {
    // time is in format HH:MM:SS, return HH:MM
    return time.slice(0, 5);
  };

  const activeReminders = sheetType === "today" ? todayReminders : tomorrowReminders;
  const sheetTitle = sheetType === "today" ? "Lembretes de Hoje" : "Lembretes de Amanhã";

  return (
    <>
      <div className="space-y-2">
        {/* Today's reminders alert */}
        {todayReminders.length > 0 && (
          <button
            onClick={() => setSheetType("today")}
            className={cn(
              "w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-lg",
              "bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors",
              "text-blue-600 text-sm",
              "cursor-pointer"
            )}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span>
                Você tem{" "}
                <span className="font-medium">{todayReminders.length}</span>
                {" "}lembrete{todayReminders.length > 1 ? "s" : ""} para hoje
              </span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-60 flex-shrink-0" />
          </button>
        )}

        {/* Tomorrow's reminders alert */}
        {tomorrowReminders.length > 0 && (
          <button
            onClick={() => setSheetType("tomorrow")}
            className={cn(
              "w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-lg",
              "bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors",
              "text-amber-600 text-sm",
              "cursor-pointer"
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span>
                Você tem{" "}
                <span className="font-medium">{tomorrowReminders.length}</span>
                {" "}lembrete{tomorrowReminders.length > 1 ? "s" : ""} para amanhã
              </span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-60 flex-shrink-0" />
          </button>
        )}
      </div>

      <Sheet open={sheetType !== null} onOpenChange={(open) => !open && setSheetType(null)}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Bell className={cn(
                "h-5 w-5",
                sheetType === "today" ? "text-blue-500" : "text-amber-500"
              )} />
              {sheetTitle}
            </SheetTitle>
            <SheetDescription>
              {activeReminders.length} lembrete
              {activeReminders.length > 1 ? "s" : ""} pendente
              {activeReminders.length > 1 ? "s" : ""}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100%-80px)]">
            <div className="space-y-3 pr-4">
              {activeReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="p-4 bg-muted/50 rounded-xl border border-border"
                >
                  {/* Info do lembrete (clicável para ver perfil) */}
                  <div
                    className="cursor-pointer"
                    onClick={() => handleSelectReminder(reminder)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatTime(reminder.hora_lembrete)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground">
                      {reminder.lead?.tradeName || "Lead"}
                    </h4>
                    {reminder.descricao && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {reminder.descricao}
                      </p>
                    )}
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => onAddToRoute(reminder)}
                    >
                      <MapPin className="h-4 w-4" />
                      Adicionar à Rota
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => onMarkComplete(reminder.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Concluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
