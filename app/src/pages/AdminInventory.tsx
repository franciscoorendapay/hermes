import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  ArrowLeftRight,
  Search,
  ArrowLeft,
} from "lucide-react";
import { inventarioService } from "@/features/inventario/inventario.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Constantes ────────────────────────────────────────────────────────────────

const MACHINE_MODELS = [
  { model: "A910",    src: "/maquininhas/A910.svg",    key: "total_a910" },
  { model: "S920",    src: "/maquininhas/S920.svg",    key: "total_s920" },
  { model: "P2",      src: null,                        key: "total_p2" },
  { model: "GPOS720", src: "/maquininhas/GPOS720.png", key: "total_gpos720" },
  { model: "EP5855",  src: "/maquininhas/EP5855.png",  key: "total_ep5855" },
];

const REGION_KEYS = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

const STATUS_HIGHLIGHT: Record<string, "orange" | "red" | "normal"> = {
  em_estoque:  "orange",
  em_producao: "normal",
  em_transito: "normal",
  inativa:     "red",
  avariada:    "red",
};

const CHECKLIST_ITEMS = ["Conexão Chip", "Conexão Wifi", "Casco", "Sistema"];
const REGION_OPTIONS  = ["Norte", "Nordeste", "Sudeste", "Centro-Oeste", "Sul"];
const STATUS_OPTIONS  = ["Em estoque", "Em produção", "Em trânsito", "Inativa", "Avariada"];

// ─── Tipos ──────────────────────────────────────────────────────────────────────

interface NovoAvancoForm {
  quantidade: string;
  modelo: string;
  tipo: "POS" | "Chip";
  currentSerial: string;
  serials: string[];
  regiao: string;
  checklist: string[];
  observacoes: string;
}

const INITIAL_AVANCO: NovoAvancoForm = {
  quantidade: "", modelo: "", tipo: "POS",
  currentSerial: "", serials: [], regiao: "", checklist: [], observacoes: "",
};

interface MovimentarForm {
  currentSerial: string;
  serials: string[];
  status: string;
  regiao: string;
  observacoes: string;
  cpfCnpj: string;
}

