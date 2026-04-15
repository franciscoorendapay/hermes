import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { accreditationsService } from "@/features/accreditations/accreditations.service";
import { AccreditationAPI } from "@/features/accreditations/accreditations.schemas";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, FileText, User, Image as ImageIcon } from "lucide-react";
import { formatDateToDisplay } from "@/lib/formatters";
import { resolveUploadUrl } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AccreditationAdmin() {
  const [accreditations, setAccreditations] = useState<AccreditationAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAccreditations = async () => {
    setLoading(true);
    try {
      // Fetch pending (for approval) and active (successful) accreditations
      const data = await accreditationsService.getAll('pending,active,analysis,rejected');
      setAccreditations(data);
    } catch (error) {
      console.error("Erro ao buscar credenciamentos", error);
      toast.error("Erro ao carregar lista de credenciamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccreditations();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await accreditationsService.approve(id);
      toast.success("Credenciamento aprovado com sucesso!");
      fetchAccreditations(); // Refresh list
    } catch (error: any) {
      console.error("Erro ao aprovar", error);
      const msg = error.response?.data?.error || error.message || "Erro desconhecido";
      toast.error(`Erro ao aprovar: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && accreditations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Gestão de Credenciamentos"
        description="Aprovação de leads e análise de documentos"
        showBack
        backTo="/admin"
      >
        <Button onClick={fetchAccreditations} variant="outline" size="sm">
          Atualizar
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Credenciamento</CardTitle>
        </CardHeader>
        <CardContent>
          {accreditations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação encontrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Estabelecimento</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accreditations.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>
                      {acc.createdAt ? formatDateToDisplay(new Date(acc.createdAt)) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{acc.responsibleName}</span>
                        <span className="text-xs text-muted-foreground">{acc.responsibleCpf}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {acc.lead && typeof acc.lead === 'object' ? (
                          <>
                            <span className="font-medium text-sm">{(acc.lead as any).tradeName || (acc.lead as any).name || '-'}</span>
                            <span className="text-xs text-muted-foreground">{(acc.lead as any).document || '-'}</span>
                            <span className="text-xs text-muted-foreground">{(acc.lead as any).city ? `${(acc.lead as any).city}/${(acc.lead as any).state || ''}` : '-'}</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Lead info indisponível</span>
                        )}
                        <div className="mt-2 pt-1 border-t border-border/50">
                          <span className="text-xs block font-medium text-muted-foreground mb-0.5">Dados Bancários</span>
                          <span className="text-xs block">Banco: {acc.bankName}</span>
                          <span className="text-xs text-muted-foreground">Ag: {acc.bankBranch} CC: {acc.bankAccount}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {acc.docCnpjUrl && <a href={resolveUploadUrl(acc.docCnpjUrl)!} target="_blank" rel="noreferrer" title="CNPJ/Contrato"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
                        {acc.docPhotoUrl && <a href={resolveUploadUrl(acc.docPhotoUrl)!} target="_blank" rel="noreferrer" title="Doc Antigo"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
                        {acc.docResidenceUrl && <a href={resolveUploadUrl(acc.docResidenceUrl)!} target="_blank" rel="noreferrer" title="Residência"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}
                        {acc.docActivityUrl && <a href={resolveUploadUrl(acc.docActivityUrl)!} target="_blank" rel="noreferrer" title="Atividade"><FileText className="h-4 w-4 text-green-500 hover:text-green-700 cursor-pointer" /></a>}

                        {/* Novos Docs KYC */}
                        {acc.selfieUrl && <a href={resolveUploadUrl(acc.selfieUrl)!} target="_blank" rel="noreferrer" title="Selfie"><User className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                        {acc.cnhFullUrl && <a href={resolveUploadUrl(acc.cnhFullUrl)!} target="_blank" rel="noreferrer" title="CNH Completa"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                        {acc.cnhFrontUrl && <a href={resolveUploadUrl(acc.cnhFrontUrl)!} target="_blank" rel="noreferrer" title="CNH Frente"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                        {acc.cnhBackUrl && <a href={resolveUploadUrl(acc.cnhBackUrl)!} target="_blank" rel="noreferrer" title="CNH Verso"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                        {acc.rgFrontUrl && <a href={resolveUploadUrl(acc.rgFrontUrl)!} target="_blank" rel="noreferrer" title="RG Frente"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                        {acc.rgBackUrl && <a href={resolveUploadUrl(acc.rgBackUrl)!} target="_blank" rel="noreferrer" title="RG Verso"><ImageIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer" /></a>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {acc.status === 'pending' && <Badge className="bg-amber-500">Pendente</Badge>}
                      {acc.status === 'active' && <Badge className="bg-green-500">Credenciado</Badge>}
                      {acc.status === 'analysis' && <Badge className="bg-cyan-500">Em Análise (Operadora)</Badge>}
                      {acc.status === 'rejected' && <Badge className="bg-red-500">Rejeitado</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {acc.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(acc.id)}
                          disabled={!!processingId}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingId === acc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
