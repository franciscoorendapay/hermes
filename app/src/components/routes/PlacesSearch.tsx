import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  phone?: string;
  types?: string[];
  addressComponents?: {
    streetNumber?: string;
    route?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

interface PlacesSearchProps {
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
}

export function PlacesSearch({ onPlaceSelect, placeholder = "Buscar estabelecimento..." }: PlacesSearchProps) {
  const [searchValue, setSearchValue] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Create a static session token per mount or refresh
  const [sessionToken] = useState(() => Math.random().toString(36).substring(2));

  const extractAddressComponents = useCallback((components: any[] | undefined) => {
    if (!components) return undefined;

   
    const getComponent = (types: string[]) =>
      components.find(
        (c) => Array.isArray(c.types) && types.some((t: string) => c.types.includes(t))
      )?.longText;

    const getShortComponent = (types: string[]) =>
      components.find(c => types.some((t: string) => c.types.includes(t)))?.shortText;

    return {
      streetNumber: getComponent(["street_number"]),
      route: getComponent(["route"]),
      neighborhood: getComponent(["sublocality_level_1", "sublocality", "neighborhood"]),
      city: getComponent(["administrative_area_level_2", "locality"]),
      state: getShortComponent(["administrative_area_level_1"]),
      postalCode: getComponent(["postal_code"]),
    };
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);

    if (!val || val.length < 3) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/places/autocomplete?input=${encodeURIComponent(val)}&sessionToken=${sessionToken}`);
      if (response.ok) {
        const results = await response.json();
        if (Array.isArray(results)) {
          setPredictions(results);
          setIsOpen(results.length > 0);
        } else {
          console.error("Autocomplete retornou formato inesperado:", results);
          toast.error("Serviço de busca indisponível no momento.");
        }
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("Autocomplete erro HTTP", response.status, err);
        toast.error(`Busca indisponível (${response.status}). Verifique a chave da API Google.`);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
      toast.error("Não foi possível conectar ao serviço de busca.");
    }
  };

  const handleSelectPrediction = async (prediction: any) => {
    setSearchValue(prediction.main_text);
    setIsOpen(false);
    setPredictions([]);

    try {
      // Prediction place_id from v1 is "places/ChIJ..." usually, but check
      const placeId = prediction.place_id;
      // Use the same base URL pattern as autocomplete to avoid double /api
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/places/details?placeId=${placeId}&sessionToken=${sessionToken}`
      );

      if (!response.ok) {
        toast.error("Não foi possível carregar os detalhes do estabelecimento. Tente novamente.");
        console.error("Erro ao buscar detalhes do lugar:", response.status, response.statusText);
        return;
      }

      const place = await response.json();

      // Normaliza para funcionar tanto com Places API v1 quanto com respostas anteriores
      const lat =
        place.location?.latitude ??
        place.geometry?.location?.lat ??
        0;

      const lng =
        place.location?.longitude ??
        place.geometry?.location?.lng ??
        0;

      const placeResult: PlaceResult = {
        name: place.displayName?.text || place.name || "",
        address: place.formattedAddress || "",
        lat,
        lng,
        placeId: place.id || place.name || placeId,
        phone: place.nationalPhoneNumber,
        types: place.types,
        addressComponents: extractAddressComponents(place.addressComponents),
      };

      console.log("Place selecionado para zoom:", placeResult);
      onPlaceSelect(placeResult);
    } catch (error) {
      console.error("Error details:", error);
      toast.error("Erro ao carregar detalhes do estabelecimento.");
    }
  };

  const clearSearch = useCallback(() => {
    setSearchValue("");
    setPredictions([]);
    setIsOpen(false);
  }, []);

  return (
    <div className="relative w-full z-50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          className="pl-10 pr-10 h-12 bg-background/95 backdrop-blur-sm shadow-lg border-muted"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
          {predictions.map((p) => (
            <div
              key={p.place_id}
              className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
              onClick={() => handleSelectPrediction(p)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">{p.main_text}</div>
                <div className="text-xs text-muted-foreground">{p.secondary_text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
