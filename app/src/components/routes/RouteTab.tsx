import { useMemo } from "react";
import { calculateDistance } from "@/hooks/useGeolocation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Navigation,
  Play,
  Clock,
  Grip,
  Trash2,
  MapPin,
  Route,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

export interface RouteStop {
  id: number;
  reminderId?: string;
  name: string;
  address: string;
  time: string;
  duration: string;
  selected: boolean;
  lat?: number;
  lng?: number;
}

interface RouteTabProps {
  stops: RouteStop[];
  onStopsChange: (stops: RouteStop[]) => void;
  routeSaved: boolean;
  onRouteSavedChange: (saved: boolean) => void;
}

export function RouteTab({ stops, onStopsChange, routeSaved, onRouteSavedChange }: RouteTabProps) {

  const toggleStop = (id: number) => {
    onStopsChange(
      stops.map((stop) =>
        stop.id === id ? { ...stop, selected: !stop.selected } : stop
      )
    );
  };

  const removeStop = (id: number) => {
    onStopsChange(stops.filter((s) => s.id !== id));
  };

  const selectedCount = stops.filter((s) => s.selected).length;

  // Calculate total distance between selected stops
  const totalDistance = useMemo(() => {
    const selectedStops = stops.filter((s) => s.selected && s.lat && s.lng);
    
    if (selectedStops.length < 2) return 0;
    
    let distance = 0;
    for (let i = 0; i < selectedStops.length - 1; i++) {
      const current = selectedStops[i];
      const next = selectedStops[i + 1];
      
      distance += calculateDistance(
        current.lat!,
        current.lng!,
        next.lat!,
        next.lng!
      );
    }
    
    // Apply 1.4x correction factor (straight line → real route) and convert to km
    return (distance * 1.4) / 1000;
  }, [stops]);

  // Calculate estimated time based on distance and number of stops
  const estimatedTime = useMemo(() => {
    const avgSpeedKmH = 30; // Average urban speed
    const travelTimeMinutes = (totalDistance / avgSpeedKmH) * 60;
    const visitTimeMinutes = selectedCount * 15; // 15 min per visit
    const totalMinutes = Math.round(travelTimeMinutes + visitTimeMinutes);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }, [totalDistance, selectedCount]);

  const handleSaveRoute = () => {
    onRouteSavedChange(true);
    toast.success("Rota salva com sucesso!");
  };

  const handleEditRoute = () => {
    onRouteSavedChange(false);
  };

  const handleStartRoute = () => {
    const selectedStops = stops.filter((s) => s.selected && s.lat && s.lng);
    if (selectedStops.length === 0) return;

    // Build Google Maps URL with waypoints
    const origin = selectedStops[0];
    const destination = selectedStops[selectedStops.length - 1];
    const waypoints = selectedStops.slice(1, -1);

    let url = `https://www.google.com/maps/dir/?api=1`;
    url += `&origin=${origin.lat},${origin.lng}`;
    url += `&destination=${destination.lat},${destination.lng}`;

    if (waypoints.length > 0) {
      const waypointsStr = waypoints
        .map((w) => `${w.lat},${w.lng}`)
        .join("|");
      url += `&waypoints=${waypointsStr}`;
    }

    url += `&travelmode=driving`;

    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stops List */}
      <Card className="glass flex-1 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              {routeSaved ? "Rota do Dia" : "Paradas"}
            </CardTitle>
            <Badge variant="secondary">
              {routeSaved ? `${selectedCount} paradas` : `${selectedCount} selecionadas`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 overflow-y-auto max-h-[calc(100vh-420px)]">
          {stops.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma parada adicionada</p>
              <p className="text-xs mt-1">
                Agende visitas na aba Agenda para criar sua rota do dia
              </p>
            </div>
          ) : (
            stops.map((stop, index) => (
              <div
                key={stop.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                  routeSaved
                    ? "bg-muted/50"
                    : stop.selected
                    ? "bg-primary/5 border border-primary/20 cursor-pointer"
                    : "bg-muted/50 hover:bg-muted cursor-pointer"
                }`}
                onClick={() => !routeSaved && toggleStop(stop.id)}
              >
                {!routeSaved && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <Grip className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <Checkbox checked={stop.selected} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium truncate">{stop.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{stop.address}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {stop.time}
                    </span>
                    {!routeSaved && (
                      <>
                        <span>•</span>
                        <span>{stop.duration}</span>
                      </>
                    )}
                  </div>
                </div>
                {!routeSaved && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStop(stop.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Route Summary */}
      <Card className="glass mt-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Distância Total</p>
                <p className="text-xl font-bold">
                  {totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : "0 km"}
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Tempo Estimado</p>
                <p className="text-xl font-bold">{estimatedTime}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Paradas</p>
                <p className="text-xl font-bold">{selectedCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        {routeSaved ? (
          <>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleEditRoute}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar Rota
            </Button>
            <Button
              className="flex-1"
              onClick={handleStartRoute}
              disabled={selectedCount === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Rota
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleSaveRoute}
              disabled={stops.length === 0}
            >
              Salvar Rota
            </Button>
            <Button
              className="flex-1"
              onClick={handleStartRoute}
              disabled={selectedCount === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Rota
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
