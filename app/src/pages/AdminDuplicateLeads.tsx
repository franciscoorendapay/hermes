import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { http } from "@/shared/api/http";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Trash2,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DupeLead {
  id: string;
  name: string;
  tradeName: string | null;
  companyName: string | null;
  document: string;
  phone: string | null;
  email: string | null;
  appFunnel: number | null;
  accreditation: number | null;
  createdAt: string;
  user: { id: string; name: string };
}

interface DupeGroup {
  document: string;
  total: number;
  different_users: boolean;
  leads: DupeLead[];
}

const FUNIL_LABELS: Record<number, string> = {
  1: "Prospecção",
  2: "Contato",
  3: "Proposta",
  4: "Negociação",
  5: "Credenciado",
};

function formatDoc(doc: string) {
  const d = doc.replace(/\D/g, "");
  if (d.length === 11)
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14)
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc;
}

export default function AdminDuplicateLeads() {
  const [groups, setGroups] = useState<DupeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyCrossUser, setOnlyCrossUser] = useState(true);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await http.get("/leads/duplicates");
      setGroups(res.data || []);
    } catch {
      toast.error("Erro ao carregar duplicatas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const filtered = useMemo(() => {
    return groups
      .filter((g) => !resolved.has(g.document))
      .filter((g) => (onlyCrossUser ? g.different_users : true))
      .filter((g) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          g.document.includes(s) ||
          g.leads.some(
            (l) =>
              (l.name || "").toLowerCase().includes(s) ||
              (l.tradeName || "").toLowerCase().includes(s) ||
              (l.companyName || "").toLowerCase().includes(s) ||
              (l.user.name || "").toLowerCase().includes(s)
          )
        );
      });
  }, [groups, search, onlyCrossUser, resolved]);

  const toggle = (doc: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      next.has(doc) ? next.delete(doc) : next.add(doc);
      return next;
    });
  };

  const handleDelete = async (leadId: string, groupDoc: string) => {
    if (!confirm("Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.")) return;
    setDeleting(leadId);
    try {
      await http.delete(`/leads/${leadId}`);
      toast.success("Lead excluído");

      setGroups((prev) =>
        prev.map((g) => {
          if (g.document !== groupDoc) return g;
          const remaining = g.leads.filter((l) => l.id !== leadId);
          return { ...g, leads: remaining, total: remaining.length };
        })
      );

      // If only 1 lead remains in the group, mark as resolved
      const group = groups.find((g) => g.document === groupDoc);
      if (group && group.leads.length - 1 <= 1) {
        setResolved((prev) => new Set([...prev, groupDoc]));
        toast.success("Duplicata resolvida!");
      }
    } catch {
      toast.error("Erro ao excluir lead");
    } finally {
      setDeleting(null);
    }
  };

  const crossUserCount = groups.filter((g) => g.different_users && !resolved.has(g.document)).length;
  const sameUserCount = groups.filter((g) => !g.different_users && !resolved.has(g.document)).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <PageHeader
          title="Leads Duplicados"
          description="Identifique e corrija leads cadastrados mais de uma vez"
        />

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-rose-500" />
              <div>
                <p className="text-2xl font-bold text-rose-700">{crossUserCount}</p>
                <p className="text-xs text-rose-600">Duplicatas entre comerciais diferentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Copy className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{sameUserCount}</p>
                <p className="text-xs text-amber-600">Duplicatas no mesmo comercial</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-emerald-700">{resolved.size}</p>
                <p className="text-xs text-emerald-600">Resolvidas nesta sessão</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por documento, nome ou comercial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="cross-user"
                checked={onlyCrossUser}
                onCheckedChange={setOnlyCrossUser}
              />
              <Label htmlFor="cross-user" className="text-sm cursor-pointer">
                Somente entre comerciais diferentes
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
              <p className="font-medium">Nenhuma duplicata encontrada</p>
              <p className="text-sm mt-1">
                {onlyCrossUser
                  ? "Não há leads duplicados entre comerciais diferentes."
                  : "Nenhum lead duplicado encontrado."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((group) => {
              const isOpen = expandedDocs.has(group.document);
              return (
                <Card
                  key={group.document}
                  className={group.different_users ? "border-rose-200" : "border-amber-200"}
                >
                  {/* Header do grupo */}
                  <button
                    className="w-full text-left"
                    onClick={() => toggle(group.document)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {group.different_users ? (
                            <Badge className="bg-rose-100 text-rose-700 border-rose-200 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Comerciais diferentes
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                              <Copy className="h-3 w-3" />
                              Mesmo comercial
                            </Badge>
                          )}
                          <span className="font-mono font-semibold text-sm">
                            {formatDoc(group.document)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {group.leads[0]?.name || group.leads[0]?.tradeName || group.leads[0]?.companyName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{group.total} leads</Badge>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {/* Detalhes */}
                  {isOpen && (
                    <CardContent className="pt-0">
                      <div className="divide-y divide-border rounded-lg border overflow-hidden">
                        {group.leads.map((lead, idx) => (
                          <div
                            key={lead.id}
                            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              idx === 0 ? "bg-emerald-50" : "bg-background"
                            }`}
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {idx === 0 && (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                                    Mais antigo
                                  </Badge>
                                )}
                                <span className="font-medium text-sm">
                                  {lead.tradeName || lead.companyName || lead.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {lead.user.name || "Sem comercial"}
                                </span>
                                {lead.phone && <span>📞 {lead.phone}</span>}
                                {lead.appFunnel && (
                                  <Badge variant="outline" className="text-[10px] h-4">
                                    {FUNIL_LABELS[lead.appFunnel] || `Funil ${lead.appFunnel}`}
                                  </Badge>
                                )}
                                {lead.accreditation === 1 && (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px] h-4">
                                    Credenciado
                                  </Badge>
                                )}
                                <span className="text-[10px]">
                                  Criado em{" "}
                                  {format(parseISO(lead.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(lead.id, group.document)}
                              disabled={deleting === lead.id}
                              className="shrink-0"
                            >
                              {deleting === lead.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              <span className="ml-1">Excluir</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        * O lead destacado em verde é o mais antigo. Exclua os duplicados e mantenha apenas um.
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
