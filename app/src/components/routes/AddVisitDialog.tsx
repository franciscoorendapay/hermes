import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, MapPin } from "lucide-react";
import { Lead } from "@/hooks/useLeads";
import { SimulatedPlacesSearch } from "@/components/map/SimulatedPlacesSearch";
import type { PlaceResult } from "@/components/routes/PlacesSearch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EstabelecimentoData } from "@/hooks/useReminders";

interface AddVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  leadsLoading: boolean;
  selectedDate: Date;
  onSave: (estabelecimentoData: EstabelecimentoData, date: string, time: string, description?: string) => Promise<{ success: boolean }>;
  onSaveWithLead: (leadId: string, date: string, time: string, description?: string) => Promise<{ success: boolean }>;
  initialPlace?: PlaceResult | null;
}

const timeSlots = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00",
];

interface EnderecoData {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export function AddVisitDialog({
  open,
  onOpenChange,
  leads,
  selectedDate,
  onSave,
  onSaveWithLead,
  initialPlace = null,
}: AddVisitDialogProps) {
  const [date, setDate] = useState<Date>(selectedDate);
  const [time, setTime] = useState("09:00");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0);
  
  const DEBOUNCE_MS = 3000; // 3 segundos entre saves

  // Search state
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(initialPlace);

  // Manual registration state (when search doesn't find)
  const [manualName, setManualName] = useState("");
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [enderecoData, setEnderecoData] = useState<EnderecoData | null>(null);

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedPlace(initialPlace);
      setManualName("");
      setCep("");
      setNumero("");
      setEnderecoData(null);
      setCepError(null);
      setDate(selectedDate);
      setTime("09:00");
      setDescription("");
    }
    onOpenChange(newOpen);
  };

  // Check if place already exists as lead
  const matchingLead = useMemo(() => {
    if (!selectedPlace) return null;
    
    // Verificar se o placeId corresponde a um lead (quando selecionado via SimulatedPlacesSearch)
    if (selectedPlace.placeId) {
      const leadById = leads.find((lead) => lead.id === selectedPlace.placeId);
      if (leadById) return leadById;
    }
    
    // Fallback: comparar apenas por nome (case-insensitive e normalizado)
    const normalizedPlaceName = selectedPlace.name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
      
    return leads.find((lead) => {
      const normalizedLeadName = lead.nome_fantasia.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return normalizedLeadName === normalizedPlaceName;
    });
  }, [selectedPlace, leads]);

  const handlePlaceSelect = (place: PlaceResult) => {
    setSelectedPlace(place);
    // Clear manual form when selecting from search
    setManualName("");
    setCep("");
    setNumero("");
    setEnderecoData(null);
    setCepError(null);
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  };

  const buscarCep = async (cepValue: string) => {
    const cepLimpo = cepValue.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado");
        setEnderecoData(null);
        return;
      }

      setEnderecoData({
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        uf: data.uf || "",
      });

      toast.success("Endereço encontrado!");
    } catch (error) {
      setCepError("Erro ao buscar CEP");
      setEnderecoData(null);
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    setCepError(null);
    setEnderecoData(null);

    const cepLimpo = value.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      buscarCep(cepLimpo);
    }
  };

  const handleManualNameChange = (value: string) => {
    setManualName(value);
    // Clear search selection when typing manual name
    if (value.trim()) {
      setSelectedPlace(null);
    }
  };

  const handleSave = async () => {
    // Debounce anti-double-click
    const now = Date.now();
    if (now - lastSaveTime < DEBOUNCE_MS) {
      toast.warning("Aguarde antes de agendar novamente");
      return;
    }
    setLastSaveTime(now);
    
    setSaving(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");

      // Se selecionou um lead existente, usar onSaveWithLead
      if (selectedPlace && matchingLead) {
        const result = await onSaveWithLead(
          matchingLead.id,
          dateStr,
          time,
          description || undefined
        );
        if (result.success) {
          handleOpenChange(false);
        } else if ((result as any).error === "duplicate") {
          toast.warning((result as any).message || "Visita já agendada para esta data");
        }
        return;
      }

      // Caso contrário, criar novo estabelecimento
      let estabelecimentoData: EstabelecimentoData;

      if (selectedPlace) {
        // Usando resultado da busca (novo estabelecimento)
        const ac = selectedPlace.addressComponents;
        estabelecimentoData = {
          nome: selectedPlace.name,
          endereco: selectedPlace.address,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          bairro: ac?.neighborhood,
          cidade: ac?.city,
          estado: ac?.state,
          cep: ac?.postalCode,
          numero: ac?.streetNumber,
        };
      } else if (manualName.trim() && enderecoData) {
        // Usando cadastro manual com CEP
        estabelecimentoData = {
          nome: manualName.trim(),
          endereco: `${enderecoData.logradouro}, ${numero || "s/n"} - ${enderecoData.bairro}`,
          cep: cep.replace(/\D/g, ""),
          numero: numero,
          bairro: enderecoData.bairro,
          cidade: enderecoData.cidade,
          estado: enderecoData.uf,
        };
      } else {
        toast.error("Selecione ou cadastre um estabelecimento");
        setSaving(false);
        return;
      }

      const result = await onSave(estabelecimentoData, dateStr, time, description || undefined);
      if (result.success) {
        handleOpenChange(false);
      } else if ((result as any).error === "duplicate") {
        toast.warning((result as any).message || "Visita já agendada para este horário");
      }
    } finally {
      setSaving(false);
    }
  };

  const canSave = () => {
    // Option 1: Place selected from search
    if (selectedPlace) return true;

    // Option 2: Manual registration complete (name + valid CEP + address found)
    if (manualName.trim() && enderecoData && cep.replace(/\D/g, "").length === 8) {
      return true;
    }

    return false;
  };

  const isManualFormActive = !selectedPlace && (manualName.trim() || cep);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Visita</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Section */}
          <div className="space-y-2">
            <Label>Buscar estabelecimento cadastrado</Label>
            <SimulatedPlacesSearch
              onPlaceSelect={handlePlaceSelect}
              placeholder="Digite o nome do estabelecimento..."
              leads={leads}
            />
          </div>

          {/* Search Result */}
          {selectedPlace && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="font-medium text-sm">{selectedPlace.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedPlace.address}
              </p>
              {matchingLead && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Cliente já cadastrado (#{matchingLead.cod_lead})
                </p>
              )}
            </div>
          )}

          {/* Manual Registration Section - only show when no place selected */}
          {!selectedPlace && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Não encontrou? Cadastre manualmente:
                </span>
              </div>

              <div className="space-y-3">
                {/* Establishment Name */}
                <Input
                  placeholder="Nome do estabelecimento"
                  value={manualName}
                  onChange={(e) => handleManualNameChange(e.target.value)}
                />

                {/* CEP + Number */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        placeholder="CEP (00000-000)"
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        maxLength={9}
                        disabled={!!selectedPlace}
                      />
                      {buscandoCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {cepError && (
                      <p className="text-xs text-destructive mt-1">{cepError}</p>
                    )}
                  </div>

                  {/* Number */}
                  <Input
                    placeholder="Nº"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-20"
                    disabled={!!selectedPlace}
                  />
                </div>

                {/* Found Address Display */}
                {enderecoData && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                    <span>
                      {enderecoData.logradouro}, {numero || "s/n"} - {enderecoData.bairro}, {enderecoData.cidade}/{enderecoData.uf}
                    </span>
                  </div>
                )}

                {isManualFormActive && !enderecoData && !buscandoCep && cep.replace(/\D/g, "").length < 8 && (
                  <p className="text-xs text-muted-foreground">
                    Digite o CEP completo para buscar o endereço automaticamente.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) setDate(d);
                    setDatePickerOpen(false);
                  }}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Horário *</Label>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-[120px] overflow-y-auto p-1">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  size="sm"
                  variant={time === slot ? "default" : "outline"}
                  className="h-8 text-xs"
                  onClick={() => setTime(slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              placeholder="Ex: Apresentar proposta de credenciamento"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave() || saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}