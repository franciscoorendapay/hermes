import { useState, useCallback, useMemo } from "react";
import { MapPin, Navigation, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { FUNIL_COLORS_MAP, FUNIL_LABELS_MAP } from "@/constants/funil";
import type { Lead } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";

interface SimulatedMapProps {
  leads: Lead[];
  height?: string;
  showControls?: boolean;
  onMarkerClick?: (lead: Lead) => void;
  selectedPlace?: { lat: number; lng: number; name: string } | null;
  children?: React.ReactNode;
}

// Convert lat/lng to pixel position within the map
function latLngToPixel(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  mapWidth: number,
  mapHeight: number
) {
  const scale = Math.pow(2, zoom) * 100;
  const x = mapWidth / 2 + (lng - centerLng) * scale;
  const y = mapHeight / 2 - (lat - centerLat) * scale;
  return { x, y };
}

export function SimulatedMap({
  leads,
  height = "100%",
  showControls = true,
  onMarkerClick,
  selectedPlace,
  children,
}: SimulatedMapProps) {
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const [zoom, setZoom] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const center = useMemo(
    () => ({ lat: latitude, lng: longitude }),
    [latitude, longitude]
  );

  const leadsWithCoords = useMemo(
    () => leads.filter((lead) => lead.lat && lead.lng),
    [leads]
  );

  const getFunilLabel = useCallback((funilId: number) => {
    return FUNIL_LABELS_MAP[funilId] || "Desconhecido";
  }, []);

  const handleMarkerClick = useCallback(
    (lead: Lead) => {
      setSelectedLead(lead);
      onMarkerClick?.(lead);
    },
    [onMarkerClick]
  );

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.5, 0.5));
  }, []);

  const handleCenterOnUser = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  if (geoLoading) {
    return <Skeleton className="w-full rounded-lg" style={{ height }} />;
  }

  const mapWidth = 800;
  const mapHeight = 600;

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-muted/30 to-muted/50"
      style={{ height }}
    >
      {/* Grid background simulating streets */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
        }}
      />

      {/* Map content container */}
      <div
        className="absolute inset-0 transition-transform duration-200"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Lead markers */}
        {leadsWithCoords.map((lead) => {
          const pos = latLngToPixel(
            lead.lat!,
            lead.lng!,
            center.lat,
            center.lng,
            1,
            mapWidth,
            mapHeight
          );
          const color = FUNIL_COLORS_MAP[lead.funil_app] || FUNIL_COLORS_MAP[1];

          return (
            <div
              key={lead.cod_lead}
              className="absolute cursor-pointer transition-transform hover:scale-110"
              style={{
                left: `calc(50% + ${pos.x - mapWidth / 2}px)`,
                top: `calc(50% + ${pos.y - mapHeight / 2}px)`,
                transform: "translate(-50%, -100%)",
              }}
              onClick={() => handleMarkerClick(lead)}
            >
              <div className="relative">
                <svg
                  width="32"
                  height="40"
                  viewBox="0 0 32 40"
                  className="drop-shadow-lg"
                >
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <circle cx="16" cy="16" r="6" fill="white" />
                </svg>
              </div>
            </div>
          );
        })}

        {/* Selected place marker */}
        {selectedPlace && (
          <div
            className="absolute cursor-pointer z-10"
            style={{
              left: `calc(50% + ${
                latLngToPixel(
                  selectedPlace.lat,
                  selectedPlace.lng,
                  center.lat,
                  center.lng,
                  1,
                  mapWidth,
                  mapHeight
                ).x -
                mapWidth / 2
              }px)`,
              top: `calc(50% + ${
                latLngToPixel(
                  selectedPlace.lat,
                  selectedPlace.lng,
                  center.lat,
                  center.lng,
                  1,
                  mapWidth,
                  mapHeight
                ).y -
                mapHeight / 2
              }px)`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="relative animate-bounce">
              <svg
                width="40"
                height="50"
                viewBox="0 0 32 40"
                className="drop-shadow-xl"
              >
                <path
                  d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                  fill="hsl(var(--primary))"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle cx="16" cy="16" r="6" fill="white" />
              </svg>
            </div>
          </div>
        )}

        {/* Current location marker */}
        <div
          className="absolute z-20"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/30 w-12 h-12 -translate-x-1/2 -translate-y-1/2" />
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="drop-shadow-lg relative z-10"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="#3B82F6"
                stroke="white"
                strokeWidth="3"
              />
              <circle cx="12" cy="12" r="4" fill="white" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info window for selected lead */}
      {selectedLead && selectedLead.lat && selectedLead.lng && (
        <div
          className="absolute z-30 bg-background rounded-lg shadow-xl border p-3 min-w-[180px]"
          style={{
            left: `calc(50% + ${
              (latLngToPixel(
                selectedLead.lat,
                selectedLead.lng,
                center.lat,
                center.lng,
                1,
                mapWidth,
                mapHeight
              ).x -
                mapWidth / 2) *
              zoom
            }px + ${pan.x}px)`,
            top: `calc(50% + ${
              (latLngToPixel(
                selectedLead.lat,
                selectedLead.lng,
                center.lat,
                center.lng,
                1,
                mapWidth,
                mapHeight
              ).y -
                mapHeight / 2) *
                zoom -
              50
            }px + ${pan.y}px)`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <button
            className="absolute -top-2 -right-2 w-5 h-5 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/80"
            onClick={() => setSelectedLead(null)}
          >
            ×
          </button>
          <h4 className="font-semibold text-sm">{selectedLead.nome_fantasia}</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedLead.nome1}
          </p>
          <div
            className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${FUNIL_COLORS_MAP[selectedLead.funil_app]}20`,
              color: FUNIL_COLORS_MAP[selectedLead.funil_app],
            }}
          >
            {getFunilLabel(selectedLead.funil_app)}
          </div>
        </div>
      )}

      {/* Map controls */}
      {showControls && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg bg-background"
            onClick={handleZoomIn}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg bg-background"
            onClick={handleZoomOut}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg bg-background"
            onClick={handleCenterOnUser}
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Children (overlays like search, buttons) */}
      {children}
    </div>
  );
}
