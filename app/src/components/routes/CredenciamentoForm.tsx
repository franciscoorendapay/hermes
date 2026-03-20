import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  Building2,
  User,
  Landmark,
  ChevronRight,
  FileText,
  Upload,
  X,
  Clock,
  Lock,
  AlertTriangle
} from "lucide-react";
import type { Lead } from "@/hooks/useLeads";
import { toast } from "sonner";
// import { supabase } from "@/integrations/supabase/client"; -> unused
import { leadsService } from "@/features/leads/leads.service";
import { accreditationsService } from "@/features/accreditations/accreditations.service";
import { adaptAppToLeadApi } from "@/features/leads/leads.adapter";
import { uploadService } from "@/shared/api/upload.service";
import { useAuth } from "@/hooks/useAuth";
import {
  formatPhone,
  formatCpfCnpjInput,
  formatCep,
  formatAgencia,
  formatContaNumero,
  formatDigito,
  formatDateInput,
  parseDateInput,
  formatDateToDisplay
} from "@/lib/formatters";
import { validateCpfCnpj } from "@/lib/validators";
import { useGeolocation } from "@/hooks/useGeolocation";
import { BANCOS_BRASIL, TIPOS_CONTA } from "@/constants/bancos";
import { cn } from "@/lib/utils";

const ESTADOS_UF = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

interface CredenciamentoFormProps {
  selectedLead: Lead | null;
  onBack: () => void;
  onSuccess: () => void;
  onClose: () => void;
  directToDocuments?: boolean; // Ir direto para seção de documentos
  onRegisterVisit?: (leadId: string, tipo: string, status: string, obs?: string) => Promise<void>;
}

interface DocumentUploadProps {
  label: string;
  file: File | null;
  existingUrl: string | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
}

// Helper functions to detect credentialing type
function isCpfCredenciamento(doc: string | null): boolean {
  if (!doc) return false;
  const digitsOnly = doc.replace(/\D/g, '');
  return digitsOnly.length === 11;
}

function isCnpjCredenciamento(doc: string | null): boolean {
  if (!doc) return false;
  const digitsOnly = doc.replace(/\D/g, '');
  return digitsOnly.length === 14;
}

