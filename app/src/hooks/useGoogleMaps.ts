import { useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// Feature flag: set to true to use real Google Maps API
// When false, the app uses simulated maps that work without API
export const USE_REAL_MAPS = true;

// Log warning if API key is missing when using real maps
if (USE_REAL_MAPS && !GOOGLE_MAPS_API_KEY) {
  console.warn(
    "⚠️ VITE_GOOGLE_MAPS_API_KEY não configurada. O mapa pode não carregar corretamente."
  );
}

// Libraries must be defined outside component to prevent re-creation
const libraries: ("marker")[] = ["marker"];

interface GoogleMapsResult {
  isLoaded: boolean;
  loadError: Error | undefined;
  isSimulated: boolean;
}

export function useGoogleMaps(): GoogleMapsResult {
  // If using simulated maps, return immediately as "loaded"
  if (!USE_REAL_MAPS) {
    return {
      isLoaded: true,
      loadError: undefined,
      isSimulated: true,
    };
  }

  // Load real Google Maps API
  const result = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  return {
    ...result,
    isSimulated: false,
  };
}
