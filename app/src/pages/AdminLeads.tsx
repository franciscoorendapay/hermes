import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { http } from "@/shared/api/http";
import { toast } from "sonner";
import { Loader2, Search, Pencil, Users, ChevronLeft, ChevronRight, FileText, User, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditLeadAdminDialog } from "@/components/admin/EditLeadAdminDialog";

interface LeadData {
  id: string;
  leadCode?: number;
  name: string;
  tradeName?: string;
  companyName?: string;
  document?: string;
  email?: string;
  phone?: string;
  tpv?: string;
  mcc?: string;
  appFunnel?: number;
  accreditation?: number;
  city?: string;
  state?: string;
  user?: { id: string; name: string } | null;
  documents?: {
    cnpj?: string;
    photo?: string;
    residence?: string;
    activity?: string;
    selfie?: string;
    cnhFull?: string;
    cnhFront?: string;
    cnhBack?: string;
    rgFront?: string;
    rgBack?: string;
  } | null;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFunnel, setFilterFunnel] = useState<string>("all");
  const [editLead, setEditLead] = useState<LeadData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await http.get("/leads/admin/all");
      setLeads(res.data);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (filterFunnel !== "all") {
      result = result.filter(lead => String(lead.appFunnel) === filterFunnel);
    }

    if (!searchTerm.trim()) return result;

    const term = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return result.filter((lead) => {
      const fields = [
        lead.name,
        lead.tradeName,
        lead.companyName,
        lead.document,
        lead.email,
        lead.phone,
        lead.user?.name,
        lead.city,
        lead.state,
      ];
      return fields.some(
        (f) =>
          f &&
          f
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(term)
      );
    });
  }, [leads, searchTerm, filterFunnel]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterFunnel]);

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const handleEdit = (lead: LeadData) => {
    setEditLead(lead);
    setEditOpen(true);
  };

  const funnelLabel = (funnel?: number) => {
    const labels: Record<number, string> = {
      1: "Prospecção",
      2: "Contato",
      3: "Negociação",
      4: "Proposta",
      5: "Credenciado",
    };
    return funnel ? labels[funnel] || `Etapa ${funnel}` : "-";
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Gerenciamento de Leads"
        description={`${leads.length} leads cadastrados no sistema`}
        showBack
        backTo="/admin"
      >
        <Button onClick={fetchLeads} variant="outline" size="sm">
          Atualizar
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, documento, comercial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterFunnel} onValueChange={setFilterFunnel}>
            <SelectTrigger>
              <SelectValue placeholder="Funil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Prospecção</SelectItem>
              <SelectItem value="2">Contato</SelectItem>
              <SelectItem value="3">Negociação</SelectItem>
              <SelectItem value="4">Proposta</SelectItem>
              <SelectItem value="5">Credenciado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leads ({filteredLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "Nenhum lead encontrado com esse filtro."
                : "Nenhum lead cadastrado."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Funil</TableHead>
                    <TableHead>Comercial</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-mono text-xs">
                        {lead.leadCode || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {lead.tradeName || lead.name}
                          </span>
                          {lead.tradeName && lead.name !== lead.tradeName && (
                            <span className="text-xs text-muted-foreground">
                              {lead.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {lead.document || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.phone || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.city
                          ? `${lead.city}/${lead.state || ""}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[120px]">
                          {lead.documents ? (
                            <>
                              {lead.documents.cnpj && <a href={lead.documents.cnpj} target="_blank" rel="noreferrer" title="CNPJ/Contrato"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
                              {lead.documents.photo && <a href={lead.documents.photo} target="_blank" rel="noreferrer" title="Foto Antiga"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
                              {lead.documents.residence && <a href={lead.documents.residence} target="_blank" rel="noreferrer" title="Residência"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
                              {lead.documents.activity && <a href={lead.documents.activity} target="_blank" rel="noreferrer" title="Atividade"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
                              
                              {lead.documents.selfie && <a href={lead.documents.selfie} target="_blank" rel="noreferrer" title="Selfie"><User className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                              {lead.documents.cnhFull && <a href={lead.documents.cnhFull} target="_blank" rel="noreferrer" title="CNH Completa"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                              {lead.documents.cnhFront && <a href={lead.documents.cnhFront} target="_blank" rel="noreferrer" title="CNH Frente"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                              {lead.documents.cnhBack && <a href={lead.documents.cnhBack} target="_blank" rel="noreferrer" title="CNH Verso"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                              {lead.documents.rgFront && <a href={lead.documents.rgFront} target="_blank" rel="noreferrer" title="RG Frente"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                              {lead.documents.rgBack && <a href={lead.documents.rgBack} target="_blank" rel="noreferrer" title="RG Verso"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Nenhum</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            lead.appFunnel === 5
                              ? "border-green-500 text-green-600"
                              : ""
                          }
                        >
                          {funnelLabel(lead.appFunnel)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.user ? (
                          <span className="text-sm font-medium">
                            {lead.user.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Sem comercial
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(lead)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({filteredLeads.length} leads)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditLeadAdminDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={editLead}
        onSaved={fetchLeads}
      />
    </div>
  );
}
