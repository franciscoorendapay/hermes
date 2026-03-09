import { useState, useCallback, useRef, useEffect, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlaceResult } from "@/components/routes/PlacesSearch";
import type { Lead } from "@/hooks/useLeads";

interface SimulatedPlacesSearchProps {
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  leads: Lead[];
}

export const SimulatedPlacesSearch = forwardRef<HTMLDivElement, SimulatedPlacesSearchProps>(
  ({ onPlaceSelect, placeholder = "Buscar estabelecimento...", leads }, ref) => {
    const [searchValue, setSearchValue] = useState("");
    const [results, setResults] = useState<Lead[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSearch = useCallback((value: string) => {
      setSearchValue(value);
      if (value.length >= 2) {
        const normalizedQuery = value.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        
        const found = leads.filter((lead) => {
          const normalizedName = lead.nome_fantasia.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          
          return normalizedName.includes(normalizedQuery);
        }).slice(0, 5);
        
        setResults(found);
        setIsOpen(found.length > 0);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, [leads]);

    const handleSelect = useCallback(
      (lead: Lead) => {
        const address = [
          lead.endereco_logradouro,
          lead.endereco_numero ? `, ${lead.endereco_numero}` : "",
          lead.endereco_bairro ? ` - ${lead.endereco_bairro}` : "",
          lead.endereco_cidade ? `, ${lead.endereco_cidade}` : "",
          lead.endereco_estado ? `/${lead.endereco_estado}` : "",
        ].filter(Boolean).join("");

        const placeResult: PlaceResult = {
          name: lead.nome_fantasia,
          address: address || "Endereço não informado",
          lat: lead.lat || 0,
          lng: lead.lng || 0,
          placeId: lead.id,
          phone: lead.telefone || undefined,
          types: [lead.segmento || "business"],
          addressComponents: {
            route: lead.endereco_logradouro || undefined,
            streetNumber: lead.endereco_numero || undefined,
            neighborhood: lead.endereco_bairro || undefined,
            city: lead.endereco_cidade || undefined,
            state: lead.endereco_estado || undefined,
            postalCode: lead.endereco_cep || undefined,
          },
        };

        onPlaceSelect(placeResult);
        setSearchValue(lead.nome_fantasia);
        setIsOpen(false);
      },
      [onPlaceSelect]
    );

    const clearSearch = useCallback(() => {
      setSearchValue("");
      setResults([]);
      setIsOpen(false);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div ref={containerRef} className="relative w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
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

        {/* Dropdown results */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background rounded-lg shadow-xl border z-50 overflow-hidden">
            {results.map((lead) => {
              const address = [
                lead.endereco_logradouro,
                lead.endereco_numero ? `, ${lead.endereco_numero}` : "",
                lead.endereco_bairro ? ` - ${lead.endereco_bairro}` : "",
                lead.endereco_cidade ? `, ${lead.endereco_cidade}` : "",
              ].filter(Boolean).join("");
              
              return (
                <button
                  key={lead.id}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
                  onClick={() => handleSelect(lead)}
                >
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lead.nome_fantasia}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {address || "Endereço não informado"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* No results message */}
        {isOpen && searchValue.length >= 2 && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background rounded-lg shadow-xl border z-50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum estabelecimento encontrado
            </p>
          </div>
        )}
      </div>
    );
  }
);

SimulatedPlacesSearch.displayName = "SimulatedPlacesSearch";