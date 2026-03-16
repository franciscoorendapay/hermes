import { useState, useCallback, useMemo } from "react";
import { GoogleMap, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import { PlacesSearch, type PlaceResult } from "./PlacesSearch";
import { AddPlaceModal } from "./AddPlaceModal";
import { LaunchVisitSheet } from "./LaunchVisitSheet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { FUNIL_COLORS_MAP } from "@/constants/funil";
import type { Lead } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useGoogleMaps, USE_REAL_MAPS } from "@/hooks/useGoogleMaps";
import { SimulatedMap } from "@/components/map/SimulatedMap";
import { SimulatedPlacesSearch } from "@/components/map/SimulatedPlacesSearch";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
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

function createPinSvg(color: string): string {
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createCurrentLocationSvg(): string {
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

interface MapTabProps {
  leads: Lead[];
  onAddToRoute: (place: PlaceResult) => void;
  onCreateLead: (place: PlaceResult) => void;
  onLeadSaved?: () => void;
}

export function MapTab({ leads, onAddToRoute, onCreateLead, onLeadSaved }: MapTabProps) {
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [showVisitSheet, setShowVisitSheet] = useState(false);
  const [visitInitialPlace, setVisitInitialPlace] = useState<PlaceResult | null>(null);
  const [visitInitialType, setVisitInitialType] = useState<"novo-cliente" | "retorno" | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError, isSimulated } = useGoogleMaps();

  const center = useMemo(
    () => ({
      lat: latitude,
      lng: longitude,
    }),
    [latitude, longitude]
  );

  const leadsWithCoords = useMemo(
    () => leads.filter((lead) => {
      const lat = Number(lead.lat);
      const lng = Number(lead.lng);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    }),
    [leads]
  );

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    setSelectedPlace(place);
    setShowAddPlaceModal(true);

    if (map && !isSimulated) {
      map.panTo({ lat: place.lat, lng: place.lng });
      map.setZoom(17);
    }
  }, [map, isSimulated]);

  const handleCenterOnUser = useCallback(() => {
    if (map && !isSimulated) {
      map.panTo(center);
      map.setZoom(15);
    }
  }, [map, center, isSimulated]);

  const handleAddToRoute = useCallback((place: PlaceResult) => {
    // Em "Adicionar Agendamento" não queremos mais adicionar à rota,
    // e sim abrir o modal de novo agendamento (LaunchVisitSheet)
    // já com o lugar selecionado.
    setVisitInitialPlace(place);
    setVisitInitialType("novo-cliente");
    setShowVisitSheet(true);
    setShowAddPlaceModal(false);
  }, []);

  const handleNewClient = useCallback((place: PlaceResult) => {
    setVisitInitialPlace(place);
    setVisitInitialType("novo-cliente");
    setShowVisitSheet(true);
    setShowAddPlaceModal(false);
  }, []);

  const handleReturnVisit = useCallback((place: PlaceResult) => {
    setVisitInitialPlace(place);
    setVisitInitialType("retorno");
    setShowVisitSheet(true);
    setShowAddPlaceModal(false);
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full bg-muted/50 rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive font-medium">Erro ao carregar o mapa</p>
          <p className="text-xs text-muted-foreground mt-1">
            Verifique sua conexão ou a configuração da API do Google Maps
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded || geoLoading) {
    return <Skeleton className="w-full h-full rounded-lg" />;
  }

  // Render Simulated Map
  if (isSimulated) {
    return (
      <div className="relative w-full h-full">
        <SimulatedMap
          leads={leads}
          height="100%"
          showControls={true}
          selectedPlace={selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng, name: selectedPlace.name } : null}
        >
          {/* Search Bar */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <SimulatedPlacesSearch onPlaceSelect={handlePlaceSelect} leads={leads} />
          </div>

          {/* Launch Visit Button */}
          <Button
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 h-14 px-6 rounded-full shadow-lg gradient-dark text-white border-0"
            onClick={() => setShowVisitSheet(true)}
          >
            <Plus className="h-5 w-5 mr-2 text-primary" />
            Lançar Visita
          </Button>
        </SimulatedMap>

        {/* Add Place Modal */}
        <AddPlaceModal
          open={showAddPlaceModal}
          onOpenChange={setShowAddPlaceModal}
          place={selectedPlace}
          onAddToRoute={handleAddToRoute}
          onNewClient={handleNewClient}
          onReturnVisit={handleReturnVisit}
        />

        {/* Launch Visit Sheet */}
        <LaunchVisitSheet
          open={showVisitSheet}
          onOpenChange={(open) => {
            setShowVisitSheet(open);
            if (!open) {
              setVisitInitialPlace(null);
              setVisitInitialType(null);
            }
          }}
          leads={leads}
          initialPlace={visitInitialPlace}
          initialType={visitInitialType}
          onLeadSaved={onLeadSaved}
        />
      </div>
    );
  }

  // Render Real Google Map
  return (
    <div className="relative w-full h-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <PlacesSearch onPlaceSelect={handlePlaceSelect} />
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Current location marker */}
        <MarkerF
          position={center}
          icon={{
            url: createCurrentLocationSvg(),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          }}
          title="Sua localização"
        />

        {/* Lead markers */}
        {leadsWithCoords.map((lead) => (
          <MarkerF
            key={lead.id}
            position={{ lat: Number(lead.lat), lng: Number(lead.lng) }}
            icon={{
              url: createPinSvg(FUNIL_COLORS_MAP[Number(lead.funil_app)] || FUNIL_COLORS_MAP[1]),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12),
            }}
            title={lead.nome_fantasia}
            onClick={() => setSelectedLead(lead)}
          />
        ))}

        {/* Selected lead info window */}
        {selectedLead && selectedLead.lat && selectedLead.lng && (
          <InfoWindowF
            position={{ lat: Number(selectedLead.lat), lng: Number(selectedLead.lng) }}
            onCloseClick={() => setSelectedLead(null)}
          >
            <div className="p-1 min-w-[180px]">
              <h4 className="font-semibold text-sm text-gray-900">
                {selectedLead.nome_fantasia}
              </h4>
              <p className="text-xs text-gray-600 mt-1">{selectedLead.nome1}</p>
              <Button
                size="sm"
                className="w-full mt-3 h-8 text-xs"
                onClick={() => {
                  onAddToRoute({
                    name: selectedLead.nome_fantasia,
                    address: "",
                    lat: Number(selectedLead.lat!),
                    lng: Number(selectedLead.lng!),
                    placeId: selectedLead.cod_lead.toString(),
                  });
                  setSelectedLead(null);
                  toast.success(`${selectedLead.nome_fantasia} adicionado à rota`);
                }}
              >
                Adicionar à Rota
              </Button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Launch Visit Button */}
      <Button
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 h-14 px-6 rounded-full shadow-lg gradient-dark text-white border-0"
        onClick={() => setShowVisitSheet(true)}
      >
        <Plus className="h-5 w-5 mr-2 text-primary" />
        Lançar Visita
      </Button>

      {/* Add Place Modal */}
      <AddPlaceModal
        open={showAddPlaceModal}
        onOpenChange={setShowAddPlaceModal}
        place={selectedPlace}
        onAddToRoute={handleAddToRoute}
        onNewClient={handleNewClient}
        onReturnVisit={handleReturnVisit}
      />

      {/* Launch Visit Sheet */}
      <LaunchVisitSheet
        open={showVisitSheet}
        onOpenChange={(open) => {
          setShowVisitSheet(open);
          if (!open) {
            setVisitInitialPlace(null);
            setVisitInitialType(null);
          }
        }}
        leads={leads}
        initialPlace={visitInitialPlace}
        initialType={visitInitialType}
        onLeadSaved={onLeadSaved}
      />
    </div>
  );
}