const INITIAL_MOVIMENTAR: MovimentarForm = {
  currentSerial: "", serials: [], status: "", regiao: "", observacoes: "", cpfCnpj: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try { return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR }); }
  catch { return value; }
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function AdminInventory() {
  const navigate     = useNavigate();
  const { logout }   = useAuth();
  const queryClient  = useQueryClient();

  const [showAvanco,    setShowAvanco]    = useState(false);
  const [avanco,        setAvanco]        = useState<NovoAvancoForm>(INITIAL_AVANCO);
  const [savingAvanco,  setSavingAvanco]  = useState(false);

  const [showMovimentar, setShowMovimentar] = useState(false);
  const [mov,            setMov]            = useState<MovimentarForm>(INITIAL_MOVIMENTAR);
  const [savingMov,      setSavingMov]      = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["inventario-dashboard"],
    queryFn: () => inventarioService.dashboard(),
  });

  const handleLogout = async () => { await logout(); navigate("/"); };

  // ── Derivar totais por modelo ────────────────────────────────────────────────
  const getModelStock = (key: string): number =>
    (dashboard as Record<string, unknown>)?.[key] as number ?? 0;

  // ── Derivar stats por status (a partir do inventario[]) ─────────────────────
  const countByStatus = (status: string) =>
    (dashboard?.inventario ?? []).filter(m => m.status === status).length;

  const inventoryStats = [
    { label: "Em estoque",  value: countByStatus("em_estoque"),  highlight: "orange" as const },
    { label: "Em produção", value: countByStatus("em_producao"), highlight: "normal" as const },
    { label: "Em trânsito", value: countByStatus("em_transito"), highlight: "normal" as const },
    { label: "Inativas",    value: countByStatus("inativa") + countByStatus("avariada"), highlight: "red" as const },
  ];

  const regionStats = REGION_KEYS.map(label => ({
    label,
    value: (dashboard?.inventario ?? []).filter(
      m => m.regiao?.toLowerCase() === label.toLowerCase()
    ).length,
  }));

  const recentMovements = dashboard?.movimentacoes?.slice(0, 10) ?? [];

  // ── Serials helpers ──────────────────────────────────────────────────────────
  const addAvancoSerial = () => {
    const s = avanco.currentSerial.trim();
    if (!s || avanco.serials.includes(s)) return;
    setAvanco(f => ({ ...f, serials: [...f.serials, s], currentSerial: "" }));
  };

  const addMovSerial = () => {
    const s = mov.currentSerial.trim();
    if (!s || mov.serials.includes(s)) return;
    setMov(f => ({ ...f, serials: [...f.serials, s], currentSerial: "" }));
  };

  const toggleChecklist = (item: string) =>
    setAvanco(f => ({
      ...f,
      checklist: f.checklist.includes(item)
        ? f.checklist.filter(c => c !== item)
        : [...f.checklist, item],
    }));

  // ── Submit: Avanço ───────────────────────────────────────────────────────────
  const handleSubmitAvanco = async () => {
    if (!avanco.modelo || avanco.serials.length === 0) {
      toast.error("Informe o modelo e ao menos um serial.");
      return;
    }
    setSavingAvanco(true);
    try {
      await inventarioService.postAvanco({
        quantidade:  Number(avanco.quantidade),
        modelo:      avanco.modelo,
        tipo:        avanco.tipo,
        serials:     avanco.serials,
        regiao:      avanco.regiao,
        checklist:   avanco.checklist,
        observacoes: avanco.observacoes,
      });
      toast.success("Avanço registrado com sucesso!");
      setShowAvanco(false);
      setAvanco(INITIAL_AVANCO);
      queryClient.invalidateQueries({ queryKey: ["inventario-dashboard"] });
    } catch {
      toast.error("Erro ao registrar avanço.");
    } finally {
      setSavingAvanco(false);
    }
  };

  // ── Submit: Movimentar ────────────────────────────────────────────────────────
  const handleSubmitMovimentar = async () => {
    if (mov.serials.length === 0 || !mov.status) {
      toast.error("Informe ao menos um serial e o status.");
      return;
    }
    setSavingMov(true);
    try {
      await inventarioService.postMovimentar({
        serials:     mov.serials,
        status:      mov.status,
        regiao:      mov.regiao,
        observacoes: mov.observacoes,
        cpf_cnpj:    mov.cpfCnpj,
      });
      toast.success("Movimentação registrada com sucesso!");
      setShowMovimentar(false);
      setMov(INITIAL_MOVIMENTAR);
      queryClient.invalidateQueries({ queryKey: ["inventario-dashboard"] });
    } catch {
      toast.error("Erro ao registrar movimentação.");
    } finally {
      setSavingMov(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-48 bg-white border-r flex flex-col py-6 px-4 shrink-0">
        <div className="mb-8 px-2">
          <span className="text-2xl font-bold text-orange-500">Opay</span>
        </div>
        <nav className="flex-1 space-y-1">
          <button
            onClick={() => navigate("/admin")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-orange-500 bg-orange-50 transition-colors">
            <Package className="h-4 w-4" /> Inventário
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <BarChart3 className="h-4 w-4" /> Relatórios
          </button>
        </nav>
        <div className="space-y-1 border-t pt-4">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <Settings className="h-4 w-4" /> Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2" onClick={() => setShowAvanco(true)}>
            <Plus className="h-4 w-4" /> Novo Avanço
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowMovimentar(true)}>
            <ArrowLeftRight className="h-4 w-4" /> Movimentar
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/inventory/consultar")}>
            <Search className="h-4 w-4" /> Consultar
          </Button>
        </div>

        {/* Inventário Geral */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Inventário Geral de Máquinas</h2>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 divide-x">
              {inventoryStats.map(stat => (
                <div key={stat.label} className="px-6 first:pl-0 last:pr-0">
                  <p className={cn("text-sm font-medium mb-1",
                    stat.highlight === "orange" && "text-orange-500",
                    stat.highlight === "red"    && "text-red-500",
                    stat.highlight === "normal" && "text-gray-500",
                  )}>
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventário por Região */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Inventário por Região</h2>
          {isLoading ? (
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <div className="grid grid-cols-5 divide-x">
              {regionStats.map(region => (
                <div key={region.label} className="px-6 first:pl-0 last:pr-0">
                  <p className="text-sm font-medium mb-1 text-gray-500">{region.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{region.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas movimentações */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Últimas movimentações</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Serial</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      Nenhuma movimentação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMovements.map((m, i) => (
                    <TableRow key={m.id ?? i}>
                      <TableCell className="font-medium text-gray-800">{m.serial ?? "—"}</TableCell>
                      <TableCell>{m.tipo ?? "—"}</TableCell>
                      <TableCell className="text-blue-600">{m.usuario ?? "—"}</TableCell>
                      <TableCell className="text-gray-500 max-w-xs truncate">{m.observacao ?? "—"}</TableCell>
                      <TableCell className="text-gray-500">{formatDate(m.data as string)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* ── Painel direito — Máquinas ── */}
      <aside className="w-56 bg-white border-l flex flex-col py-6 px-4 shrink-0 overflow-y-auto">
        <h3 className="text-base font-semibold mb-4">Máquinas</h3>
        <div className="space-y-4">
          {MACHINE_MODELS.map(machine => (
            <div key={machine.model} className="flex items-center gap-3">
              <div className="w-10 h-12 bg-gray-100 rounded flex items-center justify-center shrink-0">
                {machine.src ? (
                  <img src={machine.src} alt={machine.model} className="w-full h-full object-contain rounded" />
                ) : (
                  <Package className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{machine.model}</p>
                <p className="text-xs text-gray-400">
                  Em estoque: {isLoading ? "…" : getModelStock(machine.key)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Modal: Movimentar ── */}
      <Dialog open={showMovimentar} onOpenChange={open => { if (!open) { setShowMovimentar(false); setMov(INITIAL_MOVIMENTAR); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-orange-500 pb-3">
            <DialogTitle className="text-lg font-semibold">Movimentar</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Serial Number (S/N) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="Digite um serial number"
                  value={mov.currentSerial}
                  onChange={e => setMov(f => ({ ...f, currentSerial: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addMovSerial()}
                  className="flex-1"
                />
                <Button variant="outline" className="border-orange-400 text-orange-500 hover:bg-orange-50" onClick={addMovSerial}>
                  Adicionar
                </Button>
              </div>
              <div className="mt-2 min-h-[80px] max-h-28 overflow-y-auto border rounded-md p-2 bg-gray-50 text-sm">
                {mov.serials.length === 0 ? (
                  <p className="text-gray-400 text-xs">Nenhum serial adicionado</p>
                ) : (
                  mov.serials.map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5">
                      <span>{s}</span>
                      <button
                        onClick={() => setMov(f => ({ ...f, serials: f.serials.filter((_, j) => j !== i) }))}
                        className="text-red-400 hover:text-red-600 text-xs ml-2"
                      >×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Status <span className="text-red-500">*</span>
              </label>
              <Select value={mov.status} onValueChange={v => setMov(f => ({ ...f, status: v }))}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Região</label>
              <div className="flex gap-5 flex-wrap">
                {REGION_OPTIONS.map(r => (
                  <label key={r} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input type="radio" name="mov-regiao" value={r} checked={mov.regiao === r}
                      onChange={() => setMov(f => ({ ...f, regiao: r }))} className="accent-orange-500" />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Observações</label>
              <Textarea rows={3} value={mov.observacoes} onChange={e => setMov(f => ({ ...f, observacoes: e.target.value }))} />
            </div>
            <div className="flex items-center gap-4 border-t pt-4">
              <label className="text-sm font-medium text-orange-500 whitespace-nowrap">CPF/CNPJ</label>
              <Input placeholder="CPF/CNPJ" value={mov.cpfCnpj} onChange={e => setMov(f => ({ ...f, cpfCnpj: e.target.value }))} className="flex-1" />
            </div>
          </div>
          <div className="flex justify-center gap-4 pt-4 border-t mt-2">
            <Button variant="outline" className="px-8" onClick={() => { setShowMovimentar(false); setMov(INITIAL_MOVIMENTAR); }}>
              Cancelar
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8" onClick={handleSubmitMovimentar} disabled={savingMov}>
              {savingMov ? "Salvando…" : "Movimentar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Novo Avanço ── */}
      <Dialog open={showAvanco} onOpenChange={open => { if (!open) { setShowAvanco(false); setAvanco(INITIAL_AVANCO); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-orange-500 pb-3">
            <DialogTitle className="text-lg font-semibold">Novo Avanço</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Quantidade</label>
                <Input type="number" min={1} className="w-20" value={avanco.quantidade}
                  onChange={e => setAvanco(f => ({ ...f, quantidade: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Modelo</label>
                <Select value={avanco.modelo} onValueChange={v => setAvanco(f => ({ ...f, modelo: v }))}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MACHINE_MODELS.map(m => <SelectItem key={m.model} value={m.model}>{m.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 ml-2">
                {(["POS", "Chip"] as const).map(t => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input type="radio" name="avanco-tipo" value={t} checked={avanco.tipo === t}
                      onChange={() => setAvanco(f => ({ ...f, tipo: t }))} className="accent-orange-500" />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Serial Number (S/N) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="Digite um serial number"
                  value={avanco.currentSerial}
                  onChange={e => setAvanco(f => ({ ...f, currentSerial: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addAvancoSerial()}
                  className="flex-1"
                />
                <Button variant="outline" className="border-orange-400 text-orange-500 hover:bg-orange-50" onClick={addAvancoSerial}>
                  Adicionar
                </Button>
              </div>
              <div className="mt-2 min-h-[80px] max-h-28 overflow-y-auto border rounded-md p-2 bg-gray-50 text-sm">
                {avanco.serials.length === 0 ? (
                  <p className="text-gray-400 text-xs">Nenhum serial adicionado</p>
                ) : (
                  avanco.serials.map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5">
                      <span>{s}</span>
                      <button
                        onClick={() => setAvanco(f => ({ ...f, serials: f.serials.filter((_, j) => j !== i) }))}
                        className="text-red-400 hover:text-red-600 text-xs ml-2"
                      >×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Região</label>
              <div className="flex gap-5 flex-wrap">
                {REGION_OPTIONS.map(r => (
                  <label key={r} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input type="radio" name="avanco-regiao" value={r} checked={avanco.regiao === r}
                      onChange={() => setAvanco(f => ({ ...f, regiao: r }))} className="accent-orange-500" />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Check-list de testagem</label>
              <div className="flex gap-5 flex-wrap">
                {CHECKLIST_ITEMS.map(item => (
                  <label key={item} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input type="checkbox" checked={avanco.checklist.includes(item)}
                      onChange={() => toggleChecklist(item)} className="accent-orange-500" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Observações</label>
              <Textarea rows={3} value={avanco.observacoes} onChange={e => setAvanco(f => ({ ...f, observacoes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-center gap-4 pt-4 border-t mt-2">
            <Button variant="outline" className="px-8" onClick={() => { setShowAvanco(false); setAvanco(INITIAL_AVANCO); }}>
              Cancelar
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8" onClick={handleSubmitAvanco} disabled={savingAvanco}>
              {savingAvanco ? "Salvando…" : "Incluir Avanço"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
