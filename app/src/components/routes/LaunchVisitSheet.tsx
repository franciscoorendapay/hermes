import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  RotateCcw,
  Building2,
  Phone,
  User,
  AlertTriangle,
  FileText,
  TrendingUp,
  Briefcase,
  List,
  LayoutGrid,
  FileDown,
  Edit2,
  Loader2,
  Mail,
  Heart,
  Package,
  RefreshCw,
  Headphones,
  Eye
} from "lucide-react";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import type { Lead } from "@/hooks/useLeads";
import { toast } from "sonner";
import { FUNIL } from "@/constants/funil";
import { PlacesSearch, type PlaceResult } from "@/components/routes/PlacesSearch";
import { formatPhone, formatCpfCnpjInput, formatMoneyInput, parseMoneyInput } from "@/lib/formatters";
import { validateCpfCnpj, validatePhone } from "@/lib/validators";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { MCC_ABECS } from "@/constants/mccAbecs";
import { useIsMobile } from "@/hooks/use-mobile";
import { CredenciamentoForm } from "@/components/routes/CredenciamentoForm";
import { ReminderConfirmationDialog } from "@/components/routes/ReminderConfirmationDialog";
import { ReminderForm } from "@/components/routes/ReminderForm";
import { useAuth } from "@/hooks/useAuth";
import { useReminders } from "@/hooks/useReminders";
import { leadsService } from "@/features/leads/leads.service";
import { api } from "@/shared/api/http";
import { visitsService } from "@/features/visits/visits.service";
import { adaptAppToLeadApi, adaptLeadApiToApp } from "@/features/leads/leads.adapter";
import { PercentageInput } from "@/components/ui/percentage-input";
import { MoneyInput } from "@/components/ui/money-input";

type VisitStep = "select-type" | "prospeccao" | "qualificacao" | "negociacao" | "precificacao" | "credenciamento" | "return-visit";
type VisitType = "novo-cliente" | "retorno";
type Intensidade = "nao-tem" | "pouco" | "medio" | "principal";
type IntensidadeNegociacao = "pouco" | "medio" | "principal";

const INTENSIDADE_NEGOCIACAO_LABELS: Record<IntensidadeNegociacao, string> = {
  "pouco": "Pouco",
  "medio": "Médio",
  "principal": "Principal"
};

const INTENSIDADE_LABELS: Record<Intensidade, string> = {
  "nao-tem": "Não tem",
  "pouco": "Pouco",
  "medio": "Médio",
  "principal": "Principal"
};

const INTENSIDADE_PESOS: Record<Intensidade, number> = {
  "nao-tem": 0,
  "pouco": 1,
  "medio": 2,
  "principal": 3
};

const ESTADOS_NOME_PARA_UF: Record<string, string> = {
  "acre": "AC",
  "alagoas": "AL",
  "amapá": "AP",
  "amapa": "AP",
  "amazonas": "AM",
  "bahia": "BA",
  "ceará": "CE",
  "ceara": "CE",
  "distrito federal": "DF",
  "espírito santo": "ES",
  "espirito santo": "ES",
  "goiás": "GO",
  "goias": "GO",
  "maranhão": "MA",
  "maranhao": "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  "pará": "PA",
  "para": "PA",
  "paraíba": "PB",
  "paraiba": "PB",
  "paraná": "PR",
  "parana": "PR",
  "pernambuco": "PE",
  "piauí": "PI",
  "piaui": "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  "rondônia": "RO",
  "rondonia": "RO",
  "roraima": "RR",
  "santa catarina": "SC",
  "são paulo": "SP",
  "sao paulo": "SP",
  "sergipe": "SE",
  "tocantins": "TO"
};

const getEstadoUF = (stateName: string): string => {
  if (!stateName) return "";
  if (stateName.length === 2) return stateName.toUpperCase();
  return ESTADOS_NOME_PARA_UF[stateName.toLowerCase().trim()] || "";
};

const getIntensidadeFromShare = (share: number | null | undefined): IntensidadeNegociacao => {
  if (!share || share === 0) return "pouco";
  if (share <= 30) return "pouco"; // Covers 20
  if (share <= 70) return "medio"; // Covers 50
  return "principal"; // Covers 100
};

const INTENSIDADE_COLORS: Record<Intensidade, { bg: string; text: string; border: string }> = {
  "nao-tem": {
    bg: "bg-background",
    text: "text-foreground",
    border: "border-border"
  },
  "pouco": {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300"
  },
  "medio": {
    bg: "bg-orange-300",
    text: "text-orange-900",
    border: "border-orange-400"
  },
  "principal": {
    bg: "bg-orange-500",
    text: "text-white",
    border: "border-orange-600"
  }
};

// Tipos de visita para clientes já credenciados
const TIPOS_VISITA_CLIENTE = [
  { value: "relacionamento", label: "Relacionamento", icon: Heart, color: "text-pink-500", bgColor: "bg-pink-50 border-pink-200" },
  { value: "novos-produtos", label: "Novos Produtos", icon: Package, color: "text-blue-500", bgColor: "bg-blue-50 border-blue-200" },
  { value: "renegociacao", label: "Renegociação", icon: RefreshCw, color: "text-orange-500", bgColor: "bg-orange-50 border-orange-200" },
  { value: "suporte", label: "Suporte", icon: Headphones, color: "text-purple-500", bgColor: "bg-purple-50 border-purple-200" },
];

interface LaunchVisitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  selectedLead?: Lead | null;
  directAction?: string | null; // "qualificar" | "negociar" | "precificar" | "credenciar"
  initialPlace?: PlaceResult | null;
  initialType?: "novo-cliente" | "retorno" | null;
  onLeadSaved?: () => void;
  reminderId?: string; // ID do lembrete a ser atualizado após criar o lead
  onLeadSavedWithId?: (leadId: string) => void; // Callback com o ID do lead criado
}

