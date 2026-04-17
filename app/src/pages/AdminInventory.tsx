import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
import { logisticaService } from "@/features/logistica/logistica.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Constantes ────────────────────────────────────────────────────────────────

const MACHINES = [
  { model: "A910", src: "/maquininhas/A910.svg", estoque: 490 },
  { model: "S920", src: "/maquininhas/S920.svg", estoque: 125 },
  { model: "P2", src: null, estoque: 586 },
  { model: "GPOS720", src: "/maquininhas/GPOS720.png", estoque: 373 },
  { model: "EP5855", src: "/maquininhas/EP5855.png", estoque: 501 },
];

const INVENTORY_STATS = [
  { label: "Em estoque", value: 499, sub: "Últimos 30 dias", highlight: "orange" },
  { label: "Em produção", value: 1500, sub: "Atualizado 01/12/24", highlight: "normal" },
  { label: "Em trânsito", value: 0, sub: "Atualizado 01/12/24", highlight: "normal" },
  { label: "Inativas", value: 71, sub: "Avariadas", highlight: "red" },
];

const REGIONS = [
  { label: "Norte", value: 0, highlight: "orange" },
  { label: "Nordeste", value: 950, highlight: "normal" },
  { label: "Centro-Oeste", value: 0, highlight: "red" },
  { label: "Sudeste", value: 5, highlight: "red" },
  { label: "Sul", value: 641, highlight: "normal" },
];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  em_estoque: { label: "Em estoque", className: "text-green-600" },
  em_producao: { label: "Em produção", className: "text-orange-500" },
  em_transito: { label: "Em trânsito", className: "text-blue-500" },
  pendente: { label: "Pendente", className: "text-yellow-600" },
  entregue: { label: "Entregue", className: "text-green-600" },
  cancelado: { label: "Cancelado", className: "text-red-500" },
};

const TIPO_MAP: Record<string, string> = {
  entrega_equipamento: "Entrega",
  troca_equipamento: "Troca",
  retirada_equipamento: "Retirada",
  bobinas: "Bobinas",
};

const CHECKLIST_ITEMS = ["Conexão Chip", "Conexão Wifi", "Casco", "Sistema"];
const REGION_OPTIONS = ["Norte", "Nordeste", "Sudeste", "Centro-Oeste", "Sul"];
const STATUS_OPTIONS = ["Em estoque", "Em produção", "Em trânsito", "Inativa", "Avariada"];

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
  quantidade: "",
  modelo: "",
  tipo: "POS",
  currentSerial: "",
  serials: [],
  regiao: "",
  checklist: [],
  observacoes: "",
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
  currentSerial: "",
  serials: [],
  status: "",
  regiao: "",
  observacoes: "",
  cpfCnpj: "",
};

// ─── Componente ────────────────────────────────────────────────────────────────

