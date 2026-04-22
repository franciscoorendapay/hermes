import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ArrowLeft, Send, History } from "lucide-react";
import { inventarioService } from "@/features/inventario/inventario.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_OPTIONS = ["Em estoque", "Em produção", "Em trânsito", "Inativa", "Avariada"];
const REGION_OPTIONS = ["Norte", "Nordeste", "Sudeste", "Centro-Oeste", "Sul"];
const PER_PAGE = 10;

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  } catch {
    return value;
  }
}

export default function AdminInventoryConsultar() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [regiao, setRegiao] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ busca: "", status: "", regiao: "" });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventario-consultar", filters, page],
    queryFn: () =>
      inventarioService.consultar({
        q:      filters.busca  || undefined,
        status: filters.status || undefined,
        regiao: filters.regiao || undefined,
        page,
      }),
    retry: false,
  });

  const handleSearch = () => {
    setFilters({ busca, status, regiao });
    setPage(1);
  };

  const maquinas = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/inventory")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">Consultar Máquinas</h1>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Buscar</label>
            <Input
              placeholder="Inserir serial number ou documento do estabelecimento"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Região</label>
            <Select value={regiao} onValueChange={setRegiao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas</SelectItem>
                {REGION_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <Button onClick={handleSearch} className="bg-orange-500 hover:bg-orange-600 text-white px-6">
            Buscar
          </Button>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-orange-500 font-semibold">Serial</TableHead>
                <TableHead className="text-orange-500 font-semibold">Status</TableHead>
                <TableHead className="text-orange-500 font-semibold">Região</TableHead>
                <TableHead className="text-orange-500 font-semibold">Email do estabelecimento</TableHead>
                <TableHead className="text-orange-500 font-semibold">Ultima mov.</TableHead>
                <TableHead className="text-orange-500 font-semibold">Ultima obs.</TableHead>
                <TableHead className="text-orange-500 font-semibold">Usuário</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: PER_PAGE }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                    Não foi possível carregar os dados. O endpoint de inventário pode não estar disponível.
                  </TableCell>
                </TableRow>
              ) : maquinas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                    Nenhuma máquina encontrada
                  </TableCell>
                </TableRow>
              ) : (
                maquinas.map((m) => (
                  <TableRow key={m.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-800">{m.serial}</TableCell>
                    <TableCell className="text-gray-600">{m.status}</TableCell>
                    <TableCell className="text-gray-600 lowercase">{m.regiao}</TableCell>
                    <TableCell className="text-gray-500">{m.email_estabelecimento ?? ""}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(m.ultima_movimentacao)}</TableCell>
                    <TableCell className="text-gray-500">{m.ultima_observacao ?? ""}</TableCell>
                    <TableCell className="text-gray-600">{m.usuario ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600">
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-6"
          >
            Anterior
          </Button>
          <span className="text-sm font-medium text-gray-700">
            Página {page} de {lastPage}{total > 0 && ` — ${total} registros`}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
            className="px-6"
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