function DocumentUpload({ label, file, existingUrl, onFileChange, required }: DocumentUploadProps) {
  const hasFile = file || existingUrl;

  return (
    <div className={cn(
      "flex items-center justify-between p-3 border rounded-lg transition-colors",
      hasFile ? "border-green-300 bg-green-50" : "border-border"
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileText className={cn("h-5 w-5 flex-shrink-0", hasFile ? "text-green-600" : "text-muted-foreground")} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {label} {required && <span className="text-red-500">*</span>}
          </p>
          {file && <p className="text-xs text-green-600 truncate">{file.name}</p>}
          {!file && existingUrl && <p className="text-xs text-blue-600">Já enviado</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {file && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700"
            onClick={() => onFileChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null;
              if (selectedFile && selectedFile.size > 3 * 1024 * 1024) {
                toast.error('Arquivo excede o limite de 3MB');
                e.target.value = '';
                return;
              }
              onFileChange(selectedFile);
            }}
          />
          <Button variant="outline" size="sm" asChild>
            <span>{hasFile ? 'Trocar' : 'Selecionar'}</span>
          </Button>
        </label>
      </div>
    </div>
  );
}

export function CredenciamentoForm({
  selectedLead,
  onBack,
  onSuccess,
  onClose,
  directToDocuments = false,
  onRegisterVisit,
}: CredenciamentoFormProps) {
  const geolocation = useGeolocation();
  const auth = useAuth();

  // Verificar se o lead já está credenciado (bloqueado para edição)
  const isCredenciado = selectedLead?.funil_app === 5 && selectedLead?.credenciado === 1;

  // Se já está credenciado, mostrar tela de bloqueio
  if (isCredenciado) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <Lock className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="font-semibold text-lg">Cliente já Credenciado</h3>
        <p className="text-muted-foreground">
          Este cliente já foi credenciado e suas informações não podem ser editadas.
        </p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }
  const [loading, setLoading] = useState(false);
  const [openSection, setOpenSection] = useState<string>("estabelecimento");

  // Seção 1: Dados do Estabelecimento
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cpfCnpjError, setCpfCnpjError] = useState<string | null>(null);
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cep, setCep] = useState("");
  const [cepError, setCepError] = useState<string | null>(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [complemento, setComplemento] = useState("");
  const [lat, setLat] = useState<string | null>(null);
  const [lng, setLng] = useState<string | null>(null);
  const [estabelecimentoConfirmed, setEstabelecimentoConfirmed] = useState(false);

  // Seção 2: Dados do Responsável
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelCpf, setResponsavelCpf] = useState("");
  const [responsavelCpfError, setResponsavelCpfError] = useState<string | null>(null);
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>(undefined);
  const [dataNascimentoStr, setDataNascimentoStr] = useState("");
  const [dataAbertura, setDataAbertura] = useState<Date | undefined>(undefined);
  const [dataAberturaStr, setDataAberturaStr] = useState("");
  const [responsavelConfirmed, setResponsavelConfirmed] = useState(false);

  // Seção 3: Dados Bancários
  const [bancoNome, setBancoNome] = useState("");
  const [bancoCodigo, setBancoCodigo] = useState("");
  const [contaTipo, setContaTipo] = useState("");
  const [contaOperacao, setContaOperacao] = useState("");
  const [agencia, setAgencia] = useState("");
  const [agenciaDigito, setAgenciaDigito] = useState("");
  const [contaNumero, setContaNumero] = useState("");
  const [contaDigito, setContaDigito] = useState("");

  // Observação final
  const [observacao, setObservacao] = useState("");

  // Seção 4: Documentos
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [docCnpj, setDocCnpj] = useState<File | null>(null);
  const [docFoto, setDocFoto] = useState<File | null>(null);
  const [docResidencia, setDocResidencia] = useState<File | null>(null);
  const [docAtividade, setDocAtividade] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // URLs existentes (carregadas do banco)
  const [docCnpjUrl, setDocCnpjUrl] = useState<string | null>(null);
  const [docFotoUrl, setDocFotoUrl] = useState<string | null>(null);
  const [docResidenciaUrl, setDocResidenciaUrl] = useState<string | null>(null);
  const [docAtividadeUrl, setDocAtividadeUrl] = useState<string | null>(null);
  const [documentosPendentes, setDocumentosPendentes] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handler para campos de data
  const handleDateChange = (
    value: string,
    setStr: (s: string) => void,
    setDate: (d: Date | undefined) => void
  ) => {
    const formatted = formatDateInput(value);
    setStr(formatted);
    const parsed = parseDateInput(formatted);
    setDate(parsed || undefined);
  };

  // Pre-fill data from lead
  useEffect(() => {
    if (selectedLead) {
      setRazaoSocial(selectedLead.razao_social || "");
      setNomeFantasia(selectedLead.nome_fantasia || "");
      setCpfCnpj(selectedLead.doc ? formatCpfCnpjInput(selectedLead.doc) : "");
      setTelefone(selectedLead.telefone ? formatPhone(selectedLead.telefone) : "");
      setEmail(selectedLead.email || "");
      setCep(selectedLead.endereco_cep ? formatCep(selectedLead.endereco_cep) : "");
      setLogradouro(selectedLead.endereco_logradouro || "");
      setNumero(selectedLead.endereco_numero || "");
      setBairro(selectedLead.endereco_bairro || "");
      setCidade(selectedLead.endereco_cidade || "");
      setUf(selectedLead.endereco_estado || "");
      setLat(selectedLead.lat || null);
      setLng(selectedLead.lng || null);
      setObservacao(selectedLead.observacao || "");

      // Fetch existing credenciamento data from API
      accreditationsService.getByLeadId(selectedLead.id)
        .then((data) => {
          if (data) {
            setResponsavelNome(data.responsibleName || "");
            setResponsavelCpf(data.responsibleCpf ? formatCpfCnpjInput(data.responsibleCpf) : "");

            if (data.responsibleBirthDate) {
              const date = new Date(data.responsibleBirthDate);
              setDataNascimento(date);
              setDataNascimentoStr(formatDateToDisplay(date));
            }
            if (data.companyOpeningDate) {
              const date = new Date(data.companyOpeningDate);
              setDataAbertura(date);
              setDataAberturaStr(formatDateToDisplay(date));
            }

            setBancoNome(data.bankName || "");
            setBancoCodigo(data.bankCode || "");
            setContaTipo(data.accountType || "");
            setContaOperacao(data.accountOperation || "");
            setAgencia(data.bankBranch || "");
            setAgenciaDigito(data.bankBranchDigit || "");
            setContaNumero(data.bankAccount || "");
            setContaDigito(data.bankAccountDigit || "");

            // Load document URLs
            setDocCnpjUrl(data.docCnpjUrl || null);
            setDocFotoUrl(data.docPhotoUrl || null);
            setDocResidenciaUrl(data.docResidenceUrl || null);
            setDocAtividadeUrl(data.docActivityUrl || null);

            // Check if docs are pending (simple check of URLs)
            const hasAllDocs = !!(data.docCnpjUrl && data.docPhotoUrl && data.docResidenceUrl && data.docActivityUrl);
            setDocumentosPendentes(!hasAllDocs);

            // Se directToDocuments, ir direto para seção de documentos
            if (directToDocuments && !hasAllDocs) {
              setShowDocumentos(true);
              setOpenSection("documentos");
              setEstabelecimentoConfirmed(true);
              setResponsavelConfirmed(true);
            }
          }
        })
        .catch(console.error);
    }
  }, [selectedLead, directToDocuments]);

  // CEP lookup
  const buscarCep = async (cepValue: string) => {
    const cepLimpo = cepValue.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      setCepError("CEP deve ter 8 dígitos");
      return;
    }

    setBuscandoCep(true);
    setCepError(null);

    try {
      // Use local proxy to Google Geocoding API
      // We use the custom axios instance (http) or fetch to our API
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = baseUrl.endsWith('/api') ? `${baseUrl}/geocode` : `${baseUrl}/api/geocode`;
      const response = await fetch(`${url}?cep=${cepLimpo}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.[0]) {
        throw new Error('CEP não encontrado no Google Maps');
      }

      const result = data.results[0];
      const components = result.address_components;

      // Helper to find component
      const getComp = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || "";
      const getShort = (type: string) => components.find((c: any) => c.types.includes(type))?.short_name || "";

      setLogradouro(getComp('route'));
      setBairro(getComp('sublocality') || getComp('sublocality_level_1'));
      setCidade(getComp('administrative_area_level_2'));
      setUf(getShort('administrative_area_level_1'));

      // Coordinates
      if (result.geometry?.location) {
        const newLat = String(result.geometry.location.lat);
        const newLng = String(result.geometry.location.lng);
        setLat(newLat);
        setLng(newLng);
      }

      toast.success("Endereço encontrado (Google Maps)!");
    } catch (error) {
      setCepError("CEP não encontrado");
      console.error(error);
      // Fallback or retry?
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    setCepError(null);

    const cepLimpo = value.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      buscarCep(cepLimpo);
    }
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

  const handleResponsavelCpfChange = (value: string) => {
    const formatted = formatCpfCnpjInput(value);
    setResponsavelCpf(formatted);

    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      const validation = validateCpfCnpj(cleaned);
      if (!validation.valid) {
        setResponsavelCpfError('CPF inválido');
      } else {
        setResponsavelCpfError(null);
      }
    } else {
      setResponsavelCpfError(null);
    }
  };

  const handleBancoChange = (bancoNome: string) => {
    const banco = BANCOS_BRASIL.find(b => b.nome === bancoNome);
    setBancoNome(bancoNome);
    setBancoCodigo(banco?.codigo || "");
  };

  // Contadores de campos
  const countEstabelecimentoFields = (): { filled: number; total: number } => {
    const fields = [razaoSocial, nomeFantasia, cpfCnpj, telefone, email, cep, logradouro, numero, bairro, cidade, uf];
    const filled = fields.filter(f => f?.trim()).length;
    return { filled, total: 11 };
  };

  const countResponsavelFields = (): { filled: number; total: number } => {
    const fields = [responsavelNome, responsavelCpf];
    let filled = fields.filter(f => f?.trim()).length;
    if (dataNascimento) filled++;
    if (dataAbertura) filled++;
    return { filled, total: 4 };
  };

  const countBancarioFields = (): { filled: number; total: number } => {
    const fields = [bancoNome, contaTipo, agencia, contaNumero];
    const filled = fields.filter(f => f?.trim()).length;
    return { filled, total: 4 };
  };

  const countDocumentosFields = (): { filled: number; total: number } => {
    const isCpf = isCpfCredenciamento(selectedLead?.doc);
    const isCnpj = isCnpjCredenciamento(selectedLead?.doc);

    let filled = 0;

    if (isCnpj) {
      // CNPJ requires 4 documents: CNPJ doc, address proof, photo ID, activity proof
      if (docCnpj || docCnpjUrl) filled++;
      if (docResidencia || docResidenciaUrl) filled++;
      if (docFoto || docFotoUrl) filled++;
      if (docAtividade || docAtividadeUrl) filled++;
      return { filled, total: 4 };
    } else if (isCpf) {
      // CPF requires 3 documents: photo ID, address proof, activity proof
      if (docFoto || docFotoUrl) filled++;
      if (docResidencia || docResidenciaUrl) filled++;
      if (docAtividade || docAtividadeUrl) filled++;
      return { filled, total: 3 };
    }

    // Fallback if no doc type detected
    return { filled: 0, total: 0 };
  };

  // Validações
  const validateEstabelecimento = (): boolean => {
    if (!razaoSocial.trim()) { toast.error("Preencha a Razão Social"); return false; }
    if (!nomeFantasia.trim()) { toast.error("Preencha o Nome Fantasia"); return false; }
    const docCleaned = cpfCnpj.replace(/\D/g, '');
    if (docCleaned.length !== 11 && docCleaned.length !== 14) {
      toast.error("Preencha um CPF ou CNPJ válido"); return false;
    }
    const validation = validateCpfCnpj(docCleaned);
    if (!validation.valid) {
      toast.error(validation.type === 'cpf' ? 'CPF inválido' : 'CNPJ inválido'); return false;
    }
    if (!telefone.trim()) { toast.error("Preencha o Telefone"); return false; }
    if (!email.trim()) { toast.error("Preencha o Email"); return false; }
    if (!cep.trim()) { toast.error("Preencha o CEP"); return false; }
    if (!logradouro.trim()) { toast.error("Preencha o Logradouro"); return false; }
    if (!numero.trim()) { toast.error("Preencha o Número"); return false; }
    if (!bairro.trim()) { toast.error("Preencha o Bairro"); return false; }
    if (!cidade.trim()) { toast.error("Preencha a Cidade"); return false; }
    if (!uf.trim()) { toast.error("Preencha o Estado (UF)"); return false; }
    return true;
  };

  const validateResponsavel = (): boolean => {
    if (!responsavelNome.trim()) { toast.error("Preencha o Nome do Responsável"); return false; }
    const cpfCleaned = responsavelCpf.replace(/\D/g, '');
    if (cpfCleaned.length !== 11) {
      toast.error("Preencha um CPF válido para o Responsável"); return false;
    }
    const validation = validateCpfCnpj(cpfCleaned);
    if (!validation.valid) {
      toast.error("CPF do Responsável inválido"); return false;
    }
    if (!dataNascimento) { toast.error("Preencha a Data de Nascimento"); return false; }
    if (!dataAbertura) { toast.error("Preencha a Data de Abertura da Empresa"); return false; }
    return true;
  };

  const validateBancario = (): boolean => {
    if (!bancoNome.trim()) { toast.error("Selecione o Banco"); return false; }
    if (!contaTipo.trim()) { toast.error("Selecione o Tipo de Conta"); return false; }
    if (!agencia.trim()) { toast.error("Preencha a Agência"); return false; }
    if (!contaNumero.trim()) { toast.error("Preencha o Número da Conta"); return false; }
    return true;
  };

  const handleConfirmEstabelecimento = () => {
    if (validateEstabelecimento()) {
      setEstabelecimentoConfirmed(true);
      setOpenSection("responsavel");
    }
  };

  const handleConfirmResponsavel = () => {
    if (validateResponsavel()) {
      setResponsavelConfirmed(true);
      setOpenSection("bancario");
    }
  };

  const handleSalvarEEnviarDocumentos = async () => {
    if (!validateEstabelecimento()) { setOpenSection("estabelecimento"); return; }
    if (!validateResponsavel()) { setOpenSection("responsavel"); return; }
    if (!validateBancario()) { setOpenSection("bancario"); return; }

    if (!selectedLead) {
      toast.error("Lead não selecionado");
      return;
    }

    setLoading(true);

    try {
      if (!auth.user) {
        toast.error("Usuário não autenticado");
        setLoading(false);
        return;
      }

      // 1. Update lead data (não marca como credenciado ainda)
      // Só atualiza funil_app e credenciado se não estiver credenciado
      const leadUpdateData: Partial<Lead> = {
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia,
        doc: cpfCnpj.replace(/\D/g, ''),
        telefone: telefone.replace(/\D/g, ''),
        email: email,
        endereco_cep: cep,
        endereco_logradouro: logradouro,
        endereco_numero: numero,
        endereco_bairro: bairro,
        endereco_cidade: cidade,
        endereco_estado: uf,
        lat: lat || selectedLead.lat,
        lng: lng || selectedLead.lng,
        observacao: observacao,
        updated_at: new Date().toISOString(),
      };

      // Só define funil e credenciado se NÃO estiver já credenciado
      if (selectedLead.funil_app !== 5 || selectedLead.credenciado !== 1) {
        leadUpdateData.funil_app = 7; // Cred. Pendente (aguardando docs)
        leadUpdateData.credenciado = 0;
      }

      const apiData = adaptAppToLeadApi({ ...selectedLead, ...leadUpdateData });
      await leadsService.update(selectedLead.id, apiData);

      const accreditationPayload = {
        lead: `/api/leads/${selectedLead.id}`, // Sending IRI format often helps with API Platform/Symfony Serializer if simple ID fails
        user: `/api/users/${auth.user?.id}`,
        responsibleName: responsavelNome,
        responsibleCpf: responsavelCpf.replace(/\D/g, ''),
        responsibleBirthDate: dataNascimento?.toISOString().split('T')[0] || null,
        companyOpeningDate: dataAbertura?.toISOString().split('T')[0] || null,
        bankName: bancoNome,
        bankCode: bancoCodigo,
        accountType: contaTipo,
        accountOperation: contaOperacao || null,
        bankBranch: agencia,
        bankBranchDigit: agenciaDigito || null,
        bankAccount: contaNumero,
        bankAccountDigit: contaDigito || null,
        pendingDocuments: "true"
      };

      // Tenta buscar existente para decidir entre update ou create
      // NOTE: Isso pode ser otimizado no futuro com um endpoint específico de busca ou 'upsert'
      const existing = await accreditationsService.getByLeadId(selectedLead.id);

      if (existing && existing.id) {
        // Enviar apenas campos de dados (exceto lead/user que não mudam)
        const { lead, user, ...updatePayload } = accreditationPayload;
        await accreditationsService.update(existing.id, updatePayload);
      } else {
        // Para CREATE, enviamos payload completo.
        // Se falhar com IRI, tentaremos enviar objeto { id: ... } em uma próxima iteração de correção
        await accreditationsService.create(accreditationPayload);
      }

      toast.success("Dados salvos com sucesso!", {
        description: "Agora envie os documentos obrigatórios."
      });

      // Registrar visita de credenciamento pendente
      if (onRegisterVisit) {
        await onRegisterVisit(selectedLead.id, "credenciamento", "concluida", "Dados salvos, documentos pendentes");
      }

      // Mostrar seção de documentos
      setShowDocumentos(true);
      setOpenSection("documentos");

    } catch (error) {
      toast.error("Erro ao salvar dados");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocumentos = async () => {
    if (!selectedLead) return;

    // Verificar se todos os documentos foram selecionados baseado no tipo
    const isCpf = isCpfCredenciamento(selectedLead.doc);
    const isCnpj = isCnpjCredenciamento(selectedLead.doc);

    let hasAllDocs = false;

    if (isCnpj) {
      // CNPJ requires: CNPJ doc, address, photo, activity
      hasAllDocs =
        !!(docCnpj || docCnpjUrl) &&
        !!(docResidencia || docResidenciaUrl) &&
        !!(docFoto || docFotoUrl) &&
        !!(docAtividade || docAtividadeUrl);
    } else if (isCpf) {
      // CPF requires: photo, address, activity
      hasAllDocs =
        !!(docFoto || docFotoUrl) &&
        !!(docResidencia || docResidenciaUrl) &&
        !!(docAtividade || docAtividadeUrl);
    }

    if (!hasAllDocs) {
      toast.error("Todos os documentos são obrigatórios");
      return;
    }

    setUploadingDocs(true);
    setSubmitError(null);

    try {
      if (!auth.user) throw new Error("Não autenticado");

      const uploadFile = async (file: File | null, tipo: string): Promise<string | null> => {
        if (!file || !auth.user) return null;
        try {
          const response = await uploadService.upload(file);
          // Return the full URL for the frontend/API to use
          // Assuming the API returns a relative path like /uploads/filename
          // We might need the full URL if accreditation service expects it, or just path.
          // Entity says "url", so let's store what API gives.
          // To be safe, let's prepend API URL if needed, but usually storage returns full usable URL or path.
          return response.url;
        } catch (error) {
          console.error(`Erro ao fazer upload de ${tipo}:`, error);
          throw error;
        }
      };

      const cnpjPath = await uploadFile(docCnpj, 'cnpj');
      const fotoPath = await uploadFile(docFoto, 'foto');
      const residenciaPath = await uploadFile(docResidencia, 'residencia');
      const atividadePath = await uploadFile(docAtividade, 'atividade');

      // Buscar ID do credenciamento para atualizar via API
      const existing = await accreditationsService.getByLeadId(selectedLead.id);

      if (!existing || !existing.id) {
        throw new Error("Credenciamento não encontrado para atualização de documentos");
      }

      await accreditationsService.update(existing.id, {
        docCnpjUrl: cnpjPath || docCnpjUrl,
        docPhotoUrl: fotoPath || docFotoUrl,
        docResidenceUrl: residenciaPath || docResidenciaUrl,
        docActivityUrl: atividadePath || docAtividadeUrl,
        pendingDocuments: "false"
      });

      // Atualizar lead como em análise (Status 9)
      const leadUpdateData: Partial<Lead> = {
        funil_app: 9,
        credenciado: 0,
      };

      const apiData = adaptAppToLeadApi({ ...selectedLead, ...leadUpdateData });
      await leadsService.update(selectedLead.id, apiData);

      // Registrar visita de envio para análise
      if (onRegisterVisit) {
        await onRegisterVisit(selectedLead.id, "credenciamento", "concluida", "Documentos enviados para análise");
      }

      // Enviar para análise automaticamente após upload dos documentos
      await accreditationsService.submit(existing.id);

      toast.success("Credenciamento enviado para processamento!", {
        description: `${nomeFantasia} agora está sendo processado pela adquirente.`
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      // Extract API error message for persistent display
      const apiErrorMsg = error?.response?.data?.error 
        || error?.response?.data?.message 
        || error?.response?.data?.msg
        || error?.message
        || 'Erro desconhecido ao enviar documentos/análise';

      setSubmitError(apiErrorMsg);
      console.error(error);
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleFinalizarDepois = () => {
    toast.info("Dados salvos! Documentos pendentes.", {
      description: "Você pode enviar os documentos depois."
    });
    onSuccess();
    onClose();
  };

  const estabelecimentoCount = countEstabelecimentoFields();
  const responsavelCount = countResponsavelFields();
  const bancarioCount = countBancarioFields();
  const documentosCount = countDocumentosFields();

  return (
    <div className="space-y-4 mt-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="h-3 w-3 rounded-full bg-green-500" />
        <span className="text-sm font-medium text-green-700">Formulário de Credenciamento</span>
      </div>

      <Accordion
        type="single"
        collapsible
        value={openSection}
        onValueChange={setOpenSection}
        className="space-y-3"
      >
        {/* Seção 1: Dados do Estabelecimento */}
        <AccordionItem value="estabelecimento" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Dados do Estabelecimento</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {estabelecimentoConfirmed ? "✓ Confirmado" : `${estabelecimentoCount.filled}/${estabelecimentoCount.total}`}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {/* Razão Social */}
            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social *</Label>
              <Input
                id="razaoSocial"
                placeholder="Razão Social da empresa"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
              />
            </div>

            {/* Nome Fantasia */}
            <div className="space-y-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
              <Input
                id="nomeFantasia"
                placeholder="Nome fantasia"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
              />
            </div>

            {/* CPF/CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF ou CNPJ *</Label>
              <Input
                id="cpfCnpj"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={cpfCnpj}
                onChange={(e) => handleCpfCnpjChange(e.target.value)}
                className={cpfCnpjError ? "border-red-500" : ""}
                maxLength={18}
              />
              {cpfCnpjError && <p className="text-xs text-red-500">{cpfCnpjError}</p>}
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                maxLength={15}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* CEP */}
            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <div className="relative">
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  className={cepError ? "border-red-500" : ""}
                  maxLength={9}
                />
                {buscandoCep && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {cepError && <p className="text-xs text-red-500">{cepError}</p>}
            </div>

            {/* Logradouro */}
            <div className="space-y-2">
              <Label htmlFor="logradouro">Logradouro *</Label>
              <Input
                id="logradouro"
                placeholder="Rua, Avenida, etc."
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
              />
            </div>

            {/* Número e Complemento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  placeholder="Nº"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  placeholder="Apto, Sala, etc."
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                />
              </div>
            </div>

            {/* Bairro */}
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                placeholder="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>

            {/* Cidade e UF */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF *</Label>
                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger id="uf">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_UF.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleConfirmEstabelecimento}
              className="w-full mt-4"
            >
              Confirmar e Continuar
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 2: Dados do Responsável */}
        <AccordionItem value="responsavel" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">Dados do Responsável</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {responsavelConfirmed ? "✓ Confirmado" : `${responsavelCount.filled}/${responsavelCount.total}`}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {/* Nome do Responsável */}
            <div className="space-y-2">
              <Label htmlFor="responsavelNome">Nome Completo do Responsável *</Label>
              <Input
                id="responsavelNome"
                placeholder="Nome completo"
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
              />
            </div>

            {/* CPF do Responsável */}
            <div className="space-y-2">
              <Label htmlFor="responsavelCpf">CPF do Responsável *</Label>
              <Input
                id="responsavelCpf"
                placeholder="000.000.000-00"
                value={responsavelCpf}
                onChange={(e) => handleResponsavelCpfChange(e.target.value)}
                className={responsavelCpfError ? "border-red-500" : ""}
                maxLength={14}
              />
              {responsavelCpfError && <p className="text-xs text-red-500">{responsavelCpfError}</p>}
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
              <Input
                id="dataNascimento"
                placeholder="DD/MM/AAAA"
                value={dataNascimentoStr}
                onChange={(e) => handleDateChange(e.target.value, setDataNascimentoStr, setDataNascimento)}
                maxLength={10}
              />
              {dataNascimentoStr.length === 10 && !dataNascimento && (
                <p className="text-xs text-red-500">Data inválida</p>
              )}
            </div>

            {/* Data de Abertura da Empresa */}
            <div className="space-y-2">
              <Label htmlFor="dataAbertura">Data de Abertura da Empresa *</Label>
              <Input
                id="dataAbertura"
                placeholder="DD/MM/AAAA"
                value={dataAberturaStr}
                onChange={(e) => handleDateChange(e.target.value, setDataAberturaStr, setDataAbertura)}
                maxLength={10}
              />
              {dataAberturaStr.length === 10 && !dataAbertura && (
                <p className="text-xs text-red-500">Data inválida</p>
              )}
            </div>

            <Button
              onClick={handleConfirmResponsavel}
              className="w-full mt-4"
            >
              Confirmar e Continuar
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 3: Dados Bancários */}
        <AccordionItem value="bancario" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                <span className="font-medium">Dados Bancários</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {bancarioCount.filled}/{bancarioCount.total}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {/* Banco */}
            <div className="space-y-2">
              <Label htmlFor="banco">Nome do Banco *</Label>
              <Select value={bancoNome} onValueChange={handleBancoChange}>
                <SelectTrigger id="banco">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {BANCOS_BRASIL.map((banco) => (
                    <SelectItem key={banco.codigo} value={banco.nome}>
                      {banco.codigo} - {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Conta */}
            <div className="space-y-2">
              <Label htmlFor="contaTipo">Tipo de Conta *</Label>
              <Select value={contaTipo} onValueChange={setContaTipo}>
                <SelectTrigger id="contaTipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONTA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operação */}
            <div className="space-y-2">
              <Label htmlFor="contaOperacao">Operação (opcional)</Label>
              <Input
                id="contaOperacao"
                placeholder="Ex: 001, 013"
                value={contaOperacao}
                onChange={(e) => setContaOperacao(e.target.value)}
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">Algumas instituições solicitam este campo</p>
            </div>

            {/* Agência */}
            <div className="space-y-2">
              <Label>Agência *</Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="0000"
                  value={agencia}
                  onChange={(e) => setAgencia(formatAgencia(e.target.value))}
                  className="col-span-3"
                  maxLength={4}
                />
                <Input
                  placeholder="Dígito"
                  value={agenciaDigito}
                  onChange={(e) => setAgenciaDigito(formatDigito(e.target.value))}
                  maxLength={1}
                />
              </div>
            </div>

            {/* Conta */}
            <div className="space-y-2">
              <Label>Número da Conta *</Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Número da conta"
                  value={contaNumero}
                  onChange={(e) => setContaNumero(formatContaNumero(e.target.value))}
                  className="col-span-3"
                  maxLength={12}
                />
                <Input
                  placeholder="Dígito"
                  value={contaDigito}
                  onChange={(e) => setContaDigito(formatDigito(e.target.value))}
                  maxLength={1}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 4: Documentos (aparece após salvar dados) */}
        {showDocumentos && (
          <AccordionItem value="documentos" className="border rounded-lg px-4 border-orange-300 bg-orange-50/50">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-700">Documentos</span>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  documentosCount.filled === documentosCount.total
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                )}>
                  {documentosCount.filled}/{documentosCount.total}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Envie os documentos obrigatórios para finalizar o credenciamento. Formatos aceitos: PDF, JPG, PNG.
              </p>

              {/* Detect if CPF or CNPJ credentialing */}
              {isCnpjCredenciamento(selectedLead?.doc) && (
                <>
                  <DocumentUpload
                    label="Contrato Social / CNPJ"
                    file={docCnpj}
                    existingUrl={docCnpjUrl}
                    onFileChange={setDocCnpj}
                    required
                  />

                  <DocumentUpload
                    label="Comprovante de Endereço Comercial"
                    file={docResidencia}
                    existingUrl={docResidenciaUrl}
                    onFileChange={setDocResidencia}
                    required
                  />

                  <DocumentUpload
                    label="Documento com Foto do Sócio (CPF/CNH/RG)"
                    file={docFoto}
                    existingUrl={docFotoUrl}
                    onFileChange={setDocFoto}
                    required
                  />

                  <DocumentUpload
                    label="Comprovante de Atividade"
                    file={docAtividade}
                    existingUrl={docAtividadeUrl}
                    onFileChange={setDocAtividade}
                    required
                  />
                </>
              )}

              {isCpfCredenciamento(selectedLead?.doc) && (
                <>
                  <DocumentUpload
                    label="Documento com Foto (CPF/CNH/RG)"
                    file={docFoto}
                    existingUrl={docFotoUrl}
                    onFileChange={setDocFoto}
                    required
                  />

                  <DocumentUpload
                    label="Comprovante de Residência"
                    file={docResidencia}
                    existingUrl={docResidenciaUrl}
                    onFileChange={setDocResidencia}
                    required
                  />

                  <DocumentUpload
                    label="Comprovante de Atividade"
                    file={docAtividade}
                    existingUrl={docAtividadeUrl}
                    onFileChange={setDocAtividade}
                    required
                  />
                </>
              )}

              {!isCpfCredenciamento(selectedLead?.doc) && !isCnpjCredenciamento(selectedLead?.doc) && (
                <div className="text-sm text-amber-600 p-3 bg-amber-50 rounded-lg">
                  ⚠️ CPF/CNPJ não detectado. Por favor, preencha os dados do estabelecimento primeiro.
                </div>
              )}

              {submitError && (
                <div className="flex items-start gap-3 p-4 mt-4 bg-red-50 border border-red-300 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Erro no credenciamento</p>
                    <p className="text-sm text-red-700 mt-1">{submitError}</p>
                  </div>
                  <button
                    onClick={() => setSubmitError(null)}
                    className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleFinalizarDepois}
                  disabled={uploadingDocs}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Finalizar Depois
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleUploadDocumentos}
                  disabled={uploadingDocs}
                >
                  {uploadingDocs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Enviar Documentos
                    </>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Observação Final */}
      <div className="space-y-2 pt-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          placeholder="Observações adicionais sobre o credenciamento..."
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={3}
        />
      </div>

      {/* Botão Final */}
      {!showDocumentos && (
        <Button
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white border-0"
          onClick={handleSalvarEEnviarDocumentos}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Salvar e Enviar Documentos
            </>
          )}
        </Button>
      )}
    </div>
  );
}
