import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Route, Calendar } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MapTab } from "@/components/routes/MapTab";
import { RouteTab, type RouteStop } from "@/components/routes/RouteTab";
import { AgendaTab } from "@/components/routes/AgendaTab";
import type { PlaceResult } from "@/components/routes/PlacesSearch";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { useReminders } from "@/hooks/useReminders";
import { useRoutes } from "@/hooks/useRoutes";
import { toast } from "sonner";
import { isToday, parseISO } from "date-fns";

export default function Routes() {
  const [activeTab, setActiveTab] = useState("mapa");
  const [addVisitOpen, setAddVisitOpen] = useState(false);
  const [addVisitInitialPlace, setAddVisitInitialPlace] = useState<PlaceResult | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [routeSaved, setRouteSaved] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: leads = [], refetch: refetchLeads } = useLeads(isAuthenticated);
  const { reminders } = useReminders(isAuthenticated);
  const { currentRoute, fetchRoute, saveRoute, loading: routesLoading } = useRoutes(isAuthenticated);
  const location = useLocation();

  // Filter reminders to get today's appointments
  const todayReminders = useMemo(() => {
    return reminders.filter((r) => isToday(parseISO(r.data_lembrete)));
  }, [reminders]);

  const prevRemindersRef = useRef<typeof todayReminders>([]);

  // Initial fetch of route for today
  useEffect(() => {
    if (isAuthenticated) {
      fetchRoute(new Date());
    }
  }, [isAuthenticated, fetchRoute]);

  const prevCurrentRouteIdRef = useRef<number | null>(null);

  // Load stops from saved route WHEN currentRoute changes
  useEffect(() => {
    if (currentRoute && currentRoute.id !== prevCurrentRouteIdRef.current) {
      // If we have a saved route from backend
      setRouteSaved(true);
      const savedStops: RouteStop[] = currentRoute.items.map((item) => {
        const reminder = item.reminder;

        // Build address
        const address = reminder.estabelecimento_endereco
          ? [
            reminder.estabelecimento_endereco,
            reminder.estabelecimento_numero,
            reminder.estabelecimento_bairro,
            reminder.estabelecimento_cidade,
          ]
            .filter(Boolean)
            .join(", ")
          : "Endereço não informado";

        return {
          id: Date.now() + item.sequence, // or just item.id
          reminderId: String(reminder.id),
          name: reminder.lead?.tradeName || reminder.estabelecimento_nome || "Estabelecimento",
          address,
          time: reminder.hora_lembrete.substring(0, 5),
          duration: "15 min",
          selected: true,
          lat: reminder.estabelecimento_lat || undefined,
          lng: reminder.estabelecimento_lng || undefined,
        };
      });
      setStops((currentStops) => {
        // Mantenha quaisquer paradas que já carregaram (ex: novos agendamentos criados)
        // que ainda não estejam salvos na rota (identificados pela falta do reminderId na rota)
        const unsavedExistingStops = currentStops.filter(
          (s) => !savedStops.some((saved) => saved.reminderId === s.reminderId)
        );
        return [...savedStops, ...unsavedExistingStops];
      });
      prevCurrentRouteIdRef.current = currentRoute.id;
    }
  }, [currentRoute]);

  // Sync added/removed reminders to stops dynamically
  useEffect(() => {
    const current = todayReminders;
    const prev = prevRemindersRef.current;

    const addedReminders = current.filter((c) => !prev.some((p) => p.id === c.id));
    const removedReminders = prev.filter((p) => !current.some((c) => c.id === p.id));

    if (addedReminders.length > 0 || removedReminders.length > 0) {
      setStops((currentStops) => {
        let newStops = [...currentStops];
        
        if (removedReminders.length > 0) {
          const removedIds = new Set(removedReminders.map((r) => String(r.id)));
          newStops = newStops.filter((s) => !s.reminderId || !removedIds.has(s.reminderId));
        }

        if (addedReminders.length > 0) {
          // Avoid duplicate entry if the map/route logic already added it
          const newAddedReminders = addedReminders.filter(
            (reminder) => !currentStops.some((s) => s.reminderId === String(reminder.id))
          );

          if (newAddedReminders.length > 0) {
            const addedStops: RouteStop[] = newAddedReminders.map((reminder, index) => {
              const address = reminder.estabelecimento_endereco
                ? [
                  reminder.estabelecimento_endereco,
                  reminder.estabelecimento_numero,
                  reminder.estabelecimento_bairro,
                  reminder.estabelecimento_cidade,
                ]
                  .filter(Boolean)
                  .join(", ")
                : "Endereço não informado";

              return {
                id: Date.now() + index + Math.random(),
                reminderId: String(reminder.id),
                name: reminder.lead?.tradeName || reminder.estabelecimento_nome || "Estabelecimento",
                address,
                time: reminder.hora_lembrete.substring(0, 5),
                duration: "15 min",
                // Select newly added ones by default!
                selected: true,
                lat: reminder.estabelecimento_lat || undefined,
                lng: reminder.estabelecimento_lng || undefined,
              };
            });
            newStops = [...newStops, ...addedStops];
          }
        }
        
        return newStops;
      });

      // A real dynamic sync happened (either removed or added), so the route is now modified
      setRouteSaved(false);
    }
    
    prevRemindersRef.current = current;
  }, [todayReminders]);

  // Effect to handle navigation state
  useEffect(() => {
    // Handle activeTab from state (from Dashboard Planejamento button)
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state to avoid setting tab on subsequent navigations
      window.history.replaceState({}, document.title);
    }

    // Handle addToRoute from state (from Dashboard reminder)
    if (location.state?.addToRoute) {
      const place = location.state.addToRoute;
      const newStop: RouteStop = {
        id: Date.now(),
        name: place.name,
        address: place.address,
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: "15 min",
        selected: true,
        lat: place.lat,
        lng: place.lng,
      };
      setStops((prev) => [...prev, newStop]);
      setActiveTab("roteirizacao");
      toast.success(`${place.name} adicionado à rota!`);

      // Clear the state to avoid re-adding on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAddToRoute = useCallback((place: PlaceResult) => {
    // Now this serves as "Abrir nova visita com o lugar pre-selecionado"
    setAddVisitInitialPlace(place);
    setAddVisitOpen(true);
    setActiveTab("agenda"); // Switch to agenda tab to show the dialog
  }, []);

  const handleCreateLead = useCallback((place: PlaceResult) => {
    console.log("Creating lead:", place);
    toast.success(`Lead ${place.name} criado com sucesso`);
  }, []);

  const handleRouteSave = async (saved: boolean) => {
    if (saved) {
      // Save logic
      const selectedStops = stops.filter(s => s.selected);
      const reminderIds = selectedStops
        .map(s => s.reminderId)
        .filter((id): id is string => !!id); // Filter out undefined

      // If we have stops without reminderId (e.g. from map search), we might need to create reminders for them first?
      if (selectedStops.length > reminderIds.length) {
        toast.warning("Algumas paradas não são lembretes e não foram salvas.");
      }

      const result = await saveRoute(new Date(), reminderIds);
      if (result?.success) {
        setRouteSaved(true);
        toast.success("Rota salva com sucesso!");
      }
    } else {
      // Edit logic
      setRouteSaved(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <PageHeader
        title="Roteirização"
        description="Planeje e otimize suas rotas de visita"
        showBack
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="mapa" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Mapa</span>
          </TabsTrigger>
          <TabsTrigger value="roteirizacao" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Route className="h-4 w-4" />
            <span className="hidden sm:inline">Roteirização</span>
          </TabsTrigger>
          <TabsTrigger 
            value="agenda" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            onClick={() => setAddVisitOpen(true)}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Agenda</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="flex-1 mt-4 data-[state=inactive]:hidden">
          <div className="h-full min-h-[500px] rounded-xl overflow-hidden">
            <MapTab
              leads={leads}
              onAddToRoute={handleAddToRoute}
              onCreateLead={handleCreateLead}
              onLeadSaved={() => refetchLeads()}
            />
          </div>
        </TabsContent>

        <TabsContent value="roteirizacao" className="flex-1 mt-4 data-[state=inactive]:hidden">
          <RouteTab
            stops={stops}
            onStopsChange={setStops}
            routeSaved={routeSaved}
            onRouteSavedChange={handleRouteSave}
          />
        </TabsContent>

        <TabsContent value="agenda" className="flex-1 mt-4 data-[state=inactive]:hidden">
          <AgendaTab 
            addVisitOpen={addVisitOpen}
            setAddVisitOpen={(open) => {
              setAddVisitOpen(open);
              if (!open) setAddVisitInitialPlace(null);
            }}
            addVisitInitialPlace={addVisitInitialPlace}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
