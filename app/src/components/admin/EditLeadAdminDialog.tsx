import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { http } from "@/shared/api/http";
import { toast } from "sonner";
import { formatMoneyInput, parseMoneyInput } from "@/lib/formatters";

interface LeadData {
  id: string;
  name: string;
  tradeName?: string;
  companyName?: string;
  document?: string;
  email?: string;
  phone?: string;
  tpv?: string;
  mcc?: string;
  city?: string;
  state?: string;
  user?: { id: string; name: string } | null;
  // extra fields not in admin/all but available via lead:read
  [key: string]: any;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface EditLeadAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadData | null;
  onSaved: () => void;
}

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function RateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="pr-6 h-8 text-sm"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );
}

export function EditLeadAdminDialog({
  open,
  onOpenChange,
  lead,
  onSaved,
}: EditLeadAdminDialogProps) {
  const [saving, setSaving] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ── Dados Gerais ──────────────────────────────────────────
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tpv, setTpv] = useState("");
  const [mcc, setMcc] = useState("");
  const [segment, setSegment] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [equipmentCount, setEquipmentCount] = useState("");
  const [firstContactName, setFirstContactName] = useState("");
  const [isDecisionMaker, setIsDecisionMaker] = useState(false);
  const [notes, setNotes] = useState("");

  // ── Endereço ──────────────────────────────────────────────
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  // ── Funil / Status ────────────────────────────────────────
  const [selectedUserId, setSelectedUserId] = useState("");
  const [appFunnel, setAppFunnel] = useState("");
  const [accreditation, setAccreditation] = useState("");
  const [accreditationDate, setAccreditationDate] = useState("");
  const [leadCode, setLeadCode] = useState("");

  // ── API / Integração ──────────────────────────────────────
  const [apiId, setApiId] = useState("");
  const [apiToken, setApiToken] = useState("");

  // ── Taxas Gerais ──────────────────────────────────────────
  const [anticipationRate, setAnticipationRate] = useState("");
  const [pixRate, setPixRate] = useState("");
  const [debitShare, setDebitShare] = useState("");
  const [creditShare, setCreditShare] = useState("");
  const [installmentShare, setInstallmentShare] = useState("");
  const [installmentShare712, setInstallmentShare712] = useState("");

  // ── Taxas por Bandeira ────────────────────────────────────
  const [visaDebit, setVisaDebit] = useState("");
  const [visaCredit, setVisaCredit] = useState("");
  const [visaInst2to6, setVisaInst2to6] = useState("");
  const [visaInst7to12, setVisaInst7to12] = useState("");
  const [visaInst13to18, setVisaInst13to18] = useState("");

  const [masterDebit, setMasterDebit] = useState("");
  const [masterCredit, setMasterCredit] = useState("");
  const [masterInst2to6, setMasterInst2to6] = useState("");
  const [masterInst7to12, setMasterInst7to12] = useState("");
  const [masterInst13to18, setMasterInst13to18] = useState("");

  const [eloDebit, setEloDebit] = useState("");
  const [eloCredit, setEloCredit] = useState("");
  const [eloInst2to6, setEloInst2to6] = useState("");
  const [eloInst7to12, setEloInst7to12] = useState("");
  const [eloInst13to18, setEloInst13to18] = useState("");

  const [othersDebit, setOthersDebit] = useState("");
  const [othersCredit, setOthersCredit] = useState("");
  const [othersInst2to6, setOthersInst2to6] = useState("");
  const [othersInst7to12, setOthersInst7to12] = useState("");
  const [othersInst13to18, setOthersInst13to18] = useState("");

  // Load commercial users
  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      http
        .get("/users/commercial")
        .then((res) => setUsers(res.data))
        .catch(() => toast.error("Erro ao carregar usuários"))
        .finally(() => setLoadingUsers(false));
    }
  }, [open]);

  // Fetch full lead data and populate form
  useEffect(() => {
    if (!lead || !open) return;

    setLoadingFull(true);
    http
      .get(`/leads/${lead.id}`)
      .then(({ data: d }) => {
        const s = (v: any) => (v != null ? String(v) : "");
        const money = (v: any) =>
          v ? formatMoneyInput(String(Math.round(parseFloat(v) * 100))) : "";
        const rate = (v: any) => (v != null ? String(parseFloat(v)) : "");
        const isoToDate = (v: any) =>
          v ? v.substring(0, 10) : "";

        setName(d.name || "");
        setTradeName(d.tradeName || "");
        setCompanyName(d.companyName || "");
        setDocument(d.document || "");
        setEmail(d.email || "");
        setPhone(d.phone || "");
        setTpv(money(d.tpv));
        setMcc(d.mcc || "");
        setSegment(d.segment || "");
        setPaymentTerm(d.paymentTerm || "");
        setEquipmentCount(d.equipmentCount != null ? String(d.equipmentCount) : "");
        setFirstContactName(d.firstContactName || "");
        setIsDecisionMaker(!!d.isDecisionMaker);
        setNotes(d.notes || "");

        setZipCode(d.zip_code || d.zipCode || "");
        setStreet(d.street || "");
        setNumber(d.number || "");
        setNeighborhood(d.neighborhood || "");
        setCity(d.city || "");
        setState(d.state || "");
        setLat(d.lat || "");
        setLng(d.lng || "");

        setSelectedUserId(d.user?.id || "");
        setAppFunnel(s(d.appFunnel));
        setAccreditation(s(d.accreditation));
        setAccreditationDate(isoToDate(d.accreditationDate));
        setLeadCode(s(d.leadCode));

        setApiId(d.apiId || "");
        setApiToken(d.apiToken || "");

        setAnticipationRate(rate(d.anticipationRate));
        setPixRate(rate(d.pixRate));
        setDebitShare(rate(d.debitShare));
        setCreditShare(rate(d.creditShare));
        setInstallmentShare(rate(d.installmentShare));
        setInstallmentShare712(rate(d.installmentShare712));

        setVisaDebit(rate(d.visaDebit));
        setVisaCredit(rate(d.visaCredit));
        setVisaInst2to6(rate(d.visaInstallment2to6));
        setVisaInst7to12(rate(d.visaInstallment7to12));
        setVisaInst13to18(rate(d.visaInstallment13to18));

        setMasterDebit(rate(d.masterDebit));
        setMasterCredit(rate(d.masterCredit));
        setMasterInst2to6(rate(d.masterInstallment2to6));
        setMasterInst7to12(rate(d.masterInstallment7to12));
        setMasterInst13to18(rate(d.masterInstallment13to18));

        setEloDebit(rate(d.eloDebit));
        setEloCredit(rate(d.eloCredit));
        setEloInst2to6(rate(d.eloInstallment2to6));
        setEloInst7to12(rate(d.eloInstallment7to12));
        setEloInst13to18(rate(d.eloInstallment13to18));

        setOthersDebit(rate(d.othersDebit));
        setOthersCredit(rate(d.othersCredit));
        setOthersInst2to6(rate(d.othersInstallment2to6));
        setOthersInst7to12(rate(d.othersInstallment7to12));
        setOthersInst13to18(rate(d.othersInstallment13to18));
      })
      .catch(() => toast.error("Erro ao carregar dados do lead"))
      .finally(() => setLoadingFull(false));
  }, [lead, open]);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const nullableRate = (v: string) => (v.trim() !== "" ? parseFloat(v) : null);

      await http.patch(`/leads/${lead.id}`, {
        name,
        tradeName,
        companyName,
        document,
        email,
        phone,
        tpv: tpv ? String(parseMoneyInput(tpv)) : null,
        mcc,
        segment,
        paymentTerm,
        equipmentCount: equipmentCount !== "" ? parseInt(equipmentCount) : null,
        firstContactName,
        isDecisionMaker,
        notes,
        zip_code: zipCode,
        street,
        number,
        neighborhood,
        city,
        state,
        lat,
        lng,
        appFunnel: appFunnel !== "" ? parseInt(appFunnel) : null,
        accreditation: accreditation !== "" ? parseInt(accreditation) : null,
        accreditationDate: accreditationDate || null,
        leadCode: leadCode !== "" ? parseInt(leadCode) : null,
        apiId,
        apiToken,
        anticipationRate: nullableRate(anticipationRate),
        pixRate: nullableRate(pixRate),
        debitShare: nullableRate(debitShare),
        creditShare: nullableRate(creditShare),
        installmentShare: nullableRate(installmentShare),
        installmentShare712: nullableRate(installmentShare712),
        visaDebit: nullableRate(visaDebit),
        visaCredit: nullableRate(visaCredit),
        visaInstallment2to6: nullableRate(visaInst2to6),
        visaInstallment7to12: nullableRate(visaInst7to12),
        visaInstallment13to18: nullableRate(visaInst13to18),
        masterDebit: nullableRate(masterDebit),
        masterCredit: nullableRate(masterCredit),
        masterInstallment2to6: nullableRate(masterInst2to6),
        masterInstallment7to12: nullableRate(masterInst7to12),
        masterInstallment13to18: nullableRate(masterInst13to18),
        eloDebit: nullableRate(eloDebit),
        eloCredit: nullableRate(eloCredit),
        eloInstallment2to6: nullableRate(eloInst2to6),
        eloInstallment7to12: nullableRate(eloInst7to12),
        eloInstallment13to18: nullableRate(eloInst13to18),
        othersDebit: nullableRate(othersDebit),
        othersCredit: nullableRate(othersCredit),
        othersInstallment2to6: nullableRate(othersInst2to6),
        othersInstallment7to12: nullableRate(othersInst7to12),
        othersInstallment13to18: nullableRate(othersInst13to18),
      });

      if (selectedUserId && selectedUserId !== lead.user?.id) {
        await http.put(`/leads/${lead.id}/assign`, { user_id: selectedUserId });
      }

      toast.success("Lead atualizado com sucesso!");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao salvar alterações do lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg">
            Editar Lead
            {lead && <span className="ml-2 text-sm font-normal text-muted-foreground">{lead.tradeName || lead.name}</span>}
          </DialogTitle>
        </DialogHeader>

        {loadingFull ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="geral" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="mx-6 mt-4 mb-0 justify-start h-9 w-auto bg-background border border-border">
              <TabsTrigger value="geral" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dados Gerais</TabsTrigger>
              <TabsTrigger value="endereco" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Endereço</TabsTrigger>
              <TabsTrigger value="funil" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Funil / Status</TabsTrigger>
              <TabsTrigger value="taxas" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Taxas</TabsTrigger>
              <TabsTrigger value="api" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">API</TabsTrigger>
            </TabsList>

            {/* ── DADOS GERAIS ───────────────────────────────── */}
            <TabsContent value="geral" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-0">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Razão Social</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nome Fantasia</Label>
                    <Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Empresa</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CNPJ / CPF</Label>
                    <Input value={document} onChange={(e) => setDocument(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>TPV</Label>
                    <Input
                      value={tpv}
                      onChange={(e) => setTpv(formatMoneyInput(e.target.value))}
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>MCC</Label>
                    <Input value={mcc} onChange={(e) => setMcc(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Segmento</Label>
                    <Input value={segment} onChange={(e) => setSegment(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Prazo de Pagamento</Label>
                    <Input value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Qtd. Equipamentos</Label>
                    <Input type="number" min={0} value={equipmentCount} onChange={(e) => setEquipmentCount(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Primeiro Contato</Label>
                    <Input value={firstContactName} onChange={(e) => setFirstContactName(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <Switch id="decision" checked={isDecisionMaker} onCheckedChange={setIsDecisionMaker} />
                  <Label htmlFor="decision" className="cursor-pointer">Tomador de Decisão</Label>
                </div>

                <div className="space-y-1.5">
                  <Label>Observações</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none" />
                </div>
              </div>
            </TabsContent>

            {/* ── ENDEREÇO ───────────────────────────────────── */}
            <TabsContent value="endereco" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>CEP</Label>
                  <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="00000-000" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Rua / Logradouro</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Número</Label>
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Bairro</Label>
                  <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Cidade</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>UF</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {BR_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Latitude</Label>
                  <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-00.000000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Longitude</Label>
                  <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-00.000000" />
                </div>
              </div>
            </TabsContent>

            {/* ── FUNIL / STATUS ─────────────────────────────── */}
            <TabsContent value="funil" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label className="font-semibold text-primary">Comercial Responsável</Label>
                {loadingUsers ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </div>
                ) : (
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o comercial" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Etapa do Funil</Label>
                  <Select value={appFunnel} onValueChange={setAppFunnel}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 — Prospecção</SelectItem>
                      <SelectItem value="2">2 — Contato</SelectItem>
                      <SelectItem value="3">3 — Negociação</SelectItem>
                      <SelectItem value="4">4 — Proposta</SelectItem>
                      <SelectItem value="5">5 — Credenciado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status Credenciamento</Label>
                  <Select value={accreditation} onValueChange={setAccreditation}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 — Não credenciado</SelectItem>
                      <SelectItem value="1">1 — Credenciado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Data de Credenciamento</Label>
                  <Input
                    type="date"
                    value={accreditationDate}
                    onChange={(e) => setAccreditationDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Código do Lead</Label>
                  <Input
                    type="number"
                    value={leadCode}
                    onChange={(e) => setLeadCode(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ── TAXAS ──────────────────────────────────────── */}
            <TabsContent value="taxas" className="flex-1 overflow-y-auto px-6 py-4 space-y-5 mt-0">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Taxas Gerais</p>
                <div className="grid grid-cols-3 gap-3">
                  <RateInput label="Antecipação" value={anticipationRate} onChange={setAnticipationRate} />
                  <RateInput label="PIX" value={pixRate} onChange={setPixRate} />
                  <RateInput label="Débito" value={debitShare} onChange={setDebitShare} />
                  <RateInput label="Crédito" value={creditShare} onChange={setCreditShare} />
                  <RateInput label="Parcelamento 2-6x" value={installmentShare} onChange={setInstallmentShare} />
                  <RateInput label="Parcelamento 7-12x" value={installmentShare712} onChange={setInstallmentShare712} />
                </div>
              </div>

              {[
                {
                  label: "Visa",
                  rows: [
                    { label: "Débito", val: visaDebit, set: setVisaDebit },
                    { label: "Crédito", val: visaCredit, set: setVisaCredit },
                    { label: "2-6x", val: visaInst2to6, set: setVisaInst2to6 },
                    { label: "7-12x", val: visaInst7to12, set: setVisaInst7to12 },
                    { label: "13-18x", val: visaInst13to18, set: setVisaInst13to18 },
                  ],
                },
                {
                  label: "Mastercard",
                  rows: [
                    { label: "Débito", val: masterDebit, set: setMasterDebit },
                    { label: "Crédito", val: masterCredit, set: setMasterCredit },
                    { label: "2-6x", val: masterInst2to6, set: setMasterInst2to6 },
                    { label: "7-12x", val: masterInst7to12, set: setMasterInst7to12 },
                    { label: "13-18x", val: masterInst13to18, set: setMasterInst13to18 },
                  ],
                },
                {
                  label: "Elo",
                  rows: [
                    { label: "Débito", val: eloDebit, set: setEloDebit },
                    { label: "Crédito", val: eloCredit, set: setEloCredit },
                    { label: "2-6x", val: eloInst2to6, set: setEloInst2to6 },
                    { label: "7-12x", val: eloInst7to12, set: setEloInst7to12 },
                    { label: "13-18x", val: eloInst13to18, set: setEloInst13to18 },
                  ],
                },
                {
                  label: "Outras Bandeiras",
                  rows: [
                    { label: "Débito", val: othersDebit, set: setOthersDebit },
                    { label: "Crédito", val: othersCredit, set: setOthersCredit },
                    { label: "2-6x", val: othersInst2to6, set: setOthersInst2to6 },
                    { label: "7-12x", val: othersInst7to12, set: setOthersInst7to12 },
                    { label: "13-18x", val: othersInst13to18, set: setOthersInst13to18 },
                  ],
                },
              ].map(({ label, rows }) => (
                <div key={label}>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-3">{label}</p>
                  <div className="grid grid-cols-5 gap-3">
                    {rows.map((r) => (
                      <RateInput key={r.label} label={r.label} value={r.val} onChange={r.set} />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* ── API / INTEGRAÇÃO ───────────────────────────── */}
            <TabsContent value="api" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>API ID (Seller ID)</Label>
                <Input value={apiId} onChange={(e) => setApiId(e.target.value)} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>API Token</Label>
                <Input value={apiToken} onChange={(e) => setApiToken(e.target.value)} className="font-mono text-sm" />
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="px-6 py-4 border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loadingFull}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