export function LaunchVisitSheet({
  open,
  onOpenChange,
  leads,
  selectedLead,
  directAction,
  initialPlace,
  initialType,
  onLeadSaved,
  reminderId,
  onLeadSavedWithId,
}: LaunchVisitSheetProps) {
  const geolocation = useGeolocation();
  const auth = useAuth();
  const { createReminderForLead } = useReminders(!!auth.user);

  const [step, setStep] = useState<VisitStep>("select-type");
  const [visitType, setVisitType] = useState<VisitType | null>(null);

  // Prospecção Form State
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [nomeFantasia, setNomeFantasia] = useState("");

  // Endereço estruturado
  const [cep, setCep] = useState("");
  const [enderecoRua, setEnderecoRua] = useState("");
  const [enderecoNumero, setEnderecoNumero] = useState("");
  const [enderecoComplemento, setEnderecoComplemento] = useState("");
  const [enderecoBairro, setEnderecoBairro] = useState("");
  const [enderecoCidade, setEnderecoCidade] = useState("");
  const [enderecoEstado, setEnderecoEstado] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [enderecoOrigem, setEnderecoOrigem] = useState<"busca" | "gps" | "manual" | "cep">("manual");
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const [falouComTD, setFalouComTD] = useState<"sim" | "nao" | null>(null);
  const [contatoNome, setContatoNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dateVisit] = useState(new Date().toISOString().split("T")[0]);
  const [timeVisit] = useState(new Date().toTimeString().slice(0, 5));

  // Qualificação Form State
  const [razaoSocial, setRazaoSocial] = useState("");
  const [emailResponsavel, setEmailResponsavel] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cpfCnpjError, setCpfCnpjError] = useState<string | null>(null);
  const [tpvEsperado, setTpvEsperado] = useState("");
  const [ramoAtividade, setRamoAtividade] = useState("");
  const [informarRamoDepois, setInformarRamoDepois] = useState(false);
  const [segmento, setSegmento] = useState<"fisico" | "digital" | "hibrido" | "">("");

  // Negociação Form State
  const [prazoRecebimento, setPrazoRecebimento] = useState<"D0" | "D+1" | "D+30" | "Fluxo" | "">("");
  const [qtdEquipamentos, setQtdEquipamentos] = useState("");
  const [volumeDebitoPix, setVolumeDebitoPix] = useState<IntensidadeNegociacao>("pouco");
  const [volumeCreditoVista, setVolumeCreditoVista] = useState<IntensidadeNegociacao>("pouco");
  const [volumeParcelado2a6, setVolumeParcelado2a6] = useState<IntensidadeNegociacao>("pouco");
  const [volumeParcelado7a12, setVolumeParcelado7a12] = useState<IntensidadeNegociacao>("pouco");

  // Precificação Form State
  const [modoVisualizacao, setModoVisualizacao] = useState<"accordion" | "tabela">("tabela");

  // Taxas Gerais (não vinculadas a bandeiras)
  const [taxaAntecipacao, setTaxaAntecipacao] = useState("");
  const [taxaPix, setTaxaPix] = useState("");

  // Visa (5 taxas)
  const [taxaVisaDebito, setTaxaVisaDebito] = useState("");
  const [taxaVisaCreditoVista, setTaxaVisaCreditoVista] = useState("");
  const [taxaVisaParcelado2a6, setTaxaVisaParcelado2a6] = useState("");
  const [taxaVisaParcelado7a12, setTaxaVisaParcelado7a12] = useState("");
  const [taxaVisaParcelado13a18, setTaxaVisaParcelado13a18] = useState("");

  // Mastercard (5 taxas)
  const [taxaMasterDebito, setTaxaMasterDebito] = useState("");
  const [taxaMasterCreditoVista, setTaxaMasterCreditoVista] = useState("");
  const [taxaMasterParcelado2a6, setTaxaMasterParcelado2a6] = useState("");
  const [taxaMasterParcelado7a12, setTaxaMasterParcelado7a12] = useState("");
  const [taxaMasterParcelado13a18, setTaxaMasterParcelado13a18] = useState("");

  // Elo (5 taxas)
  const [taxaEloDebito, setTaxaEloDebito] = useState("");
  const [taxaEloCreditoVista, setTaxaEloCreditoVista] = useState("");
  const [taxaEloParcelado2a6, setTaxaEloParcelado2a6] = useState("");
  const [taxaEloParcelado7a12, setTaxaEloParcelado7a12] = useState("");
  const [taxaEloParcelado13a18, setTaxaEloParcelado13a18] = useState("");

  // Outras Bandeiras (5 taxas)
  const [taxaOutrasDebito, setTaxaOutrasDebito] = useState("");
  const [taxaOutrasCreditoVista, setTaxaOutrasCreditoVista] = useState("");
  const [taxaOutrasParcelado2a6, setTaxaOutrasParcelado2a6] = useState("");
  const [taxaOutrasParcelado7a12, setTaxaOutrasParcelado7a12] = useState("");
  const [taxaOutrasParcelado13a18, setTaxaOutrasParcelado13a18] = useState("");

  // Return Visit Form State
  const [leadId, setLeadId] = useState<string>(selectedLead?.id || "");
  const [novaFase, setNovaFase] = useState<string>("");
  const [returnSelectedLead, setReturnSelectedLead] = useState<Lead | null>(null);
  const [tipoVisitaCliente, setTipoVisitaCliente] = useState<string>("");

  // Location audit
  const [placeLat, setPlaceLat] = useState<string | null>(null);
  const [placeLng, setPlaceLng] = useState<string | null>(null);

  // Dialogs
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [showIncompleteAlert, setShowIncompleteAlert] = useState(false);
  const [locationDistance, setLocationDistance] = useState(0);
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null);

  // Reminder states
  const [showReminderConfirmation, setShowReminderConfirmation] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [savedLeadName, setSavedLeadName] = useState<string>("");
  const [reminderLoading, setReminderLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  // Profile sheet state
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      resetAllForms();
    }
  }, [open]);

  // Main initiation effect: handles all ways the sheet can be opened
  useEffect(() => {
    if (!open) return;

    // Limpa todos os dados do formulário anterior antes de iniciar um novo
    resetAllForms();

    console.log("[LaunchVisit] Sheet opened with:", {
      directAction,
      initialType,
      hasSelectedLead: !!selectedLead,
      hasInitialPlace: !!initialPlace
    });

    // Option 1: Direct action with existing lead (e.g., Qualificar, Negociar)
    if (selectedLead && directAction) {
      console.log("[LaunchVisit] Initiating Direct Action:", directAction);

      const loadDataAndSetStep = async () => {
        setLoading(true);
        setVisitType("novo-cliente");

        // Immediate step selection based on action
        switch (directAction) {
          case "qualificar":
          case "qualificacao":
            setStep("qualificacao");
            break;
          case "negociar":
          case "negociacao":
            setStep("negociacao");
            break;
          case "precificar":
          case "precificacao":
            setStep("precificacao");
            break;
          case "credenciar":
          case "credenciamento":
          case "finalizar_credenciamento":
            setStep("credenciamento");
            break;
          case "prospeccao":
          case "retomar":
            setStep("prospeccao");
            break;
          default:
            setStep("prospeccao");
        }

        try {
          // Fetch fresh details for the lead
          const apiLead = await leadsService.getById(selectedLead.id);
          const leadToUse = adaptLeadApiToApp(apiLead);
          preencherDadosDoLead(leadToUse);
        } catch (error) {
          console.error("Failed to fetch fresh lead details:", error);
          // Fallback to cached lead data
          preencherDadosDoLead(selectedLead);
        } finally {
          setLoading(false);
        }
      };

      loadDataAndSetStep();
      return;
    }

    // Option 2: Pre-selected lead for return visit (e.g. from agenda)
    if (selectedLead && !directAction && initialType === "retorno") {
      console.log("[LaunchVisit] Initiating Return Visit for lead:", selectedLead.cod_lead);
      setLeadId(selectedLead.id);
      setReturnSelectedLead(selectedLead);
      setVisitType("retorno");
      setStep("return-visit");
      return;
    }

    // Option 3: Coming from map search (new client or return matched by proximity)
    if (initialPlace) {
      if (initialType === "novo-cliente") {
        console.log("[LaunchVisit] Initiating path: New Client from map");
        setNomeFantasia(initialPlace.name);
        if (initialPlace.addressComponents) {
          const ac = initialPlace.addressComponents;
          setEnderecoRua(ac.route || "");
          setEnderecoNumero(ac.streetNumber || "");
          setEnderecoBairro(ac.neighborhood || "");
          setEnderecoCidade(ac.city || "");
          setEnderecoEstado(ac.state || "");
          if (ac.postalCode) {
            const cleanCep = ac.postalCode.replace(/\D/g, "");
            setCep(cleanCep.length === 8 ? `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}` : ac.postalCode);
          }
        } else {
          parseAddressFromPlace(initialPlace.address);
        }
        setEnderecoOrigem("busca");
        setPlaceLat(initialPlace.lat.toString());
        setPlaceLng(initialPlace.lng.toString());
        setSelectedPlace(initialPlace);
        setVisitType("novo-cliente");
        setStep("prospeccao");
      } else if (initialType === "retorno") {
        console.log("[LaunchVisit] Initiating path: Return matched from map");
        setVisitType("retorno");
        let matchedLead = leads.find(lead => {
          if (!lead.lat || !lead.lng) return false;
          const distance = calculateDistance(initialPlace.lat, initialPlace.lng, parseFloat(lead.lat), parseFloat(lead.lng));
          return distance !== null && distance < 50;
        });
        if (!matchedLead) {
          matchedLead = leads.find(lead =>
            lead.nome_fantasia?.toLowerCase().includes(initialPlace.name.toLowerCase()) ||
            initialPlace.name.toLowerCase().includes(lead.nome_fantasia?.toLowerCase() || '')
          );
        }
        if (matchedLead) {
          setLeadId(matchedLead.id);
          setReturnSelectedLead(matchedLead);
          setStep("return-visit");
        } else {
          setStep("return-visit");
          toast.info("Cliente não encontrado", { description: "Busque o cliente manualmente na lista" });
        }
      }
      return;
    }

    // Default: Reset to selector if just opening fresh
    if (!initialType && !directAction) {
      setStep("select-type");
    }
  }, [open, selectedLead, directAction, initialPlace, initialType, leads]);

  const resetAllForms = () => {
    setStep("select-type");
    setVisitType(null);
    setSelectedPlace(null);
    setNomeFantasia("");
    // Endereço estruturado
    setCep("");
    setEnderecoRua("");
    setEnderecoNumero("");
    setEnderecoComplemento("");
    setEnderecoBairro("");
    setEnderecoCidade("");
    setEnderecoEstado("");
    setBuscandoCep(false);
    setCepError(null);
    setEnderecoOrigem("manual");
    setIsEditingAddress(false);
    setFalouComTD(null);
    setContatoNome("");
    setTelefone("");
    setObservacao("");
    setRazaoSocial("");
    setCpfCnpj("");
    setCpfCnpjError(null);
    setTpvEsperado("");
    setRamoAtividade("");
    setInformarRamoDepois(false);
    setSegmento("");
    setPrazoRecebimento("");
    setVolumeDebitoPix("pouco");
    setVolumeCreditoVista("pouco");
    setVolumeParcelado2a6("pouco");
    setVolumeParcelado7a12("pouco");
    setModoVisualizacao("tabela");
    setTaxaAntecipacao("");
    setTaxaPix("");
    setTaxaVisaDebito("");
    setTaxaVisaCreditoVista("");
    setTaxaVisaParcelado2a6("");
    setTaxaVisaParcelado7a12("");
    setTaxaVisaParcelado13a18("");
    setTaxaMasterDebito("");
    setTaxaMasterCreditoVista("");
    setTaxaMasterParcelado2a6("");
    setTaxaMasterParcelado7a12("");
    setTaxaMasterParcelado13a18("");
    setTaxaEloDebito("");
    setTaxaEloCreditoVista("");
    setTaxaEloParcelado2a6("");
    setTaxaEloParcelado7a12("");
    setTaxaEloParcelado13a18("");
    setTaxaOutrasDebito("");
    setTaxaOutrasCreditoVista("");
    setTaxaOutrasParcelado2a6("");
    setTaxaOutrasParcelado7a12("");
    setTaxaOutrasParcelado13a18("");
    setLeadId("");
    setNovaFase("");
    setReturnSelectedLead(null);
    setTipoVisitaCliente("");
    setPlaceLat(null);
    setPlaceLng(null);
    // Reminder states
    setShowReminderConfirmation(false);
    setShowReminderForm(false);
    setSavedLeadId(null);
    setSavedLeadName("");
  };

  const handleSelectType = (type: VisitType) => {
    setVisitType(type);
    setStep(type === "novo-cliente" ? "prospeccao" : "return-visit");
  };

  const handleBack = () => {
    if (step === "qualificacao") {
      setStep("prospeccao");
    } else if (step === "negociacao") {
      setStep("qualificacao");
    } else if (step === "precificacao") {
      setStep("negociacao");
    } else {
      setStep("select-type");
      setVisitType(null);
    }
  };

  // Função para formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  };

  // Função para buscar CEP na API ViaCEP
  const buscarCep = async (cepValue: string) => {
    const cepLimpo = cepValue.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      setCepError("CEP deve ter 8 dígitos");
      return;
    }

    setBuscandoCep(true);
    setCepError(null);

    try {
      // 1. Busca dados de endereço no ViaCEP
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado");
        return;
      }

      // Preenche campos automaticamente
      setEnderecoRua(data.logradouro || "");
      setEnderecoBairro(data.bairro || "");
      setEnderecoCidade(data.localidade || "");
      setEnderecoEstado(data.uf || "");
      setEnderecoOrigem("cep");
      setIsEditingAddress(false);

      toast.success("Endereço encontrado!");

      // 2. Busca coordenadas (Lat/Lng)
      const addressQuery = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}, ${cepLimpo}`;
      let foundLat = null;
      let foundLng = null;

      // Tenta nossa API (Google Maps Proxy)
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const url = baseUrl.endsWith('/api') ? `${baseUrl}/geocode` : `${baseUrl}/api/geocode`;

        const geoResponse = await fetch(`${url}?address=${encodeURIComponent(addressQuery)}`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.results && geoData.results[0]?.geometry?.location) {
            foundLat = geoData.results[0].geometry.location.lat;
            foundLng = geoData.results[0].geometry.location.lng;
          } else if (geoData.lat && geoData.lng) {
            foundLat = geoData.lat;
            foundLng = geoData.lng;
          }
        }
      } catch (geoError) {
        console.warn("Erro ao buscar coordenadas na API interna, tentando fallback...", geoError);
      }

      // Fallback: Nominatim (OpenStreetMap)
      if (!foundLat || !foundLng) {
        try {
          const nomResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&limit=1`);
          if (nomResponse.ok) {
            const nomData = await nomResponse.json();
            if (nomData && nomData[0]) {
              foundLat = nomData[0].lat;
              foundLng = nomData[0].lon;
            }
          }
        } catch (nomError) {
          console.error("Erro ao buscar coordenadas no Nominatim:", nomError);
        }
      }

      if (foundLat && foundLng) {
        setPlaceLat(foundLat.toString());
        setPlaceLng(foundLng.toString());
        toast.info("Coordenadas atualizadas via CEP!");
      } else {
        toast.warning("Endereço localizado, mas não foi possível obter as coordenadas exatas para o mapa.");
      }

    } catch (error) {
      setCepError("Erro ao buscar CEP");
    } finally {
      setBuscandoCep(false);
    }
  };

  // Handler para mudança de CEP com auto-busca
  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    setCepError(null);

    // Auto-busca quando completa 8 dígitos
    const cepLimpo = value.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      buscarCep(cepLimpo);
    }
  };

  // Função para parsear endereço do Google Places
  const parseAddressFromPlace = (address: string) => {
    // Tentar extrair CEP do endereço (padrão: 00000-000)
    const cepMatch = address.match(/\d{5}-?\d{3}/);
    if (cepMatch) {
      setCep(formatCep(cepMatch[0]));
    }

    // Formato típico: "Rua X, 123 - Bairro, Cidade - UF, CEP, Brasil"
    const parts = address.split(",").map(p => p.trim());

    if (parts.length >= 1) {
      // Primeira parte: Rua (pode ter número junto)
      const ruaPart = parts[0];
      const ruaNumeroMatch = ruaPart.match(/^(.+?),?\s*(\d+[A-Za-z]?)$/);
      if (ruaNumeroMatch) {
        setEnderecoRua(ruaNumeroMatch[1].trim());
        setEnderecoNumero(ruaNumeroMatch[2]);
      } else {
        setEnderecoRua(ruaPart);
      }
    }

    if (parts.length >= 2) {
      // Segunda parte pode ter número ou bairro
      const part2 = parts[1].trim();
      // Verifica se é um número
      if (/^\d+[A-Za-z]?$/.test(part2)) {
        setEnderecoNumero(part2);
      } else if (part2.includes(" - ")) {
        // Pode ser "Número - Bairro" ou "Bairro - Cidade"
        const subparts = part2.split(" - ");
        if (/^\d+[A-Za-z]?$/.test(subparts[0].trim())) {
          setEnderecoNumero(subparts[0].trim());
          setEnderecoBairro(subparts[1].trim());
        } else {
          setEnderecoBairro(subparts[0].trim());
        }
      } else {
        setEnderecoBairro(part2);
      }
    }

    if (parts.length >= 3) {
      // Terceira parte geralmente é Cidade - UF
      const part3 = parts[2].trim();
      if (part3.includes(" - ")) {
        const [cidade, uf] = part3.split(" - ");
        setEnderecoCidade(cidade.trim());
        if (uf && uf.length === 2) {
          setEnderecoEstado(uf.trim().toUpperCase());
        }
      } else {
        setEnderecoCidade(part3);
      }
    }

    if (parts.length >= 4) {
      // Quarta parte pode ser UF ou CEP
      const part4 = parts[3].trim();
      if (part4.length === 2 && /^[A-Z]{2}$/i.test(part4)) {
        setEnderecoEstado(part4.toUpperCase());
      }
    }
  };

  const handlePlaceSelect = (place: PlaceResult) => {
    setSelectedPlace(place);
    setNomeFantasia(place.name);

    // Prioritize structured address components if available
    if (place.addressComponents) {
      const ac = place.addressComponents;
      setEnderecoRua(ac.route || "");
      setEnderecoNumero(ac.streetNumber || "");
      setEnderecoBairro(ac.neighborhood || "");
      setEnderecoCidade(ac.city || "");
      setEnderecoEstado(ac.state || ""); // Ensure state is UF (e.g. SP)
      if (ac.postalCode) {
        const cleanCep = ac.postalCode.replace(/\D/g, "");
        setCep(cleanCep.length === 8 ? `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}` : ac.postalCode);
      }
    } else {
      parseAddressFromPlace(place.address);
    }

    setEnderecoOrigem("busca");
    setIsEditingAddress(false);
    setPlaceLat(place.lat.toString());
    setPlaceLng(place.lng.toString());
  };

  // Limpar campos de endereço para editar via CEP
  const handleEditarViaCep = () => {
    setEnderecoRua("");
    setEnderecoBairro("");
    setEnderecoCidade("");
    setEnderecoEstado("");
    setEnderecoNumero("");
    setEnderecoComplemento("");
    setCep("");
    setEnderecoOrigem("manual");
    setIsEditingAddress(true);
  };

  const handleUseCurrentLocation = async () => {
    if (!geolocation.loading && geolocation.latitude && geolocation.longitude) {
      setPlaceLat(geolocation.latitude.toString());
      setPlaceLng(geolocation.longitude.toString());
      setEnderecoOrigem("gps");
      setIsEditingAddress(false);

      // Tentar geocoding reverso para obter endereço
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${geolocation.latitude}&lon=${geolocation.longitude}&addressdetails=1`
        );
        const data = await response.json();

        if (data.address) {
          setEnderecoRua(data.address.road || data.address.street || "");
          setEnderecoNumero(data.address.house_number || "");
          setEnderecoBairro(data.address.suburb || data.address.neighbourhood || data.address.district || "");
          setEnderecoCidade(data.address.city || data.address.town || data.address.municipality || "");
          const estadoNome = data.address.state || data.address.state_code || "";
          setEnderecoEstado(getEstadoUF(estadoNome));
          if (data.address.postcode) {
            setCep(formatCep(data.address.postcode));
          }
          toast.success("Endereço encontrado via GPS!");
        }
      } catch (error) {
        // Se falhar, pelo menos salva as coordenadas
        toast.info("Coordenadas capturadas. Preencha o endereço manualmente.");
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    setTelefone(formatPhone(value));
  };

  const handleCpfCnpjChange = (value: string) => {
    const formatted = formatCpfCnpjInput(value);
    setCpfCnpj(formatted);

    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11 || cleaned.length === 14) {
      const validation = validateCpfCnpj(cleaned);
      if (!validation.valid) {
        setCpfCnpjError(validation.type === 'cpf' ? 'CPF inválido' : 'CNPJ inválido');
      } else {
        setCpfCnpjError(null);
      }
    } else {
      setCpfCnpjError(null);
    }
  };

  const handleTpvChange = (value: string) => {
    setTpvEsperado(formatMoneyInput(value));
  };

  const validateProspeccaoFields = (): boolean => {
    if (!nomeFantasia.trim()) {
      toast.error("Preencha o Nome Fantasia");
      return false;
    }
    if (nomeFantasia.trim().length < 10) {
      toast.error("O Nome Fantasia deve ter no mínimo 10 caracteres");
      return false;
    }
    // Validação de endereço estruturado
    if (!enderecoRua.trim()) {
      toast.error("Preencha a Rua/Logradouro");
      return false;
    }
    if (!enderecoNumero.trim()) {
      toast.error("Preencha o Número");
      return false;
    }
    if (!enderecoBairro.trim()) {
      toast.error("Preencha o Bairro");
      return false;
    }
    if (!enderecoCidade.trim()) {
      toast.error("Preencha a Cidade");
      return false;
    }
    if (!enderecoEstado.trim()) {
      toast.error("Preencha o Estado");
      return false;
    }
    if (!falouComTD) {
      toast.error("Informe se falou com o Tomador de Decisão");
      return false;
    }
    if (falouComTD === "sim" && !contatoNome.trim()) {
      toast.error("Preencha o nome do Tomador de Decisão");
      return false;
    }
    if (falouComTD === "nao" && !contatoNome.trim()) {
      toast.error("Preencha com quem você falou");
      return false;
    }
    if (!telefone.trim() || !validatePhone(telefone)) {
      toast.error("Preencha um telefone válido");
      return false;
    }
    // Observação é opcional - não precisa validar
    return true;
  };

  const validateQualificacaoFields = (): boolean => {
    // TPV é sempre obrigatório
    if (!tpvEsperado) {
      toast.error("Preencha o TPV Esperado");
      return false;
    }

    // Se é uma ação direta (continuando lead existente) que já passou da qualificação,
    // não exigir MCC e segmento - considerar como "informar depois"
    const leadJaAvancou = directAction && selectedLead && (selectedLead.funil_app || 0) >= 3;

    // Ramo de atividade: obrigatório apenas se não marcou "informar depois" E não é lead avançado
    if (!informarRamoDepois && !ramoAtividade && !leadJaAvancou) {
      toast.error("Selecione o Ramo de Atividade");
      return false;
    }

    // Segmento: obrigatório apenas se não é lead avançado
    if (!segmento && !leadJaAvancou) {
      toast.error("Selecione o segmento");
      return false;
    }

    if (!razaoSocial.trim()) {
      toast.error("Preencha a Razão Social");
      return false;
    }
    const cleaned = cpfCnpj.replace(/\D/g, '');
    if (cleaned.length !== 11 && cleaned.length !== 14) {
      toast.error("Preencha um CPF ou CNPJ válido");
      return false;
    }
    const validation = validateCpfCnpj(cleaned);
    if (!validation.valid) {
      toast.error(validation.type === 'cpf' ? 'CPF inválido' : 'CNPJ inválido');
      return false;
    }
    return true;
  };

  const validateNegociacaoFields = (): boolean => {
    if (!prazoRecebimento) {
      toast.error("Selecione o prazo de recebimento");
      return false;
    }
    return true;
  };

  const calcularShares = () => {
    const valores = [
      { key: "debitoPix", peso: INTENSIDADE_PESOS[volumeDebitoPix] },
      { key: "creditoVista", peso: INTENSIDADE_PESOS[volumeCreditoVista] },
      { key: "parcelado2a6", peso: INTENSIDADE_PESOS[volumeParcelado2a6] },
      { key: "parcelado7a12", peso: INTENSIDADE_PESOS[volumeParcelado7a12] }
    ];

    const total = valores.reduce((acc, v) => acc + v.peso, 0);

    if (total === 0) {
      return valores.map(v => ({ ...v, percentual: 0 }));
    }

    // Calcular percentuais sem arredondamento primeiro
    const percentuaisRaw = valores.map(v => ({
      ...v,
      percentualRaw: (v.peso / total) * 100
    }));

    // Arredondar para baixo inicialmente
    const percentuaisArredondados = percentuaisRaw.map(v => ({
      ...v,
      percentual: Math.floor(v.percentualRaw)
    }));

    // Calcular quanto falta para chegar a 100%
    const somaArredondada = percentuaisArredondados.reduce((acc, v) => acc + v.percentual, 0);
    let faltando = 100 - somaArredondada;

    // Distribuir o restante para os que têm maior parte decimal
    const ordenadosPorDecimal = [...percentuaisArredondados]
      .map((v, i) => ({ ...v, index: i, decimal: percentuaisRaw[i].percentualRaw - v.percentual }))
      .sort((a, b) => b.decimal - a.decimal);

    for (const item of ordenadosPorDecimal) {
      if (faltando <= 0) break;
      if (item.peso > 0) {
        percentuaisArredondados[item.index].percentual += 1;
        faltando -= 1;
      }
    }

    return percentuaisArredondados.map(({ key, peso, percentual }) => ({ key, peso, percentual }));
  };

  const shares = calcularShares();
  const totalShare = shares.reduce((acc, s) => acc + s.percentual, 0);

  const checkLocationAndSubmit = (submitFn: () => void) => {
    // Refresh location before checking
    geolocation.refreshLocation();

    if (placeLat && placeLng && !geolocation.loading) {
      const distance = calculateDistance(
        geolocation.latitude,
        geolocation.longitude,
        parseFloat(placeLat),
        parseFloat(placeLng)
      );

      if (distance > 500) {
        setLocationDistance(Math.round(distance));
        setPendingSubmit(() => submitFn);
        setShowLocationAlert(true);
        return;
      }
    }

    submitFn();
  };

  const upsertLead = async (targetFunnelStep?: number) => {
    const intensityToPercent = (intensity: IntensidadeNegociacao) => {
      if (intensity === "pouco") return 20;
      if (intensity === "medio") return 50;
      if (intensity === "principal") return 100;
      return 0;
    };

    const leadIdToUse = savedLeadId || selectedLead?.id;

    const funnelSteps: Record<VisitStep, number> = {
      "select-type": 0,
      "prospeccao": 1,
      "qualificacao": 2,
      "negociacao": 3,
      "precificacao": 4,
      "credenciamento": 5,
      "return-visit": 0
    };

    const currentFunnelStep = targetFunnelStep || funnelSteps[step] || 1;

    const leadData = {
      id: leadIdToUse,
      user_id: auth.user?.id,
      nome_fantasia: nomeFantasia,
      nome1: contatoNome,
      telefone: telefone,
      endereco_cep: cep,
      endereco_logradouro: enderecoRua,
      endereco_numero: enderecoNumero,
      endereco_complemento: enderecoComplemento,
      endereco_bairro: enderecoBairro,
      endereco_cidade: enderecoCidade,
      endereco_estado: enderecoEstado,
      lat: placeLat,
      lng: placeLng,
      observacao: observacao,
      funil_app: currentFunnelStep,
      credenciado: currentFunnelStep === 5 ? 1 : 0,
      is_decision_maker: falouComTD,
      nome_tomador_decisao: contatoNome,
      // Qualificação
      razao_social: razaoSocial,
      doc: cpfCnpj ? cpfCnpj.replace(/\D/g, '') : null,
      email: emailResponsavel,
      tpv: parseMoneyInput(tpvEsperado).toString(),
      mcc: ramoAtividade,
      segmento: segmento,
      // Negociação
      prazo_recebimento: prazoRecebimento,
      qtd_equipamentos: qtdEquipamentos ? parseInt(qtdEquipamentos) : null,
      share_debito_pix: intensityToPercent(volumeDebitoPix),
      share_credito_vista: intensityToPercent(volumeCreditoVista),
      share_parcelado_2a6: intensityToPercent(volumeParcelado2a6),
      share_parcelado_7a12: intensityToPercent(volumeParcelado7a12),
      // Precificação
      taxa_antecipacao: taxaAntecipacao ? parseFloat(taxaAntecipacao.replace(',', '.')) : null,
      taxa_pix: taxaPix ? parseFloat(taxaPix.replace(',', '.')) : null,
      visa_debito: taxaVisaDebito ? parseFloat(taxaVisaDebito.replace(',', '.')) : null,
      visa_credito_vista: taxaVisaCreditoVista ? parseFloat(taxaVisaCreditoVista.replace(',', '.')) : null,
      visa_parcelado_2a6: taxaVisaParcelado2a6 ? parseFloat(taxaVisaParcelado2a6.replace(',', '.')) : null,
      visa_parcelado_7a12: taxaVisaParcelado7a12 ? parseFloat(taxaVisaParcelado7a12.replace(',', '.')) : null,
      visa_parcelado_13a18: taxaVisaParcelado13a18 ? parseFloat(taxaVisaParcelado13a18.replace(',', '.')) : null,
      master_debito: taxaMasterDebito ? parseFloat(taxaMasterDebito.replace(',', '.')) : null,
      master_credito_vista: taxaMasterCreditoVista ? parseFloat(taxaMasterCreditoVista.replace(',', '.')) : null,
      master_parcelado_2a6: taxaMasterParcelado2a6 ? parseFloat(taxaMasterParcelado2a6.replace(',', '.')) : null,
      master_parcelado_7a12: taxaMasterParcelado7a12 ? parseFloat(taxaMasterParcelado7a12.replace(',', '.')) : null,
      master_parcelado_13a18: taxaMasterParcelado13a18 ? parseFloat(taxaMasterParcelado13a18.replace(',', '.')) : null,
      elo_debito: taxaEloDebito ? parseFloat(taxaEloDebito.replace(',', '.')) : null,
      elo_credito_vista: taxaEloCreditoVista ? parseFloat(taxaEloCreditoVista.replace(',', '.')) : null,
      elo_parcelado_2a6: taxaEloParcelado2a6 ? parseFloat(taxaEloParcelado2a6.replace(',', '.')) : null,
      elo_parcelado_7a12: taxaEloParcelado7a12 ? parseFloat(taxaEloParcelado7a12.replace(',', '.')) : null,
      elo_parcelado_13a18: taxaEloParcelado13a18 ? parseFloat(taxaEloParcelado13a18.replace(',', '.')) : null,
      outras_debito: taxaOutrasDebito ? parseFloat(taxaOutrasDebito.replace(',', '.')) : null,
      outras_credito_vista: taxaOutrasCreditoVista ? parseFloat(taxaOutrasCreditoVista.replace(',', '.')) : null,
      outras_parcelado_2a6: taxaOutrasParcelado2a6 ? parseFloat(taxaOutrasParcelado2a6.replace(',', '.')) : null,
      outras_parcelado_7a12: taxaOutrasParcelado7a12 ? parseFloat(taxaOutrasParcelado7a12.replace(',', '.')) : null,
      outras_parcelado_13a18: taxaOutrasParcelado13a18 ? parseFloat(taxaOutrasParcelado13a18.replace(',', '.')) : null,
    };

    console.log("[LaunchVisit] Debug Name Values:", {
      nomeFantasia,
      contatoNome,
      falouComTD
    });

    const apiData = adaptAppToLeadApi(leadData as any);

    try {
      let result;
      console.log(apiData);

      let finalLeadIdToUse = leadIdToUse;

      // Duplicate Check Logic (Only if creating new lead)
      if (!finalLeadIdToUse) {
        // 1. Check by CNPJ/CPF (Primary)
        if (cpfCnpj) {
          const cleanDoc = cpfCnpj.replace(/\D/g, '');
          const existingLeadByDoc = leads.find(l =>
            l.doc && l.doc.replace(/\D/g, '') === cleanDoc
          );

          if (existingLeadByDoc) {
            finalLeadIdToUse = existingLeadByDoc.id;
            toast.info("Cliente já existe!", {
              description: `Encontramos um cliente com este CPF/CNPJ: ${existingLeadByDoc.nome_fantasia}. Seus dados serão atualizados.`
            });
          }
        }

        // 2. Check by Name (Secondary - only if not found by doc)
        if (!finalLeadIdToUse && nomeFantasia) {
          const searchName = nomeFantasia.toLowerCase().trim();
          const existingLeadByName = leads.find(l =>
            l.nome_fantasia && l.nome_fantasia.toLowerCase().trim() === searchName
          );

          if (existingLeadByName) {
            finalLeadIdToUse = existingLeadByName.id;
            toast.info("Cliente já existe!", {
              description: `Encontramos um cliente com este nome: ${existingLeadByName.nome_fantasia}. Seus dados serão atualizados.`
            });
          }
        }
      }

      if (finalLeadIdToUse) {
        result = await leadsService.update(finalLeadIdToUse, apiData);
      } else {
        result = await leadsService.create(apiData);
      }

      setSavedLeadId(String(result.id));
      setSavedLeadName(result.trade_name || result.name || nomeFantasia || "Sem Nome");
      return result;
    } catch (error) {
      console.error("Error upserting lead:", error);
      toast.error("Não foi possível salvar os dados do lead automaticamente.");
      throw error;
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      console.log(`[ReverseGeocode] baseURL: ${api.defaults.baseURL}`);
      console.log(`[ReverseGeocode] Chamando backend para ${lat},${lng}`);
      const response = await api.get(`/geocode/reverse?lat=${lat}&lng=${lng}`);
      const data = response.data;
      
      console.log(`[ReverseGeocode] Resposta:`, data);

      if (data.display_name) {
        return data.display_name;
      }
      
      return "Endereço não identificado";
    } catch (error: any) {
      console.error("Erro no reverse geocoding via backend:", error);
      // Se for um erro do axios, tenta pegar a mensagem do body
      const serverMsg = error.response?.data?.display_name || error.response?.data?.error;
      return serverMsg ? `Erro: ${serverMsg}` : null;
    }
  };

  const registerVisitLog = async (leadId: string, tipo: string, status: string, obs?: string) => {
    try {
      console.log("[VisitLog] Iniciando registro de visita...", { leadId, tipo });
      const tId = toast.loading("Capturando sua geolocalização exata...");
      
      // Função auxiliar para pegar a posição atual como Promise
      const getFreshLocation = () => new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) {
          console.warn("[VisitLog] Geolocation não suportada");
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => {
            console.warn("[VisitLog] Erro ao obter posição:", err.message);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      const position = await getFreshLocation();
      let finalLat = position?.coords.latitude ? String(position.coords.latitude) : (placeLat || undefined);
      let finalLng = position?.coords.longitude ? String(position.coords.longitude) : (placeLng || undefined);
      
      let enderecoVisita = null;

      if (finalLat && finalLng) {
        toast.info("📍 Localização capturada! Buscando endereço...", { id: tId });
        console.log("[VisitLog] Buscando endereço para:", finalLat, finalLng);
        enderecoVisita = await reverseGeocode(parseFloat(finalLat), parseFloat(finalLng));
        console.log("[VisitLog] Endereço final:", enderecoVisita);
        
        if (enderecoVisita) {
          toast.success(`Endereço: ${enderecoVisita.split(',')[0]}`, { id: tId, duration: 4000 });
        } else {
          toast.warning("Não foi possível converter as coordenadas em endereço.", { id: tId });
        }
      } else {
        console.warn("[VisitLog] Sem coordenadas para geocoding");
        toast.error("Erro: GPS não disponível. Certifique-se de que a localização está ativa.", { id: tId });
      }

      const visitData = {
        lead_id: leadId,
        tipo: tipo,
        status: status,
        lat: finalLat,
        lng: finalLng,
        endereco_visita: enderecoVisita,
        observacao: obs || observacao || undefined,
        data_visita: new Date().toISOString()
      };

      console.log("[VisitLog] Salvando visita...", visitData);
      await visitsService.createVisit(visitData);
      console.log("[VisitLog] Visita salva com sucesso!");
    } catch (e) {
      console.error("[VisitLog] Erro fatal no registro:", e);
      toast.error("Erro ao registrar no histórico de visitas.");
    }
  };

  const handleProsseguirQualificacao = async () => {
    if (!validateProspeccaoFields()) return;

    try {
      // Upsert at current step (Stage 1) before moving to next
      const result = await upsertLead(1);
      await registerVisitLog(String(result.id), "prospeccao", "concluida", "Prosseguiu para qualificação");
      setStep("qualificacao");
    } catch (e) {
      // toast already shown in upsertLead
    }
  };

  const handleProsseguirNegociacao = async () => {
    if (!validateProspeccaoFields()) return;
    if (!validateQualificacaoFields()) return;

    try {
      const result = await upsertLead(2);
      await registerVisitLog(String(result.id), "qualificacao", "concluida", "Prosseguiu para negociação");
      setStep("negociacao");
    } catch (e) { }
  };

  const handleProsseguirPrecificacao = async () => {
    if (!validateProspeccaoFields()) return;
    if (!validateQualificacaoFields()) return;
    if (!validateNegociacaoFields()) return;

    try {
      const result = await upsertLead(3);
      await registerVisitLog(String(result.id), "negociacao", "concluida", "Prosseguiu para precificação");
      setStep("precificacao");
    } catch (e) { }
  };

  const handleSalvarProspeccao = () => {
    if (!validateProspeccaoFields()) return;

    checkLocationAndSubmit(async () => {
      setLoading(true);

      try {
        const result = await upsertLead(1);
        await registerVisitLog(String(result.id), "prospeccao", "concluida");

        toast.success("Visita registrada com sucesso!", {
          description: `Lead: ${result.tradeName || result.companyName} - Status: Prospecção`
        });
        onLeadSaved?.();
        if (onLeadSavedWithId) {
          onLeadSavedWithId(String(result.id));
        }

        // Se veio de um agendamento, notificar com o leadId
        if (reminderId && onLeadSavedWithId) {
          setLoading(false);
          onOpenChange(false);
          return;
        }

        // Mostrar dialog de confirmação de lembrete
        setLoading(false);
        setShowReminderConfirmation(true);
      } catch (error) {
        setLoading(false);
      }
    });
  };

  const handleSalvarQualificacao = () => {
    // When continuing from an existing lead, skip prospeccao validation
    if (!directAction && !validateProspeccaoFields()) return;

    if (!validateQualificacaoFields()) {
      if (!directAction) {
        setShowIncompleteAlert(true);
      }
      return;
    }

    checkLocationAndSubmit(async () => {
      setLoading(true);

      try {
        const result = await upsertLead(2);
        await registerVisitLog(String(result.id), "qualificacao", "concluida");

        toast.success("Qualificação salva com sucesso!", {
          description: `Lead: ${result.tradeName || result.companyName} - Status: Qualificação`
        });
        onLeadSaved?.();

        setLoading(false);
        setShowReminderConfirmation(true);
      } catch (error) {
        setLoading(false);
      }
    });
  };

  const handleSalvarNegociacao = () => {
    // When continuing from an existing lead, skip earlier validations
    if (!directAction) {
      if (!validateProspeccaoFields()) return;
      if (!validateQualificacaoFields()) return;
    }
    if (!validateNegociacaoFields()) return;

    checkLocationAndSubmit(async () => {
      setLoading(true);

      try {
        const result = await upsertLead(3);
        await registerVisitLog(String(result.id), "negociacao", "concluida");

        toast.success("Proposta salva com sucesso!", {
          description: `Lead: ${result.tradeName || result.companyName} - Status: Proposta`
        });
        onLeadSaved?.();

        setLoading(false);
        setShowReminderConfirmation(true);
      } catch (error) {
        setLoading(false);
      }
    });
  };

  // Auto-save quando usuário fecha o sheet sem prosseguir
  const handleAutoSaveOnClose = async (currentStep: VisitStep) => {
    // Determinar o status baseado no passo anterior completado
    const statusMap: Record<VisitStep, string> = {
      "select-type": "",
      "prospeccao": "",
      "qualificacao": "Prospecção",
      "negociacao": "Qualificação",
      "precificacao": "Negociação",
      "credenciamento": "Precificado",
      "return-visit": ""
    };

    const statusAnterior = statusMap[currentStep];

    if (statusAnterior && nomeFantasia.trim()) {
      // Verificar se os campos do passo anterior estão válidos
      if (currentStep === "negociacao" && validateProspeccaoFields() && validateQualificacaoFields()) {
        toast.info("Visita salva automaticamente", {
          description: `Lead: ${nomeFantasia} - Status: ${statusAnterior}`
        });
      } else if (currentStep === "precificacao" && validateProspeccaoFields() && validateQualificacaoFields() && validateNegociacaoFields()) {
        toast.info("Visita salva automaticamente", {
          description: `Lead: ${nomeFantasia} - Status: ${statusAnterior}`
        });
      }
    }
  };

  const handleSheetClose = (open: boolean) => {
    if (!open && (step === "negociacao" || step === "precificacao")) {
      handleAutoSaveOnClose(step);
    }
    onOpenChange(open);
  };

  const handleSalvarPrecificacao = () => {
    // When continuing from an existing lead, skip earlier validations
    if (!directAction) {
      if (!validateProspeccaoFields()) return;
      if (!validateQualificacaoFields()) return;
      if (!validateNegociacaoFields()) return;
    }

    checkLocationAndSubmit(async () => {
      setLoading(true);

      try {
        const result = await upsertLead(4);
        await registerVisitLog(String(result.id), "precificacao", "concluida");

        toast.success("Precificação salva com sucesso!", {
          description: `Lead: ${result.tradeName || result.companyName} - Status: Precificados`
        });
        onLeadSaved?.();

        setLoading(false);
        setShowReminderConfirmation(true);
      } catch (error) {
        setLoading(false);
      }
    });
  };


  // Handler para credenciar lead
  const handleCredenciar = async () => {
    if (!directAction || !selectedLead) {
      toast.error("Lead não selecionado");
      return;
    }

    setLoading(true);

    try {
      const result = await upsertLead(5);
      await registerVisitLog(String(result.id), "credenciamento", "concluida");

      toast.success("Lead credenciado com sucesso!", {
        description: `Lead: ${result.tradeName || result.companyName || selectedLead.nome_fantasia} - Status: Credenciado`
      });
      onLeadSaved?.();
    } catch (error) {
      // toast shown in upsert
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  // Função para determinar próxima ação baseado no funil
  const getProximaAcao = (funilId: number | null): { action: string; label: string; step: VisitStep } | null => {
    if (funilId === null) return null;
    switch (funilId) {
      case 1: return { action: "qualificar", label: "Qualificar", step: "qualificacao" };
      case 2: return { action: "negociar", label: "Negociar", step: "negociacao" };
      case 3: return { action: "precificar", label: "Precificar", step: "precificacao" };
      case 4: return { action: "credenciar", label: "Credenciar", step: "credenciamento" };
      default: return null; // Já é cliente (funil_app = 5)
    }
  };

  // Função para pré-preencher dados do lead nos formulários
  const preencherDadosDoLead = (lead: Lead) => {
    // Dados básicos (prospecção)
    setNomeFantasia(lead.nome_fantasia || "");
    setTelefone(lead.telefone || "");
    setCep(lead.endereco_cep || "");
    setEnderecoRua(lead.endereco_logradouro || "");
    setEnderecoNumero(lead.endereco_numero || "");
    setEnderecoBairro(lead.endereco_bairro || "");
    setEnderecoCidade(lead.endereco_cidade || "");
    setEnderecoEstado(lead.endereco_estado || "");
    setPlaceLat(lead.lat || null);
    setPlaceLng(lead.lng || null);
    setObservacao(lead.observacao || "");
    setIsEditingAddress(false); // Default to summary view for existing leads

    // Restaura status de decisão e nomes correspondentes
    if (lead.is_decision_maker !== undefined && lead.is_decision_maker !== null) {
      const status = lead.is_decision_maker as "sim" | "nao";
      setFalouComTD(status);
      setContatoNome(lead.nome1 || lead.nome_tomador_decisao || "");
    } else if (lead.nome1) {
      // Fallback para leads muito antigos sem campo de decisão
      setFalouComTD("sim");
      setContatoNome(lead.nome1);
    } else {
      setFalouComTD(null);
      setContatoNome("");
    }

    // Dados de qualificação
    setRazaoSocial(lead.razao_social || "");
    setCpfCnpj(lead.doc || "");
    setEmailResponsavel(lead.email || "");
    setTpvEsperado(lead.tpv ? `R$ ${Number(lead.tpv).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "");
    setRamoAtividade(lead.mcc || "");
    setSegmento((lead.segmento as "fisico" | "digital" | "hibrido") || "");

    // Dados de negociação
    setPrazoRecebimento((lead.prazo_recebimento as "D0" | "D+1" | "D+30" | "Fluxo") || "");
    setQtdEquipamentos(lead.qtd_equipamentos ? lead.qtd_equipamentos.toString() : "");
    setVolumeDebitoPix(getIntensidadeFromShare(lead.share_debito_pix));
    setVolumeCreditoVista(getIntensidadeFromShare(lead.share_credito_vista));
    setVolumeParcelado2a6(getIntensidadeFromShare(lead.share_parcelado_2a6));
    setVolumeParcelado7a12(getIntensidadeFromShare(lead.share_parcelado_7a12));
  };

  // Handler para continuar cadastro de um lead existente
  const handleContinuarCadastro = () => {
    if (!returnSelectedLead) return;

    const proximaAcao = getProximaAcao(returnSelectedLead.funil_app);
    if (!proximaAcao) return;

    // Pré-preencher dados do lead
    preencherDadosDoLead(returnSelectedLead);

    // Navegar para o step correspondente
    setVisitType("novo-cliente");
    setStep(proximaAcao.step);
  };

  // Handler para registrar visita a cliente credenciado
  const handleVisitaCliente = async () => {
    if (!returnSelectedLead || !tipoVisitaCliente) {
      toast.error("Selecione o tipo de visita");
      return;
    }

    setLoading(true);

    try {
      if (!auth.user) {
        toast.error("Usuário não autenticado");
        setLoading(false);
        return;
      }


      await registerVisitLog(returnSelectedLead.id, tipoVisitaCliente, "concluida");
      const tipoLabel = TIPOS_VISITA_CLIENTE.find(t => t.value === tipoVisitaCliente)?.label || tipoVisitaCliente;
      toast.success("Visita registrada com sucesso!", {
        description: `Cliente: ${returnSelectedLead.nome_fantasia} - Tipo: ${tipoLabel}`
      });
      onLeadSaved?.();
    } catch (error) {
      toast.error("Erro ao registrar visita");
      console.error(error);
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  // Handler quando lead é selecionado no retorno
  const handleLeadSelectChange = (value: string) => {
    setLeadId(value);
    const lead = leads.find(l => l.id === value);
    setReturnSelectedLead(lead || null);
    setTipoVisitaCliente("");
    setNovaFase("");
  };

  const handleSalvarComoProspeccao = async () => {
    setShowIncompleteAlert(false);
    setLoading(true);

    try {
      const result = await upsertLead(1);
      await registerVisitLog(String(result.id), "prospeccao", "concluida");

      toast.success("Visita registrada com sucesso!", {
        description: `Lead: ${result.tradeName || result.companyName || nomeFantasia} - Status: Prospecção`
      });
      onLeadSaved?.();
    } catch (error) {
      // toast shown in upsert
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  const handleReturnSubmit = () => {
    // Usar returnSelectedLead ou selectedLead (prop) como fallback
    const leadToUse = returnSelectedLead || selectedLead;

    if (!leadToUse && !leadId) {
      toast.error("Selecione um lead");
      return;
    }

    checkLocationAndSubmit(async () => {
      setLoading(true);

      try {
        if (!auth.user) {
          toast.error("Usuário não autenticado");
          setLoading(false);
          return;
        }

        // Priorizar o lead passado diretamente, fallback para busca por ID
        const leadSelecionado = leadToUse || leads.find(l => l.id === leadId);

        if (leadSelecionado) {
          // Atualizar fase do lead via API apenas se selecionada
          if (novaFase) {
            const updateData = {
              funil_app: parseInt(novaFase),
              id: leadSelecionado.id
            };

            const apiData = adaptAppToLeadApi(updateData as any);
            await leadsService.update(leadSelecionado.id, apiData);
          }
          
          await registerVisitLog(leadSelecionado.id, "retorno", "concluida");
        }

        const faseSelecionada = novaFase ? FUNIL.find(f => f.id.toString() === novaFase) : null;
        const msgSucesso = faseSelecionada 
          ? `Lead: ${leadSelecionado?.nome_fantasia} - Fase: ${faseSelecionada.label}`
          : `Visita registrada para: ${leadSelecionado?.nome_fantasia}`;

        toast.success("Visita registrada com sucesso!", {
          description: msgSucesso
        });
        onLeadSaved?.();
      } catch (error) {
        toast.error("Erro ao salvar visita");
        console.error(error);
      } finally {
        setLoading(false);
        onOpenChange(false);
      }
    });
  };

  const handleLocationAlertConfirm = () => {
    setShowLocationAlert(false);
    if (pendingSubmit) {
      pendingSubmit();
      setPendingSubmit(null);
    }
  };

  // Reminder handlers
  const handleReminderConfirm = () => {
    setShowReminderConfirmation(false);
    setShowReminderForm(true);
  };

  const handleReminderCancel = () => {
    setShowReminderConfirmation(false);
    onOpenChange(false);
  };



  const handleReminderSubmit = async (data: { date: string; time: string; description: string }) => {
    if (!savedLeadId) return;

    setReminderLoading(true);

    try {
      if (!auth.user) {
        toast.error("Usuário não autenticado");
        setReminderLoading(false);
        return;
      }

      const result = await createReminderForLead(
        savedLeadId,
        data.date,
        data.time,
        data.description
      );

      if (result.success) {
        toast.success("Lembrete criado com sucesso!", {
          description: `Para: ${savedLeadName}`
        });
      } else {
        toast.error("Erro ao criar lembrete");
      }
    } catch (error) {
      toast.error("Erro ao criar lembrete");
      console.error(error);
    } finally {
      setReminderLoading(false);
      setShowReminderForm(false);
      onOpenChange(false);
    }
  };

  const handleReminderFormClose = (open: boolean) => {
    if (!open) {
      setShowReminderForm(false);
      onOpenChange(false);
    }
  };

  const selectedLeadData = leads.find(l => l.id === leadId);
  const currentFaseId = selectedLeadData?.funil_app || 1;
  const availableFases = FUNIL.filter(f => f.id >= currentFaseId && f.id !== 6);

  const renderTypeSelector = () => (
    <div className="space-y-6 mt-6">
      <p className="text-muted-foreground text-center">
        Este é um novo cliente ou um retorno?
      </p>

      <div className="space-y-4">
        <button
          onClick={() => handleSelectType("novo-cliente")}
          className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <UserPlus className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Novo Cliente</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Primeiro contato com o estabelecimento. Abre formulário de Prospecção.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleSelectType("retorno")}
          className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-secondary/50 text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Cliente Já Cadastrado (Retorno)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Busque o cliente e continue o relacionamento.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderProspeccaoForm = () => (
    <div className="space-y-5 mt-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 sticky top-0 z-10">
        <div className="h-3 w-3 rounded-full bg-blue-500" />
        <span className="text-sm font-medium text-blue-700">Prospecção</span>
        <span className="text-xs text-blue-500 ml-auto">(status inicial)</span>
      </div>

      {/* Buscar no Google e Mapa */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Procurar Estabelecimento no Google</Label>
          <PlacesSearch
            onPlaceSelect={handlePlaceSelect}
            placeholder="Digite o nome do local..."
          />
        </div>

        {placeLat && placeLng && (
          <div className="w-full h-48 rounded-md overflow-hidden border border-border mt-2">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${placeLat},${placeLng}&hl=pt-BR&z=15&output=embed`}
            />
          </div>
        )}

        <div className="flex items-center">
          <div className="h-px flex-1 bg-border" />
          <span className="px-3 text-xs text-muted-foreground">ou preencha manualmente</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      {/* Nome Fantasia */}
      <div className="space-y-2">
        <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="nomeFantasia"
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            placeholder="Nome do estabelecimento"
            className="pl-10"
          />
        </div>
      </div>

      {/* Endereço Inteligente */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="enderecoRua" className="text-base font-medium">Endereço *</Label>
          {enderecoOrigem !== "manual" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {enderecoOrigem === "busca" ? "Via busca" : enderecoOrigem === "gps" ? "Via GPS" : "Via CEP"}
            </span>
          )}
        </div>

        {/* Se já tem endereço e não está editando tudo, mostra resumo + numero/complem */}
        {enderecoRua && !isEditingAddress && enderecoOrigem !== "manual" ? (
          <>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{enderecoRua}</p>
                    <p className="text-xs text-muted-foreground">
                      {enderecoBairro}{enderecoCidade ? ` - ${enderecoCidade}` : ""}{enderecoEstado ? `/${enderecoEstado}` : ""}
                    </p>
                    {cep && <p className="text-xs text-muted-foreground font-mono">CEP: {cep}</p>}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="enderecoNumero" className="text-sm">Número</Label>
                    <Input
                      id="enderecoNumero"
                      value={enderecoNumero}
                      onChange={(e) => setEnderecoNumero(e.target.value)}
                      placeholder="1000"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="enderecoComplemento" className="text-sm">Complemento</Label>
                    <Input
                      id="enderecoComplemento"
                      value={enderecoComplemento}
                      onChange={(e) => setEnderecoComplemento(e.target.value)}
                      placeholder="Ap 101"
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Campo CEP - Quick Edit */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="space-y-1">
                  <Label htmlFor="cep_quick" className="text-xs text-muted-foreground">CEP (para atualizar endereço)</Label>
                  <div className="relative">
                    <Input
                      id="cep_quick"
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="bg-background h-9 text-sm"
                      maxLength={9}
                    />
                    {buscandoCep && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={geolocation.loading}
                className="w-full text-xs gap-2"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {geolocation.loading ? "..." : "Usar GPS"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingAddress(true)}
                className="w-full text-xs text-muted-foreground gap-2 border border-dashed"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Editar tudo
              </Button>
            </div>
          </>
        ) : (
          /* Se não tem endereço OU está editando, mostra tudo */
          <div className="space-y-4">
            {/* Rua e Número */}
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <div className="space-y-1">
                <Label htmlFor="enderecoRua" className="text-sm">Rua/Logradouro</Label>
                <Input
                  id="enderecoRua"
                  value={enderecoRua}
                  onChange={(e) => {
                    setEnderecoRua(e.target.value);
                    setEnderecoOrigem("manual");
                  }}
                  placeholder="Av. Paulista"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="enderecoNumero" className="text-sm">Número</Label>
                <Input
                  id="enderecoNumero"
                  value={enderecoNumero}
                  onChange={(e) => setEnderecoNumero(e.target.value)}
                  placeholder="1000"
                />
              </div>
            </div>

            {/* Bairro e CEP */}
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="space-y-1">
                <Label htmlFor="enderecoBairro" className="text-sm">Bairro</Label>
                <Input
                  id="enderecoBairro"
                  value={enderecoBairro}
                  onChange={(e) => {
                    setEnderecoBairro(e.target.value);
                    setEnderecoOrigem("manual");
                  }}
                  placeholder="Centro"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cep" className="text-sm">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className={cepError ? "border-destructive" : ""}
                    maxLength={9}
                  />
                  {buscandoCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {cepError && <p className="text-xs text-destructive -mt-3">{cepError}</p>}

            {/* Cidade e Estado */}
            <div className="grid grid-cols-[1fr_70px] gap-3">
              <div className="space-y-1">
                <Label htmlFor="enderecoCidade" className="text-sm">Cidade</Label>
                <Input
                  id="enderecoCidade"
                  value={enderecoCidade}
                  onChange={(e) => {
                    setEnderecoCidade(e.target.value);
                    setEnderecoOrigem("manual");
                  }}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="enderecoEstado" className="text-sm">UF</Label>
                <Input
                  id="enderecoEstado"
                  value={enderecoEstado}
                  onChange={(e) => {
                    setEnderecoEstado(e.target.value);
                    setEnderecoOrigem("manual");
                  }}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Complemento */}
            <div className="space-y-1">
              <Label htmlFor="enderecoComplemento" className="text-sm">Complemento</Label>
              <Input
                id="enderecoComplemento"
                value={enderecoComplemento}
                onChange={(e) => setEnderecoComplemento(e.target.value)}
                placeholder="Sala, Bloco..."
              />
            </div>

            {/* Botão GPS */}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={geolocation.loading}
                className="w-full h-10 gap-2 border-dashed"
              >
                <MapPin className="h-4 w-4 text-primary" />
                {geolocation.loading ? "Obtendo..." : (enderecoRua ? "Atualizar com localização atual" : "Preencher com localização atual")}
              </Button>
            </div>

            {isEditingAddress && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingAddress(false)}
                className="w-full mt-2 text-primary hover:text-primary/80"
              >
                Voltar para resumo
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Falou com Tomador de Decisão? *</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={falouComTD === "sim" ? "default" : "outline"}
            className={`flex-1 ${falouComTD === "sim" ? "bg-primary" : ""}`}
            onClick={() => setFalouComTD("sim")}
          >
            Sim
          </Button>
          <Button
            type="button"
            variant={falouComTD === "nao" ? "default" : "outline"}
            className={`flex-1 ${falouComTD === "nao" ? "bg-primary" : ""}`}
            onClick={() => setFalouComTD("nao")}
          >
            Não
          </Button>
        </div>
      </div>

      {/* Conditional: Nome do TD or Com quem falei */}
      {
        (falouComTD === "sim" || falouComTD === "nao") && (
          <div className="space-y-2">
            <Label htmlFor="contatoNome">
              {falouComTD === "sim" ? "Nome do Tomador de Decisão *" : "Com quem falei *"}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contatoNome"
                value={contatoNome}
                onChange={(e) => setContatoNome(e.target.value)}
                placeholder={falouComTD === "sim" ? "Nome do TD" : "Nome da pessoa"}
                className="pl-10"
              />
            </div>
          </div>
        )
      }

      {/* Telefone */}
      <div className="space-y-2">
        <Label htmlFor="telefone">Contato/Telefone *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="telefone"
            value={telefone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="(00) 00000-0000"
            className="pl-10"
            maxLength={15}
          />
        </div>
      </div>

      {/* Observação */}
      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <p className="text-xs text-muted-foreground">
          Ex: "TD estava viajando", "Visita agendada para dia X", "Cliente não tem interesse no momento"
        </p>
        <Textarea
          id="observacao"
          placeholder="Adicione observações sobre a visita..."
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={3}
        />
      </div>

      {/* Data e Hora - Discreto */}
      <p className="text-xs text-muted-foreground text-center">
        {new Date(dateVisit).toLocaleDateString('pt-BR')} ás {timeVisit}
      </p>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          className="w-full h-12"
          variant="outline"
          onClick={handleProsseguirQualificacao}
          disabled={buscandoCep}
        >
          {buscandoCep ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Buscando endereço...
            </>
          ) : (
            <>
              <ArrowRight className="h-5 w-5 mr-2" />
              Prosseguir para Qualificação
            </>
          )}
        </Button>

        <Button
          className="w-full h-12 gradient-dark text-white border-0"
          onClick={handleSalvarProspeccao}
          disabled={loading || buscandoCep}
        >
          {loading ? "Salvando..." : (
            <>
              <Check className="h-5 w-5 mr-2 text-primary" />
              Salvar Visita
            </>
          )}
        </Button>
      </div>
    </div >
  );

  const renderQualificacaoForm = () => (
    <div className="space-y-5 mt-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 sticky top-0 z-10">
        <div className="h-3 w-3 rounded-full bg-yellow-500" />
        <span className="text-sm font-medium text-yellow-700">Qualificação</span>
        <span className="text-xs text-yellow-500 ml-auto">Dados do Negócio</span>
      </div>

      {/* Summary of Prospecção */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm font-medium">{nomeFantasia}</p>
        <p className="text-xs text-muted-foreground">
          {enderecoRua}{enderecoNumero ? `, ${enderecoNumero}` : ""}{enderecoBairro ? ` - ${enderecoBairro}` : ""}{enderecoCidade ? `, ${enderecoCidade}` : ""}{enderecoEstado ? ` - ${enderecoEstado}` : ""}
        </p>
      </div>

      {/* Razão Social */}
      <div className="space-y-2">
        <Label htmlFor="razaoSocial">Razão Social *</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="razaoSocial"
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
            placeholder="Razão social da empresa"
            className="pl-10"
          />
        </div>
      </div>

      {/* CPF/CNPJ */}
      <div className="space-y-2">
        <Label htmlFor="cpfCnpj">CPF ou CNPJ *</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="cpfCnpj"
            value={cpfCnpj}
            onChange={(e) => handleCpfCnpjChange(e.target.value)}
            placeholder="00.000.000/0001-00"
            className={`pl-10 ${cpfCnpjError ? 'border-destructive' : ''}`}
            maxLength={18}
          />
        </div>
        {cpfCnpjError && (
          <p className="text-xs text-destructive">{cpfCnpjError}</p>
        )}
      </div>

      {/* E-mail do Responsável */}
      <div className="space-y-2">
        <Label htmlFor="emailResponsavel">E-mail do Responsável</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="emailResponsavel"
            type="email"
            value={emailResponsavel}
            onChange={(e) => setEmailResponsavel(e.target.value)}
            placeholder="email@exemplo.com.br"
            className="pl-10"
          />
        </div>
      </div>

      {/* TPV Esperado */}
      <div className="space-y-2">
        <Label htmlFor="tpvEsperado">TPV Esperado *</Label>
        <MoneyInput
          id="tpvEsperado"
          value={tpvEsperado}
          onChange={(val) => setTpvEsperado(val)}
        />
      </div>

      {/* Ramo de Atividade (MCC) */}
      <div className="space-y-2">
        <Label htmlFor="ramoAtividade">Ramo de Atividade *</Label>
        <Select
          value={ramoAtividade}
          onValueChange={setRamoAtividade}
          disabled={informarRamoDepois}
        >
          <SelectTrigger id="ramoAtividade">
            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Selecione o ramo de atividade" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {MCC_ABECS.map((mcc) => (
              <SelectItem key={mcc.code} value={mcc.code}>
                {mcc.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="informarRamoDepois"
            checked={informarRamoDepois}
            onCheckedChange={(checked) => {
              setInformarRamoDepois(checked as boolean);
              if (checked) setRamoAtividade("");
            }}
          />
          <label htmlFor="informarRamoDepois" className="text-sm text-muted-foreground">
            Informar depois
          </label>
        </div>
      </div>

      {/* Segmento */}
      <div className="space-y-2">
        <Label htmlFor="segmento">Segmento *</Label>
        <Select
          value={segmento}
          onValueChange={(v: "fisico" | "digital" | "hibrido") => setSegmento(v)}
        >
          <SelectTrigger id="segmento">
            <SelectValue placeholder="Selecione o segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fisico">Físico</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="hibrido">Híbrido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          className="w-full h-12"
          variant="outline"
          onClick={handleProsseguirNegociacao}
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          Prosseguir para Negociação
        </Button>

        <Button
          className="w-full h-12 gradient-dark text-white border-0"
          onClick={handleSalvarQualificacao}
          disabled={loading}
        >
          {loading ? "Salvando..." : (
            <>
              <Check className="h-5 w-5 mr-2 text-primary" />
              Salvar Visita
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderModalidadeSelectorNegociacao = (
    label: string,
    value: IntensidadeNegociacao,
    onChange: (value: IntensidadeNegociacao) => void,
    percentual: number
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold text-primary">{percentual}%</span>
      </div>
      <div className="flex gap-1">
        {(Object.keys(INTENSIDADE_NEGOCIACAO_LABELS) as IntensidadeNegociacao[]).map((nivel) => (
          <button
            key={nivel}
            type="button"
            onClick={() => onChange(nivel)}
            className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors ${value === nivel
              ? `${INTENSIDADE_COLORS[nivel].bg} ${INTENSIDADE_COLORS[nivel].text} ${INTENSIDADE_COLORS[nivel].border}`
              : "bg-background hover:bg-muted border-border"
              }`}
          >
            {INTENSIDADE_NEGOCIACAO_LABELS[nivel]}
          </button>
        ))}
      </div>
    </div>
  );

  const renderNegociacaoForm = () => (
    <div className="space-y-5 mt-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200 sticky top-0 z-10">
        <div className="h-3 w-3 rounded-full bg-purple-500" />
        <span className="text-sm font-medium text-purple-700">Negociação</span>
        <span className="text-xs text-purple-500 ml-auto">Condições Comerciais</span>
      </div>

      {/* Summary */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm font-medium">{nomeFantasia}</p>
        <p className="text-xs text-muted-foreground">{razaoSocial}</p>
        <p className="text-xs text-muted-foreground">
          {cpfCnpj} • {segmento?.charAt(0).toUpperCase() + segmento?.slice(1)} • TPV: R$ {tpvEsperado || '---'}
        </p>
      </div>

      {/* Prazo de Recebimento */}
      <div className="space-y-2">
        <Label htmlFor="prazoRecebimento">Prazo de Recebimento *</Label>
        <Select value={prazoRecebimento} onValueChange={(v: "D0" | "D+1" | "D+30" | "Fluxo") => setPrazoRecebimento(v)}>
          <SelectTrigger id="prazoRecebimento">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Selecione o prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="D0">D0 (No dia)</SelectItem>
            <SelectItem value="D+1">D+1 (1 dia útil)</SelectItem>
            <SelectItem value="D+30">D+30 (30 dias)</SelectItem>
            <SelectItem value="Fluxo">Fluxo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quantidade de Equipamentos */}
      <div className="space-y-2">
        <Label htmlFor="qtdEquipamentos">Quantidade de Equipamentos *</Label>
        <div className="relative">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="qtdEquipamentos"
            type="number"
            min="1"
            placeholder="Quantas máquinas o cliente precisa?"
            value={qtdEquipamentos}
            onChange={(e) => setQtdEquipamentos(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Número de terminais POS que serão instalados
        </p>
      </div>

      {/* Share por Modalidade */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Share</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribuição estimada por modalidade
            </p>
          </div>
          <span className="text-sm font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
            {totalShare}%
          </span>
        </div>

        <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
          {renderModalidadeSelectorNegociacao(
            "Débito e Pix",
            volumeDebitoPix,
            setVolumeDebitoPix,
            shares.find(s => s.key === "debitoPix")?.percentual || 0
          )}

          {renderModalidadeSelectorNegociacao(
            "Crédito á Vista",
            volumeCreditoVista,
            setVolumeCreditoVista,
            shares.find(s => s.key === "creditoVista")?.percentual || 0
          )}

          {renderModalidadeSelectorNegociacao(
            "Parcelado 2x-6x",
            volumeParcelado2a6,
            setVolumeParcelado2a6,
            shares.find(s => s.key === "parcelado2a6")?.percentual || 0
          )}

          {renderModalidadeSelectorNegociacao(
            "Parcelado 7x-12x",
            volumeParcelado7a12,
            setVolumeParcelado7a12,
            shares.find(s => s.key === "parcelado7a12")?.percentual || 0
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-3 pt-2">
        <Button
          className="w-full h-12"
          variant="outline"
          onClick={handleProsseguirPrecificacao}
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          Prosseguir para Precificação
        </Button>

        <Button
          className="w-full h-12 gradient-dark text-white border-0"
          onClick={handleSalvarNegociacao}
          disabled={loading}
        >
          {loading ? "Salvando..." : (
            <>
              <Check className="h-5 w-5 mr-2 text-primary" />
              Salvar Visita
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const BANDEIRAS_CONFIG = [
    { id: "visa", nome: "Visa", sigla: "VISA", bgColor: "bg-blue-600", bgLight: "bg-blue-50/50", textColor: "text-white" },
    { id: "master", nome: "Mastercard", sigla: "MC", bgColor: "bg-gradient-to-r from-red-500 to-yellow-500", bgLight: "bg-red-50/50", textColor: "text-white" },
    { id: "elo", nome: "Elo", sigla: "ELO", bgColor: "bg-yellow-400", bgLight: "bg-yellow-50/50", textColor: "text-black" },
    { id: "outras", nome: "Outras Bandeiras", sigla: "+", bgColor: "bg-gray-500", bgLight: "bg-gray-50/50", textColor: "text-white" }
  ];

  const TIPOS_TAXA = [
    { id: "debito", label: "Débito", labelCurto: "Débito" },
    { id: "creditoVista", label: "Crédito á Vista", labelCurto: "Crédito" },
    { id: "parcelado2a6", label: "Parcelado 2x-6x", labelCurto: "2x6" },
    { id: "parcelado7a12", label: "Parcelado 7x-12x", labelCurto: "7x12" },
    { id: "parcelado13a18", label: "Parcelado 13x-18x", labelCurto: "13x18" }
  ];

  const getTaxaValue = (bandeira: string, tipo: string): string => {
    const taxas: Record<string, Record<string, string>> = {
      visa: {
        debito: taxaVisaDebito,
        creditoVista: taxaVisaCreditoVista,
        parcelado2a6: taxaVisaParcelado2a6,
        parcelado7a12: taxaVisaParcelado7a12,
        parcelado13a18: taxaVisaParcelado13a18
      },
      master: {
        debito: taxaMasterDebito,
        creditoVista: taxaMasterCreditoVista,
        parcelado2a6: taxaMasterParcelado2a6,
        parcelado7a12: taxaMasterParcelado7a12,
        parcelado13a18: taxaMasterParcelado13a18
      },
      elo: {
        debito: taxaEloDebito,
        creditoVista: taxaEloCreditoVista,
        parcelado2a6: taxaEloParcelado2a6,
        parcelado7a12: taxaEloParcelado7a12,
        parcelado13a18: taxaEloParcelado13a18
      },
      outras: {
        debito: taxaOutrasDebito,
        creditoVista: taxaOutrasCreditoVista,
        parcelado2a6: taxaOutrasParcelado2a6,
        parcelado7a12: taxaOutrasParcelado7a12,
        parcelado13a18: taxaOutrasParcelado13a18
      }
    };
    return taxas[bandeira]?.[tipo] || "";
  };

  const formatPercentage = (value: string): string => {
    const cleaned = value.replace(/[^\d,]/g, "");
    const parts = cleaned.split(",");
    if (parts.length > 1) {
      return `${parts[0]},${parts[1].slice(0, 2)}`;
    }
    return cleaned;
  };

  const setTaxaValue = (bandeira: string, tipo: string, value: string) => {
    const formatted = formatPercentage(value);
    const setters: Record<string, Record<string, (v: string) => void>> = {
      visa: {
        debito: setTaxaVisaDebito,
        creditoVista: setTaxaVisaCreditoVista,
        parcelado2a6: setTaxaVisaParcelado2a6,
        parcelado7a12: setTaxaVisaParcelado7a12,
        parcelado13a18: setTaxaVisaParcelado13a18
      },
      master: {
        debito: setTaxaMasterDebito,
        creditoVista: setTaxaMasterCreditoVista,
        parcelado2a6: setTaxaMasterParcelado2a6,
        parcelado7a12: setTaxaMasterParcelado7a12,
        parcelado13a18: setTaxaMasterParcelado13a18
      },
      elo: {
        debito: setTaxaEloDebito,
        creditoVista: setTaxaEloCreditoVista,
        parcelado2a6: setTaxaEloParcelado2a6,
        parcelado7a12: setTaxaEloParcelado7a12,
        parcelado13a18: setTaxaEloParcelado13a18
      },
      outras: {
        debito: setTaxaOutrasDebito,
        creditoVista: setTaxaOutrasCreditoVista,
        parcelado2a6: setTaxaOutrasParcelado2a6,
        parcelado7a12: setTaxaOutrasParcelado7a12,
        parcelado13a18: setTaxaOutrasParcelado13a18
      }
    };
    setters[bandeira]?.[tipo]?.(formatted);
  };

  const countFilledFields = (bandeira: string): number => {
    return TIPOS_TAXA.filter(tipo => {
      const value = getTaxaValue(bandeira, tipo.id);
      return value && value.trim() !== "";
    }).length;
  };

  const isMobile = useIsMobile();

  const renderPrecificacaoForm = () => (
    <div className="space-y-5 mt-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 sticky top-0 z-10">
        <div className="h-3 w-3 rounded-full bg-green-500" />
        <span className="text-sm font-medium text-green-700">Precificação</span>
        <span className="text-xs text-green-500 ml-auto">Taxas por Bandeira</span>
      </div>

      {/* Summary */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm font-medium">{nomeFantasia}</p>
        <p className="text-xs text-muted-foreground">
          Prazo: {prazoRecebimento} • TPV: R$ {tpvEsperado || '---'}
        </p>
      </div>

      {/* Toggle de Visualização */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Visualização:</span>
        <ToggleGroup
          type="single"
          value={modoVisualizacao}
          onValueChange={(v) => v && setModoVisualizacao(v as "accordion" | "tabela")}
          className="bg-muted rounded-lg p-1"
        >
          <ToggleGroupItem
            value="tabela"
            className="px-3 py-2 text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
            title="Comparar bandeiras"
          >
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="accordion"
            className="px-3 py-2 text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
            title="Por bandeira"
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Taxas por Bandeira */}
      <div className="space-y-4">
        <Label className="text-base">Taxas Sugeridas por Bandeira</Label>

        {modoVisualizacao === "accordion" ? (
          // Visualização Accordion
          <Accordion type="multiple" defaultValue={["visa"]} className="space-y-3">
            {BANDEIRAS_CONFIG.map((bandeira) => (
              <AccordionItem
                key={bandeira.id}
                value={bandeira.id}
                className={`rounded-lg border ${bandeira.bgLight}`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-12 h-8 ${bandeira.bgColor} rounded flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${bandeira.textColor}`}>
                        {bandeira.sigla}
                      </span>
                    </div>
                    <span className="font-medium">{bandeira.nome}</span>
                    <span className="ml-auto mr-2 text-xs text-muted-foreground">
                      {countFilledFields(bandeira.id)}/5
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    {TIPOS_TAXA.map((tipo) => (
                      <div key={tipo.id} className="flex items-center gap-3">
                        <Label className="w-36 text-sm">{tipo.label}</Label>
                        <PercentageInput
                          className="flex-1"
                          placeholder="0,00"
                          value={getTaxaValue(bandeira.id, tipo.id)}
                          onChange={(val) => setTaxaValue(bandeira.id, tipo.id, val)}
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          // Visualização Tabela Comparativa
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-20">Tipo</TableHead>
                  {BANDEIRAS_CONFIG.map((b) => (
                    <TableHead key={b.id} className="text-center p-2">
                      <div className={`inline-flex ${b.bgColor} px-2 py-1 rounded`}>
                        <span className={`text-xs font-bold ${b.textColor}`}>{b.sigla}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIPOS_TAXA.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium text-sm py-2">{tipo.labelCurto}</TableCell>
                    {BANDEIRAS_CONFIG.map((bandeira) => (
                      <TableCell key={bandeira.id} className="p-1">
                        <PercentageInput
                          className="w-full min-w-[85px] text-center text-sm h-9 pl-1"
                          placeholder="0,00"
                          value={getTaxaValue(bandeira.id, tipo.id)}
                          onChange={(val) => setTaxaValue(bandeira.id, tipo.id, val)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Taxas Gerais */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base">Taxas Gerais</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Antecipação</Label>
            <PercentageInput
              placeholder="0,00"
              value={taxaAntecipacao}
              onChange={setTaxaAntecipacao}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Pix</Label>
            <PercentageInput
              placeholder="0,00"
              value={taxaPix}
              onChange={setTaxaPix}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          className="w-full h-12 gradient-dark text-white border-0"
          onClick={handleSalvarPrecificacao}
          disabled={loading}
        >
          {loading ? "Salvando..." : (
            <>
              <Check className="h-5 w-5 mr-2 text-primary" />
              Salvar Proposta
            </>
          )}
        </Button>

        <Button
          className="w-full h-12"
          variant="outline"
          onClick={() => toast.info("Funcionalidade em desenvolvimento", { description: "Em breve você poderá exportar a proposta em PDF." })}
        >
          <FileDown className="h-5 w-5 mr-2" />
          Exportar Proposta
        </Button>
      </div>
    </div>
  );

  const renderReturnForm = () => {
    const isCliente = returnSelectedLead && (returnSelectedLead.funil_app ?? 0) >= 5;
    const proximaAcao = returnSelectedLead ? getProximaAcao(returnSelectedLead.funil_app) : null;

    return (
      <div className="space-y-5 mt-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Lead Selection */}
        <div className="space-y-2">
          <Label htmlFor="lead">Selecionar Lead/Cliente *</Label>
          <Select value={leadId} onValueChange={handleLeadSelectChange}>
            <SelectTrigger id="lead">
              <SelectValue placeholder="Buscar por nome" />
            </SelectTrigger>
            <SelectContent>
              {leads.map((lead) => (
                <SelectItem
                  key={lead.id}
                  value={lead.id}
                >
                  <div className="flex items-center gap-2">
                    <span>{lead.nome_fantasia}</span>
                    {(lead.funil_app ?? 0) >= 5 && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Cliente</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lead selecionado - Exibir info e opções */}
        {returnSelectedLead && (
          <>
            {/* Info do Lead/Cliente */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{returnSelectedLead.nome_fantasia}</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${FUNIL.find(f => f.id === (returnSelectedLead.funil_app ?? 1))?.color || 'bg-blue-500'}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {FUNIL.find(f => f.id === (returnSelectedLead.funil_app ?? 1))?.label || 'Prospecção'}
                  </span>
                </div>
              </div>
              {returnSelectedLead.endereco_cidade && (
                <p className="text-xs text-muted-foreground">
                  {returnSelectedLead.endereco_cidade}{returnSelectedLead.endereco_estado ? ` - ${returnSelectedLead.endereco_estado}` : ''}
                </p>
              )}

              {/* Botão Visualizar Perfil */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setShowProfileSheet(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Perfil
              </Button>
            </div>

            {/* Se NÃO é cliente (funil_app < 5): Continuar Cadastro */}
            {!isCliente && proximaAcao && (
              <div className="space-y-4">
                {/* Botão principal: Continuar Cadastro */}
                <button
                  onClick={handleContinuarCadastro}
                  className="w-full p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Continuar Cadastro</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Próxima etapa: <span className="font-medium text-primary">{proximaAcao.label}</span>
                      </p>
                    </div>
                  </div>
                </button>

                {/* Divisor */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground">ou apenas registrar visita</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                {/* Registro simples de visita */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  {/* Observação */}
                  <div className="space-y-2">
                    <Label htmlFor="observacaoReturn">Observação</Label>
                    <Textarea
                      id="observacaoReturn"
                      placeholder="Ex: Cliente não disponível, retornar amanhã..."
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Nova Fase (opcional para registro simples) */}
                  {/* <div className="space-y-2">
                    <Label htmlFor="novaFase">Atualizar fase (opcional)</Label>
                    <Select value={novaFase} onValueChange={setNovaFase}>
                      <SelectTrigger id="novaFase">
                        <SelectValue placeholder="Manter fase atual" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFases.map((fase) => (
                          <SelectItem key={fase.id} value={fase.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${fase.color}`} />
                              {fase.label}
                              {fase.id === (returnSelectedLead.funil_app ?? 0) && " (atual)"}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleReturnSubmit}
                    disabled={loading}
                  >
                    {loading ? "Salvando..." : "Registrar Visita Simples"}
                  </Button>
                </div>
              </div>
            )}

            {/* Se É cliente (funil_app = 5): Tipos de Visita */}
            {isCliente && (
              <div className="space-y-4">
                <Label>Tipo de Visita</Label>

                <div className="grid grid-cols-2 gap-3">
                  {TIPOS_VISITA_CLIENTE.map((tipo) => {
                    const Icon = tipo.icon;
                    const isSelected = tipoVisitaCliente === tipo.value;
                    return (
                      <button
                        key={tipo.value}
                        onClick={() => setTipoVisitaCliente(tipo.value)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected
                          ? `${tipo.bgColor} border-current`
                          : 'border-border hover:border-muted-foreground/50 bg-background'
                          }`}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          <Icon className={`h-6 w-6 ${isSelected ? tipo.color : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {tipo.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Observação */}
                <div className="space-y-2">
                  <Label htmlFor="observacaoCliente">Observação</Label>
                  <Textarea
                    id="observacaoCliente"
                    placeholder="Adicione observações sobre a visita..."
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Data e Hora */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {new Date(dateVisit).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{timeVisit}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  className="w-full h-12 gradient-dark text-white border-0"
                  onClick={handleVisitaCliente}
                  disabled={loading || !tipoVisitaCliente}
                >
                  {loading ? "Salvando..." : (
                    <>
                      <Check className="h-5 w-5 mr-2 text-primary" />
                      Registrar Visita
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Mensagem quando nenhum lead está selecionado */}
        {!returnSelectedLead && (
          <div className="text-center py-8 text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Selecione um lead ou cliente para continuar</p>
          </div>
        )}
      </div>
    );
  };

  const renderCredenciamentoForm = () => (
    <CredenciamentoForm
      selectedLead={selectedLead || null}
      onBack={handleBack}
      onSuccess={() => onLeadSaved?.()}
      onClose={() => onOpenChange(false)}
      directToDocuments={directAction === "finalizar_credenciamento"}
      onRegisterVisit={registerVisitLog}
    />
  );

  const getSheetTitle = () => {
    switch (step) {
      case "prospeccao":
        return "Prospecção";
      case "qualificacao":
        return "Qualificação";
      case "negociacao":
        return "Negociação";
      case "precificacao":
        return "Precificação";
      case "credenciamento":
        return "Credenciamento";
      case "return-visit":
        return "Retorno";
      default:
        return "Lançar Visita";
    }
  };

  const getSheetDescription = () => {
    switch (step) {
      case "prospeccao":
        return "Registre o primeiro contato com o estabelecimento";
      case "qualificacao":
        return "Preencha os dados do negócio para qualificação";
      case "negociacao":
        return "Defina as condições comerciais da negociação";
      case "precificacao":
        return "Defina as taxas por bandeira para a proposta";
      case "credenciamento":
        return "Confirme o envio de documentos para credenciamento";
      case "return-visit":
        return "Registre uma visita de retorno a um lead existente";
      default:
        return "Este é um novo cliente ou um retorno?";
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {getSheetTitle()}
            </SheetTitle>
            <SheetDescription>
              {getSheetDescription()}
            </SheetDescription>
          </SheetHeader>

          {step === "select-type" && renderTypeSelector()}
          {step === "prospeccao" && renderProspeccaoForm()}
          {step === "qualificacao" && renderQualificacaoForm()}
          {step === "negociacao" && renderNegociacaoForm()}
          {step === "precificacao" && renderPrecificacaoForm()}
          {step === "credenciamento" && renderCredenciamentoForm()}
          {step === "return-visit" && renderReturnForm()}
        </SheetContent>
      </Sheet>

      {/* Location Discrepancy Alert */}
      <AlertDialog open={showLocationAlert} onOpenChange={setShowLocationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Localização Distante
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sua localização está a {locationDistance}m do endereço da loja. Confirmar registro mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLocationAlertConfirm}>
              Confirmar Mesmo Assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Incomplete Data Alert */}
      <AlertDialog open={showIncompleteAlert} onOpenChange={setShowIncompleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Dados Incompletos
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dados incompletos para Qualificação. Deseja salvar como Prospecção?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSalvarComoProspeccao}>
              Salvar como Prospecção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reminder Confirmation Dialog */}
      <ReminderConfirmationDialog
        open={showReminderConfirmation}
        onOpenChange={setShowReminderConfirmation}
        leadName={savedLeadName}
        onConfirm={handleReminderConfirm}
        onCancel={handleReminderCancel}
      />

      {/* Reminder Form */}
      <ReminderForm
        open={showReminderForm}
        onOpenChange={handleReminderFormClose}
        leadName={savedLeadName}
        onSubmit={handleReminderSubmit}
        loading={reminderLoading}
      />

      {/* Lead Profile Sheet */}
      <LeadDetailSheet
        lead={returnSelectedLead}
        open={showProfileSheet}
        onOpenChange={setShowProfileSheet}
        onContinuarCadastro={(lead, action) => {
          setShowProfileSheet(false);
          handleContinuarCadastro();
        }}
        onEditar={(lead, action) => {
          setShowProfileSheet(false);
          // Navigate to the edit step based on action
          if (action === "prospeccao") setStep("prospeccao");
          else if (action === "qualificacao") setStep("qualificacao");
          else if (action === "negociacao") setStep("negociacao");
          else if (action === "precificacao") setStep("precificacao");
        }}
      />
    </>
  );
}
