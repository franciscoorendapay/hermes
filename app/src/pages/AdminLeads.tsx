import { useState, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { http } from "@/shared/api/http";
import { formatMoney } from "@/lib/formatters";
import { resolveUploadUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Search, Pencil, Users, FileText, User, Image as ImageIcon } from "lucide-react";
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

  const columns: ColumnDef<LeadData>[] = [
    {
      accessorKey: 'leadCode',
      header: 'ID',
      size: 80,
      enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.leadCode || '-'}</span>,
    },
    {
      id: 'cliente',
      accessorFn: (row) => row.tradeName || row.name,
      header: ({ column }) => <SortableHeader column={column}>Cliente</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.tradeName || row.original.name}</span>
          {row.original.tradeName && row.original.name !== row.original.tradeName && (
            <span className="text-xs text-muted-foreground">{row.original.name}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'document',
      header: 'Documento',
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs">{row.original.document || '-'}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm">{row.original.phone || '-'}</span>,
    },
    {
      accessorKey: 'tpv',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">TPV</SortableHeader>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-medium">
          {row.original.tpv ? formatMoney(parseFloat(row.original.tpv)) : '-'}
        </div>
      ),
    },
    {
      id: 'cidade',
      accessorFn: (row) => row.city ? `${row.city}/${row.state || ''}` : '',
      header: ({ column }) => <SortableHeader column={column}>Cidade/UF</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.city ? `${row.original.city}/${row.original.state || ''}` : '-'}
        </span>
      ),
    },
    {
      id: 'documentos',
      header: 'Documentos',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap max-w-[120px]">
          {row.original.documents ? (
            <>
              {row.original.documents.cnpj && <a href={resolveUploadUrl(row.original.documents.cnpj)!} target="_blank" rel="noreferrer" title="CNPJ/Contrato"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
              {row.original.documents.photo && <a href={resolveUploadUrl(row.original.documents.photo)!} target="_blank" rel="noreferrer" title="Foto Antiga"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
              {row.original.documents.residence && <a href={resolveUploadUrl(row.original.documents.residence)!} target="_blank" rel="noreferrer" title="Residência"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
              {row.original.documents.activity && <a href={resolveUploadUrl(row.original.documents.activity)!} target="_blank" rel="noreferrer" title="Atividade"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
              {row.original.documents.selfie && <a href={resolveUploadUrl(row.original.documents.selfie)!} target="_blank" rel="noreferrer" title="Selfie"><User className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
              {row.original.documents.cnhFull && <a href={resolveUploadUrl(row.original.documents.cnhFull)!} target="_blank" rel="noreferrer" title="CNH Completa"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
              {row.original.documents.cnhFront && <a href={resolveUploadUrl(row.original.documents.cnhFront)!} target="_blank" rel="noreferrer" title="CNH Frente"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
              {row.original.documents.cnhBack && <a href={resolveUploadUrl(row.original.documents.cnhBack)!} target="_blank" rel="noreferrer" title="CNH Verso"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
              {row.original.documents.rgFront && <a href={resolveUploadUrl(row.original.documents.rgFront)!} target="_blank" rel="noreferrer" title="RG Frente"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
              {row.original.documents.rgBack && <a href={resolveUploadUrl(row.original.documents.rgBack)!} target="_blank" rel="noreferrer" title="RG Verso"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic">Nenhum</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'appFunnel',
      header: ({ column }) => <SortableHeader column={column}>Funil</SortableHeader>,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={row.original.appFunnel === 5 ? 'border-green-500 text-green-600' : ''}
        >
          {funnelLabel(row.original.appFunnel)}
        </Badge>
      ),
    },
    {
      id: 'comercial',
      accessorFn: (row) => row.user?.name || '',
      header: ({ column }) => <SortableHeader column={column}>Comercial</SortableHeader>,
      cell: ({ row }) => row.original.user ? (
        <span className="text-sm font-medium">{row.original.user.name}</span>
      ) : (
        <span className="text-xs text-muted-foreground italic">Sem comercial</span>
      ),
    },
    {
      id: 'acoes',
      header: () => <div className="text-right">Ações</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-right">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      ),
    },
  ];

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
          <DataTable
            columns={columns}
            data={filteredLeads}
            pageSize={30}
            emptyMessage={searchTerm ? 'Nenhum lead encontrado com esse filtro.' : 'Nenhum lead cadastrado.'}
          />
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
