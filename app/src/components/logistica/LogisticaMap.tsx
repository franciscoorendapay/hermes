import { useEffect, useRef, useState } from "react";
import { Package, Truck, RefreshCw, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGoogleMaps, USE_REAL_MAPS } from "@/hooks/useGoogleMaps";

interface OrdemParaMapa {
  id: string;
  tipo: string;
  quantidade: number;
  leads: {
    nome_fantasia: string;
    lat?: number | null;
    lng?: number | null;
    endereco_logradouro?: string | null;
    endereco_numero?: string | null;
    endereco_bairro?: string | null;
    endereco_cidade?: string | null;
    endereco_estado?: string | null;
  } | null;
}

interface LogisticaMapProps {
  ordens: OrdemParaMapa[];
  selectedIds: string[];
  onSelectOrdem: (id: string) => void;
  className?: string;
}

const tipoConfig: Record<string, { label: string; icon: React.ElementType; color: string; markerColor: string }> = {
  bobinas: { label: "Bobinas", icon: Package, color: "bg-blue-500", markerColor: "#3B82F6" },
  entrega_equipamento: { label: "Equipamento", icon: Truck, color: "bg-green-500", markerColor: "#22C55E" },
  troca_equipamento: { label: "Troca", icon: RefreshCw, color: "bg-amber-500", markerColor: "#F59E0B" },
};

export function LogisticaMap({ ordens, selectedIds, onSelectOrdem, className }: LogisticaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { isLoaded } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Ordens com coordenadas válidas
  const ordensComCoordenadas = ordens.filter(
    (o) => o.leads?.lat && o.leads?.lng
  );

  // Inicializa mapa real do Google
  useEffect(() => {
    if (!USE_REAL_MAPS || !isLoaded || !mapRef.current || ordensComCoordenadas.length === 0) return;

    const center = ordensComCoordenadas.length > 0
      ? { lat: Number(ordensComCoordenadas[0].leads!.lat!), lng: Number(ordensComCoordenadas[0].leads!.lng!) }
      : { lat: -23.5505, lng: -46.6333 }; // São Paulo

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      mapId: "logistica-map",
      disableDefaultUI: true,
      zoomControl: true,
    });

    setMap(mapInstance);

    return () => {
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];
    };
  }, [isLoaded, ordensComCoordenadas.length]);

  // Atualiza marcadores
  useEffect(() => {
    if (!map || !USE_REAL_MAPS) return;

    // Verifica se AdvancedMarkerElement está disponível
    if (!google.maps.marker?.AdvancedMarkerElement) {
      console.warn("AdvancedMarkerElement não disponível. Usando marcadores padrão.");

      // Fallback para marcadores padrão
      ordensComCoordenadas.forEach((ordem) => {
        const config = tipoConfig[ordem.tipo] || tipoConfig.bobinas;

        const marker = new google.maps.Marker({
          map,
          position: { lat: Number(ordem.leads!.lat!), lng: Number(ordem.leads!.lng!) },
          title: ordem.leads!.nome_fantasia,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: config.markerColor,
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 10,
          },
        });

        marker.addListener("click", () => {
          onSelectOrdem(ordem.id);
        });
      });
      return;
    }

    // Remove marcadores antigos
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    // Cria novos marcadores com AdvancedMarkerElement
    ordensComCoordenadas.forEach((ordem) => {
      const config = tipoConfig[ordem.tipo] || tipoConfig.bobinas;
      const isSelected = selectedIds.includes(ordem.id);

      const markerContent = document.createElement("div");
      markerContent.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="rounded-full p-2 shadow-lg transition-transform ${isSelected ? 'scale-125 ring-2 ring-white' : ''}" style="background-color: ${config.markerColor}">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
          </div>
          <div class="w-2 h-2 rounded-full bg-current mt-0.5" style="color: ${config.markerColor}"></div>
        </div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: Number(ordem.leads!.lat!), lng: Number(ordem.leads!.lng!) },
        content: markerContent,
        title: ordem.leads!.nome_fantasia,
      });

      marker.addListener("click", () => {
        onSelectOrdem(ordem.id);
      });

      markersRef.current.push(marker);
    });

    // Ajusta bounds
    if (ordensComCoordenadas.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      ordensComCoordenadas.forEach((o) => {
        bounds.extend({ lat: o.leads!.lat!, lng: o.leads!.lng! });
      });
      map.fitBounds(bounds);
    }
  }, [map, ordensComCoordenadas, selectedIds, onSelectOrdem]);

  // Renderiza mapa simulado se API não disponível
  if (!USE_REAL_MAPS || !isLoaded) {
    return (
      <div className={cn("rounded-xl border bg-muted/50 overflow-hidden", className)}>
        <div className="relative h-full min-h-[250px] bg-gradient-to-br from-blue-100 to-green-50 dark:from-blue-950 dark:to-green-950">
          {/* Grid simulado */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Marcadores simulados */}
          <div className="relative h-full p-4">
            <div className="flex flex-wrap gap-2 justify-center items-center h-full">
              {ordensComCoordenadas.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma entrega com localização</p>
                </div>
              ) : (
                ordensComCoordenadas.map((ordem) => {
                  const config = tipoConfig[ordem.tipo] || tipoConfig.bobinas;
                  const Icon = config.icon;
                  const isSelected = selectedIds.includes(ordem.id);

                  return (
                    <button
                      key={ordem.id}
                      onClick={() => onSelectOrdem(ordem.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                        isSelected ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
                      )}
                    >
                      <div className={cn("rounded-full p-2", config.color)}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-medium truncate max-w-[80px]">
                        {ordem.leads?.nome_fantasia}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Legenda */}
          <div className="absolute bottom-2 left-2 flex gap-2">
            {Object.entries(tipoConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Badge key={key} variant="secondary" className="text-xs gap-1">
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border overflow-hidden relative", className)}>
      <div ref={mapRef} className="h-full min-h-[250px]" />

      {/* Legenda */}
      <div className="absolute bottom-2 left-2 flex gap-2 z-10">
        {Object.entries(tipoConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Badge key={key} variant="secondary" className="text-xs gap-1 bg-background/90">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