export default function AdminInventory() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [showAvanco, setShowAvanco] = useState(false);
  const [avanco, setAvanco] = useState<NovoAvancoForm>(INITIAL_AVANCO);

  const [showMovimentar, setShowMovimentar] = useState(false);
  const [mov, setMov] = useState<MovimentarForm>(INITIAL_MOVIMENTAR);

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["logistica-ordens-inventory"],
    queryFn: () => logisticaService.listarOrdens(),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const addAvancoSerial = () => {
    const s = avanco.currentSerial.trim();
    if (!s || avanco.serials.includes(s)) return;
    setAvanco((f) => ({ ...f, serials: [...f.serials, s], currentSerial: "" }));
  };

  const addMovSerial = () => {
    const s = mov.currentSerial.trim();
    if (!s || mov.serials.includes(s)) return;
    setMov((f) => ({ ...f, serials: [...f.serials, s], currentSerial: "" }));
  };

  const toggleChecklist = (item: string) => {
    setAvanco((f) => ({
      ...f,
      checklist: f.checklist.includes(item)
        ? f.checklist.filter((c) => c !== item)
        : [...f.checklist, item],
    }));
  };

  const recentMovements = ordens.slice(0, 10);

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
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-orange-500 bg-orange-50 transition-colors">
            <Package className="h-4 w-4" />
            Inventário
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </button>
        </nav>
        <div className="space-y-1 border-t pt-4">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out
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
            <Plus className="h-4 w-4" />
            Novo Avanço
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowMovimentar(true)}>
            <ArrowLeftRight className="h-4 w-4" />
            Movimentar
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/inventory/consultar")}>
            <Search className="h-4 w-4" />
            Consultar
          </Button>
        </div>

        {/* Inventário Geral */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Inventário Geral de Máquinas</h2>
          <div className="grid grid-cols-4 divide-x">
            {INVENTORY_STATS.map((stat) => (
              <div key={stat.label} className="px-6 first:pl-0 last:pr-0">
                <p className={cn("text-sm font-medium mb-1",
                  stat.highlight === "orange" && "text-orange-500",
                  stat.highlight === "red" && "text-red-500",
                  stat.highlight === "normal" && "text-gray-500",
                )}>
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Inventário por Região */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Inventário por Região</h2>
          <div className="grid grid-cols-5 divide-x">
            {REGIONS.map((region) => (
              <div key={region.label} className="px-6 first:pl-0 last:pr-0">
                <p className={cn("text-sm font-medium mb-1",
                  region.highlight === "orange" && "text-orange-500",
                  region.highlight === "red" && "text-red-500",
                  region.highlight === "normal" && "text-gray-500",
                )}>
                  {region.label}
                </p>
                <p className="text-3xl font-bold text-gray-900">{region.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas movimentações */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Últimas movimentações</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data operação</TableHead>
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
                  recentMovements.map((ordem) => {
                    const sc = STATUS_MAP[ordem.status] ?? { label: ordem.status, className: "text-gray-500" };
                    return (
                      <TableRow key={ordem.id}>
                        <TableCell className="text-blue-600 font-medium">{ordem.created_by?.name ?? "—"}</TableCell>
                        <TableCell>{TIPO_MAP[ordem.tipo] ?? ordem.tipo}</TableCell>
                        <TableCell className="text-gray-600">{ordem.leads?.nome_fantasia ?? "—"}</TableCell>
                        <TableCell className={sc.className}>{sc.label}</TableCell>
                        <TableCell className="text-gray-500">
                          {format(new Date(ordem.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    );
                  })
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
          {MACHINES.map((machine) => (
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
                <p className="text-xs text-gray-400">Em estoque: {machine.estoque}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Modal: Movimentar ── */}
      <Dialog
        open={showMovimentar}
        onOpenChange={(open) => {
          if (!open) {
            setShowMovimentar(false);
            setMov(INITIAL_MOVIMENTAR);
          }
        }}
      >
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
                  onChange={(e) => setMov((f) => ({ ...f, currentSerial: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addMovSerial()}
                  className="flex-1"
                />
                <Button variant="outline" className="border-orange-400 text-orange-500 hover:bg-orange-50" onClick={addMovSerial}>
                  Adicionar
                </Button>
                <Button variant="outline" className="border-orange-400 text-orange-500 hover:bg-orange-50">
                  Escanear
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
                        onClick={() => setMov((f) => ({ ...f, serials: f.serials.filter((_, j) => j !== i) }))}
                        className="text-red-400 hover:text-red-600 text-xs ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Status <span className="text-red-500">*</span>
              </label>
              <Select value={mov.status} onValueChange={(v) => setMov((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Região</label>
              <div className="flex gap-5 flex-wrap">
                {REGION_OPTIONS.map((r) => (
                  <label key={r} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="mov-regiao"
                      value={r}
                      checked={mov.regiao === r}
                      onChange={() => setMov((f) => ({ ...f, regiao: r }))}
                      className="accent-orange-500"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Observações</label>
              <Textarea rows={3} value={mov.observacoes} onChange={(e) => setMov((f) => ({ ...f, observacoes: e.target.value }))} />
            </div>
            <div className="flex items-center gap-4 border-t pt-4">
              <label className="text-sm font-medium text-orange-500 whitespace-nowrap">CPF/CNPJ</label>
              <Input placeholder="CPF/CNPJ" value={mov.cpfCnpj} onChange={(e) => setMov((f) => ({ ...f, cpfCnpj: e.target.value }))} className="flex-1" />
            </div>
          </div>
          <div className="flex justify-center gap-4 pt-4 border-t mt-2">
            <Button variant="outline" className="px-8" onClick={() => { setShowMovimentar(false); setMov(INITIAL_MOVIMENTAR); }}>
              Cancelar
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8">
              Movimentar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Novo Avanço ── */}
      <Dialog open={showAvanco} onOpenChange={(open) => { if (!open) { setShowAvanco(false); setAvanco(INITIAL_AVANCO); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-orange-500 pb-3">
            <DialogTitle className="text-lg font-semibold">Novo Avanço</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Quantidade</label>
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  value={avanco.quantidade}
                  onChange={(e) => setAvanco((f) => ({ ...f, quantidade: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Modelo</label>
                <Select value={avanco.modelo} onValueChange={(v) => setAvanco((f) => ({ ...f, modelo: v }))}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MACHINES.map((m) => (
                      <SelectItem key={m.model} value={m.model}>{m.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 ml-2">
                {(["POS", "Chip"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="avanco-tipo"
                      value={t}
                      checked={avanco.tipo === t}
                      onChange={() => setAvanco((f) => ({ ...f, tipo: t }))}
                      className="accent-orange-500"
                    />
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
                  onChange={(e) => setAvanco((f) => ({ ...f, currentSerial: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addAvancoSerial()}
                  className="flex-1"
                />
                <Button variant="outline" className="border-orange-400 text-orange-500 hover:bg-orange-50" onClick={addAvancoSerial}>
                  Adicionar
                </Button>
                <Button variant="outline" className="border-orange-400 text-orange-500 hover:bg-orange-50">
                  Escanear
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
                        onClick={() => setAvanco((f) => ({ ...f, serials: f.serials.filter((_, j) => j !== i) }))}
                        className="text-red-400 hover:text-red-600 text-xs ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Região</label>
              <div className="flex gap-5 flex-wrap">
                {REGION_OPTIONS.map((r) => (
                  <label key={r} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="avanco-regiao"
                      value={r}
                      checked={avanco.regiao === r}
                      onChange={() => setAvanco((f) => ({ ...f, regiao: r }))}
                      className="accent-orange-500"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Check-list de testagem</label>
              <div className="flex gap-5 flex-wrap">
                {CHECKLIST_ITEMS.map((item) => (
                  <label key={item} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={avanco.checklist.includes(item)}
                      onChange={() => toggleChecklist(item)}
                      className="accent-orange-500"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Observações</label>
              <Textarea rows={3} value={avanco.observacoes} onChange={(e) => setAvanco((f) => ({ ...f, observacoes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-center gap-4 pt-4 border-t mt-2">
            <Button variant="outline" className="px-8" onClick={() => { setShowAvanco(false); setAvanco(INITIAL_AVANCO); }}>
              Cancelar
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8">
              Incluir Avanço
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
