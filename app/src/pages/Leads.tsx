
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Filter,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Upload,
  Loader2,
  Calendar,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { FUNIL } from "@/constants/funil";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { LaunchVisitSheet } from "@/components/routes/LaunchVisitSheet";
import { cn } from "@/lib/utils";
import { startOfDay, startOfWeek, startOfMonth, subDays, isAfter, parseISO } from "date-fns";

const AVATAR_COLORS: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-yellow-500",
  3: "bg-purple-500",
  4: "bg-orange-500",
  5: "bg-green-500",
  6: "bg-gray-500",
  7: "bg-amber-500",
  8: "bg-slate-500",
};

const DATE_FILTERS = [
  { value: "all", label: "Todas as Datas" },
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "this_week", label: "Essa Semana" },
  { value: "this_month", label: "Esse Mês" },
];

const isInDateRange = (dateString: string | null, filter: string): boolean => {
  if (!dateString || filter === "all") return true;

  const date = parseISO(dateString);
  const today = startOfDay(new Date());

  switch (filter) {
    case "today":
      return isAfter(date, today) || date.getTime() === today.getTime();
    case "yesterday":
      const yesterday = subDays(today, 1);
      return date >= yesterday && date < today;
    case "this_week":
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      return date >= weekStart;
    case "this_month":
      const monthStart = startOfMonth(today);
      return date >= monthStart;
    default:
      return true;
  }
};

export default function Leads() {
  const { user } = useAuth();
  const { data: leads = [], isLoading, refetch } = useLeads(!!user);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Detail sheet state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  // Visit sheet state
  const [showVisitSheet, setShowVisitSheet] = useState(false);
  const [directAction, setDirectAction] = useState<string | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      lead.nome_fantasia?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.endereco_cidade?.toLowerCase().includes(searchLower) ||
      lead.telefone?.includes(searchQuery);
    const matchesStatus =
      statusFilter === "all" || (lead.funil_app?.toString() ?? "") === statusFilter;
    const matchesDate = isInDateRange(lead.data_registro, dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailSheet(true);
  };

  const handleContinuarCadastro = (lead: Lead, action: string) => {
    setShowDetailSheet(false);
    setSelectedLead(lead);
    setDirectAction(action);
    setShowVisitSheet(true);
  };

  const handleEditar = (lead: Lead, action: string) => {
    setShowDetailSheet(false);
    setSelectedLead(lead);
    setDirectAction(action);
    setShowVisitSheet(true);
  };

  const handleVisitSheetClose = (open: boolean) => {
    setShowVisitSheet(open);
    if (!open) {
      setSelectedLead(null);
      setDirectAction(null);
      refetch();
    }
  };

  const handleLeadSaved = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Leads"
        description="Gerencie seus leads e prospects"
        showBack
      >
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar
        </Button>
        <Button className="gap-2 gradient-dark text-white border-0"
        onClick={() => {
          setSelectedLead(null); 
          setDirectAction(null);
          setShowVisitSheet(true);
        }}
      >
        <Plus className="h-4 w-4 text-primary" />
        Novo Lead
      </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, cidade ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {FUNIL.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton columns={7} rows={10} />
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>Nenhum lead encontrado</p>
              {searchQuery || statusFilter !== "all" ? (
                <p className="text-sm">Tente ajustar os filtros</p>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead className="hidden md:table-cell">Contato</TableHead>
                    <TableHead className="hidden lg:table-cell">Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const funilId = lead.funil_app ?? 1;
                    const funilStatus = FUNIL.find((f) => f.id === funilId);
                    const avatarColor = AVATAR_COLORS[funilId] || "bg-gray-500";

                    const endereco = [
                      lead.endereco_logradouro,
                      lead.endereco_numero ? `nº ${lead.endereco_numero}` : null,
                      lead.endereco_bairro,
                      lead.endereco_cidade,
                      lead.endereco_estado,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <TableRow
                        key={lead.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center text-white font-medium",
                                avatarColor
                              )}
                            >
                              {getInitials(lead.nome_fantasia)}
                            </div>
                            <div>
                              <p className="font-medium">{lead.nome_fantasia}</p>
                              <p className="text-sm text-muted-foreground md:hidden">
                                {lead.email || lead.telefone}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            {lead.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {lead.email}
                              </div>
                            )}
                            {lead.telefone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {lead.telefone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {endereco && (
                            <div className="flex items-center gap-2 text-sm max-w-xs truncate">
                              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              {endereco}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {funilStatus && (
                            <Badge
                              variant="outline"
                              className={cn(
                                funilStatus.color,
                                funilStatus.textColor,
                                "border-0"
                              )}
                            >
                              {funilStatus.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeadClick(lead);
                                }}
                              >
                                Ver detalhes
                              </DropdownMenuItem>
                              {/* Só mostra Editar se não for credenciado */}
                              {!(lead.funil_app === 5 && lead.credenciado === 1) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Map funil_app to edit action
                                    const funilId = lead.funil_app ?? 1;
                                    const actionMap: Record<number, string> = {
                                      1: "prospeccao",
                                      2: "qualificacao",
                                      3: "negociacao",
                                      4: "precificacao",
                                      5: "precificacao"
                                    };
                                    handleEditar(lead, actionMap[funilId] || "prospeccao");
                                  }}
                                >
                                  Editar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive">
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onContinuarCadastro={handleContinuarCadastro}
        onEditar={handleEditar}
      />

      {/* Launch Visit Sheet for continuing or editing */}
      <LaunchVisitSheet
        open={showVisitSheet}
        onOpenChange={handleVisitSheetClose}
        leads={leads}
        selectedLead={selectedLead}
        directAction={directAction}
        onLeadSaved={handleLeadSaved}
      />
    </div>
  );
}
