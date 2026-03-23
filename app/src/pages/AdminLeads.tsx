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
import { http } from "@/shared/api/http";
import { toast } from "sonner";
import { Loader2, Search, Pencil, Users } from "lucide-react";
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
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editLead, setEditLead] = useState<LeadData | null>(null);
  const [editOpen, setEditOpen] = useState(false);

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
    if (!searchTerm.trim()) return leads;

    const term = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return leads.filter((lead) => {
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
  }, [leads, searchTerm]);

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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, documento, comercial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
                    <TableHead>Cód</TableHead>
                    <TableHead>Nome / Fantasia</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Funil</TableHead>
                    <TableHead>Comercial</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
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
