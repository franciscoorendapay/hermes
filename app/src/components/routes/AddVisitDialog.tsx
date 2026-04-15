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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, MapPin } from "lucide-react";
import { Lead } from "@/hooks/useLeads";
import { SimulatedPlacesSearch } from "@/components/map/SimulatedPlacesSearch";
import { PlacesSearch, type PlaceResult } from "@/components/routes/PlacesSearch";
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

interface FormBodyProps {
  leads: Lead[];
  selectedDate: Date;
  initialPlace: PlaceResult | null;
  onSave: AddVisitDialogProps["onSave"];
  onSaveWithLead: AddVisitDialogProps["onSaveWithLead"];
  onClose: () => void;
}

// Componente interno com todo o estado do formulário.
// Renderizado condicionalmente com {open && <AddVisitFormBody />},
// garantindo que cada abertura do dialog começa com estado limpo.
function AddVisitFormBody({
  leads,
  selectedDate,
  initialPlace,
  onSave,
  onSaveWithLead,
  onClose,
}: FormBodyProps) {
  const [date, setDate] = useState<Date>(selectedDate);
  const [time, setTime] = useState("09:00");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0);

  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(initialPlace);

  const [manualName, setManualName] = useState("");
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [enderecoData, setEnderecoData] = useState<EnderecoData | null>(null);

  const DEBOUNCE_MS = 3000;

  const matchingLead = useMemo(() => {
    if (!selectedPlace) return null;
    if (selectedPlace.placeId) {
      const leadById = leads.find((lead) => lead.id === selectedPlace.placeId);
      if (leadById) return leadById;
    }
    const normalizedPlaceName = selectedPlace.name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return leads.find((lead) => {
      const nomeF = lead.nome_fantasia || lead.razao_social || "";
      if (!nomeF) return false;
      return nomeF.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedPlaceName;
    });
  }, [selectedPlace, leads]);

  const handlePlaceSelect = (place: PlaceResult) => {
    setSelectedPlace(place);
    setManualName("");
    setCep("");
    setNumero("");
    setEnderecoData(null);
    setCepError(null);
  };

  const handleCepChange = async (value: string) => {
    const formatted = value.replace(/\D/g, "").slice(0, 8);
    setCep(value.length <= 5 ? formatted : `${formatted.slice(0, 5)}-${formatted.slice(5)}`);

    if (formatted.length === 8) {
      setBuscandoCep(true);
      setCepError(null);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${formatted}/json/`);
        const data = await response.json();
        if (data.erro) {
          setCepError("CEP não encontrado");
          setEnderecoData(null);
        } else {
          setEnderecoData({
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            uf: data.uf || "",
          });
          toast.success("Endereço encontrado!");
        }
      } catch {
        setCepError("Erro ao buscar CEP");
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleSave = async () => {
    const now = Date.now();
    if (now - lastSaveTime < DEBOUNCE_MS) {
      toast.warning("Aguarde antes de agendar novamente");
      return;
    }
    setLastSaveTime(now);
    setSaving(true);

    try {
      const dateStr = format(date, "yyyy-MM-dd");

      if (selectedPlace && matchingLead) {
        const result = await onSaveWithLead(matchingLead.id, dateStr, time, description || undefined);
        if (result.success) onClose();
        return;
      }

      let estabelecimentoData: EstabelecimentoData;
      if (selectedPlace) {
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
      } else if (manualName.trim()) {
        estabelecimentoData = {
          nome: manualName.trim(),
          endereco: enderecoData
            ? `${enderecoData.logradouro}, ${numero || "s/n"} - ${enderecoData.bairro}`
            : (numero ? `Nº ${numero}` : "Endereço não informado"),
          cep: cep.replace(/\D/g, "") || undefined,
          numero: numero || undefined,
          bairro: enderecoData?.bairro || undefined,
          cidade: enderecoData?.cidade || undefined,
          estado: enderecoData?.uf || undefined,
        };
      } else {
        toast.error("Selecione ou cadastre um estabelecimento");
        return;
      }

      const result = await onSave(estabelecimentoData, dateStr, time, description || undefined);
      if (result.success) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4 py-4">
        <Tabs defaultValue="cadastrados" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="cadastrados">Meus Leads</TabsTrigger>
            <TabsTrigger value="google">Buscar no Google</TabsTrigger>
          </TabsList>

          <TabsContent value="cadastrados" className="space-y-2 mt-4">
            <Label>Buscar estabelecimento cadastrado</Label>
            <SimulatedPlacesSearch
              onPlaceSelect={handlePlaceSelect}
              placeholder="Digite o nome do estabelecimento..."
              leads={leads}
            />
          </TabsContent>

          <TabsContent value="google" className="space-y-2 mt-4">
            <Label>Buscar novo estabelecimento</Label>
            <PlacesSearch
              onPlaceSelect={handlePlaceSelect}
              placeholder="Busque no Google Places..."
            />
          </TabsContent>
        </Tabs>

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

        {!selectedPlace && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Manual:</span>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Nome do estabelecimento"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="CEP (opcional)"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    maxLength={9}
                  />
                  {buscandoCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Input
                  placeholder="Nº"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-20"
                />
              </div>
              {cepError && <p className="text-xs text-destructive">{cepError}</p>}
              {enderecoData && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                  <span>{enderecoData.logradouro}, {numero || "s/n"} - {enderecoData.bairro}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Data *</Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { if (d) setDate(d); setDatePickerOpen(false); }}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Horário *</Label>
          <div className="grid grid-cols-5 gap-1.5 max-h-[120px] overflow-y-auto p-1">
            {timeSlots.map((slot) => (
              <Button
                key={slot}
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

        <div className="space-y-2">
          <Label>Descrição (opcional)</Label>
          <Textarea
            placeholder="Ex: Apresentar proposta"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} disabled={(!selectedPlace && !manualName.trim()) || saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Agendar
        </Button>
      </DialogFooter>
    </>
  );
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Visita</DialogTitle>
        </DialogHeader>

        {open && (
          <AddVisitFormBody
            leads={leads}
            selectedDate={selectedDate}
            initialPlace={initialPlace}
            onSave={onSave}
            onSaveWithLead={onSaveWithLead}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
