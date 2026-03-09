import { useMemo, useCallback, useState } from "react";
import { GoogleMap, MarkerF, InfoWindowF, MarkerClustererF } from "@react-google-maps/api";
import { useGeolocation } from "@/hooks/useGeolocation";
import { FUNIL_COLORS_MAP, FUNIL_LABELS_MAP } from "@/constants/funil";
import type { Lead } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { useGoogleMaps, USE_REAL_MAPS } from "@/hooks/useGoogleMaps";
import { SimulatedMap } from "@/components/map/SimulatedMap";

const getSafeCoord = (val: string | number | null | undefined): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : Number(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
};

interface LeadsMapProps {
  leads: Lead[];
  height?: string;
  showControls?: boolean;
  focusedLeadId?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem",
};

const defaultOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const optionsWithControls: google.maps.MapOptions = {
  ...defaultOptions,
  zoomControl: true,
  fullscreenControl: true,
};

// Cria SVG do pin com cor dinâmica
function createPinSvg(color: string): string {
  const svg = `
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Cria SVG do marcador de localização atual
function createCurrentLocationSvg(): string {
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function LeadsMap({ leads, height = "160px", showControls = false, focusedLeadId }: LeadsMapProps) {
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { isLoaded, loadError, isSimulated } = useGoogleMaps();

  const leadsWithCoords = useMemo(
    () => leads.filter((lead) => getSafeCoord(lead.lat) !== null && getSafeCoord(lead.lng) !== null),
    [leads]
  );

  // Effect to select and focus lead when focusedLeadId changes
  useMemo(() => {
    if (focusedLeadId) {
      const lead = leadsWithCoords.find(l => l.id === focusedLeadId || String(l.id) === String(focusedLeadId));
      if (lead) {
        setSelectedLead(lead);
      }
    }
  }, [focusedLeadId, leadsWithCoords]);

  const center = useMemo(() => {
    // If there is a focused lead, center on it
    if (focusedLeadId) {
      const lead = leadsWithCoords.find(l => l.id === focusedLeadId || String(l.id) === String(focusedLeadId));
      if (lead) {
        const lat = getSafeCoord(lead.lat);
        const lng = getSafeCoord(lead.lng);
        if (lat !== null && lng !== null) {
          return { lat, lng };
        }
      }
    }

    // Default to user location
    return {
      lat: latitude,
      lng: longitude,
    };
  }, [latitude, longitude, focusedLeadId, leadsWithCoords]);

  const getFunilLabel = useCallback((funilId: number) => {
    return FUNIL_LABELS_MAP[funilId] || "Desconhecido";
  }, []);

  const onMarkerClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
  }, []);

  const onInfoWindowClose = useCallback(() => {
    setSelectedLead(null);
  }, []);

  if (loadError) {
    return (
      <div
        className="w-full bg-muted/50 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-4">
          <MapPin className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive font-medium">Erro ao carregar o mapa</p>
          <p className="text-xs text-muted-foreground mt-1">
            Verifique sua conexão ou a configuração da API
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded || geoLoading) {
    return <Skeleton className="w-full rounded-lg" style={{ height }} />;
  }

  // Render Simulated Map when not using real Google Maps
  if (isSimulated) {
    return (
      <SimulatedMap
        leads={leads}
        height={height}
        showControls={showControls}
        onMarkerClick={onMarkerClick}
      />
    );
  }

  // Render Real Google Map
  return (
    <div style={{ height }} className="w-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={showControls ? optionsWithControls : defaultOptions}
      >
        {/* Marcador da localização atual */}
        <MarkerF
          position={center}
          icon={{
            url: createCurrentLocationSvg(),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          }}
          title="Sua localização"
        />

        {/* Marcadores dos leads com Clustering */}
        <MarkerClustererF>
          {(clusterer) => (
            <>
              {leadsWithCoords.map((lead) => (
                <MarkerF
                  key={lead.id}
                  position={{ lat: getSafeCoord(lead.lat) as number, lng: getSafeCoord(lead.lng) as number }}
                  icon={{
                    url: createPinSvg(FUNIL_COLORS_MAP[Number(lead.funil_app)] || FUNIL_COLORS_MAP[1]),
                    scaledSize: new google.maps.Size(32, 40),
                    anchor: new google.maps.Point(16, 40),
                  }}
                  title={lead.nome_fantasia}
                  onClick={() => onMarkerClick(lead)}
                  clusterer={clusterer}
                />
              ))}
            </>
          )}
        </MarkerClustererF>

        {/* InfoWindow do lead selecionado */}
        {selectedLead && selectedLead.lat && selectedLead.lng && (
          <InfoWindowF
            position={{ lat: getSafeCoord(selectedLead.lat) as number, lng: getSafeCoord(selectedLead.lng) as number }}
            onCloseClick={onInfoWindowClose}
          >
            <div className="p-1 min-w-[150px]">
              <h4 className="font-semibold text-sm text-gray-900">
                {selectedLead.nome_fantasia}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {selectedLead.nome1}
              </p>
              <div
                className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${FUNIL_COLORS_MAP[Number(selectedLead.funil_app)] || FUNIL_COLORS_MAP[1]}20`,
                  color: FUNIL_COLORS_MAP[Number(selectedLead.funil_app)] || FUNIL_COLORS_MAP[1],
                }}
              >
                {getFunilLabel(selectedLead.funil_app)}
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
