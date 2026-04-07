import { useState, useEffect } from 'react';
import { Download, Coins, ArrowLeft, FileSpreadsheet, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubordinates } from '@/hooks/useSubordinates';
import { useAuth } from '@/hooks/useAuth';
import { http } from '@/shared/api/http';
import { useCommissionSettings } from '@/hooks/useCommissionSettings';
import { formatMoney } from '@/lib/formatters';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';

interface ComissaoByUser {
  userId: string;
  userName: string;
  transacionado: number;
  receita: number;
  comissao: number;
  leadsCount: number;
}

interface ClienteComissaoRow {
  'Nome do Cliente': string;
  'Email': string;
  'CNPJ': string;
  'Comercial': string;
  'Valor Transacionado': number;
  'Receita Bruta': number;
  'Receita Líquida': number;
  'Comissão': number;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function GestaoComissoes() {
  const navigate = useNavigate();
  const [reportMode, setReportMode] = useState<'month' | 'range'>('month');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [comissaoByUser, setComissaoByUser] = useState<ComissaoByUser[]>([]);
  const [clienteRows, setClienteRows] = useState<ClienteComissaoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { subordinates, isLoading: subsLoading } = useSubordinates();
  const { settings: commissionSettings, isLoading: commissionLoading } = useCommissionSettings();

  const getSafraDiff = (dataRef: string | null | undefined): number => {
    if (!dataRef) return 0;
    const d = new Date(dataRef);
    if (isNaN(d.getTime())) return 0;
    const now = new Date();
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return diff < 0 ? 0 : diff;
  };

  useEffect(() => {
    if (subsLoading || !subordinates.length) return;
    if (reportMode === 'range' && (!startDate || !endDate)) return;

    const fetchCommissions = async () => {
      setIsLoading(true);
      try {
        const allUsers = user
          ? [{ id: user.id, nome: user.name }, ...subordinates]
          : subordinates;
        const userIds = allUsers.map(s => s.id);
        const idsParam = userIds.join(',');

        const leadsRes = await http.get('/leads', { params: { user_ids: idsParam } });
        const leads = (Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data?.leads) || [];

        const params: any = { user_ids: idsParam };
        if (reportMode === 'month') {
          params.month = `${ano}-${String(mes).padStart(2, '0')}`;
        } else {
          params.startDate = startDate;
          params.endDate = endDate;
        }

        const transRes = await http.get('/leads/transacionado', { params });
        const transMap: Record<string, any> = transRes.data || {};

        const commissionsMap: Record<string, ComissaoByUser> = {};
        allUsers.forEach(sub => {
          commissionsMap[sub.id] = {
            userId: sub.id,
            userName: sub.nome,
            transacionado: 0,
            receita: 0,
            comissao: 0,
            leadsCount: 0
          };
        });

        const detailedRows: ClienteComissaoRow[] = [];

        leads.forEach((l: any) => {
          const uid = l.user?.id || l.user_id;
          const isCredenciado = l.credenciado === 1 || l.accreditation === 1;
          const funil = l.funil_app || l.appFunnel || l.app_funnel;

          if (uid && commissionsMap[uid] && isCredenciado && (funil === 5 || funil === 4)) {
            const trans = transMap[l.id];
            if (trans) {
              const transacionado = Number(trans.transacionado || 0);
              const receitaBruta = Number(trans.receita_bruta || 0);
              const receitaLiquida = Number(trans.receita_liquida || 0);
              const diff = getSafraDiff(l.data_credenciamento || l.data_registro || l.updated_at);

              let rate: number;
              if (commissionSettings.type === 'fixed') {
                rate = commissionSettings.rate_fixed ?? 0.05;
              } else {
                rate = diff <= 3 ? (commissionSettings.rate_novos ?? 0.07) : (commissionSettings.rate_consolidados ?? 0.035);
              }

              const comissao = receitaLiquida * rate;

              commissionsMap[uid].transacionado += transacionado;
              commissionsMap[uid].receita += receitaLiquida;
              commissionsMap[uid].comissao += comissao;
              commissionsMap[uid].leadsCount++;

              detailedRows.push({
                'Nome do Cliente': l.tradeName || l.companyName || l.name || '',
                'Email': l.email || '',
                'CNPJ': l.document || '',
                'Comercial': commissionsMap[uid].userName,
                'Valor Transacionado': transacionado,
                'Receita Bruta': receitaBruta,
                'Receita Líquida': receitaLiquida,
                'Comissão': comissao,
              });
            }
          }
        });

        setComissaoByUser(Object.values(commissionsMap).sort((a, b) => b.comissao - a.comissao));
        setClienteRows(detailedRows.sort((a, b) => b['Comissão'] - a['Comissão']));
      } catch (err) {
        console.error('Error fetching commissions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommissions();
  }, [subordinates, subsLoading, user, startDate, endDate, mes, ano, reportMode, commissionSettings]);

  const filteredCommissions = comissaoByUser.filter(u =>
    u.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const periodoLabel = reportMode === 'month'
    ? `${String(mes).padStart(2, '0')}-${ano}`
    : `${startDate}_${endDate}`;

  const exportDetailedExcel = async () => {
    if (clienteRows.length === 0) return;
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(clienteRows);
    ws['!cols'] = [
      { wch: 35 }, { wch: 30 }, { wch: 18 }, { wch: 25 },
      { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
    ];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      [4, 5, 6, 7].forEach(C => {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddr]) ws[cellAddr].z = 'R$ #,##0.00';
      });
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comissões por Cliente');
    XLSX.writeFile(wb, `comissoes-clientes-${periodoLabel}.xlsx`);
  };

  const exportSummaryExcel = async () => {
    if (filteredCommissions.length === 0) return;
    const XLSX = await import('xlsx');
    const data = filteredCommissions.map(u => ({
      'Comercial': u.userName,
      'Clientes Ativos': u.leadsCount,
      'Transacionado': u.transacionado,
      'Receita Líquida': u.receita,
      'Comissão': u.comissao,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 16 }, { wch: 14 }];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      [2, 3, 4].forEach(C => {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddr]) ws[cellAddr].z = 'R$ #,##0.00';
      });
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumo por Comercial');
    XLSX.writeFile(wb, `comissoes-resumo-${periodoLabel}.xlsx`);
  };

  const columns: ColumnDef<ComissaoByUser>[] = [
    {
      accessorKey: 'userName',
      header: ({ column }) => <SortableHeader column={column}>Comercial</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.userName}</span>,
    },
    {
      accessorKey: 'leadsCount',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">Clientes Ativos</SortableHeader>,
      cell: ({ row }) => <div className="text-right">{row.original.leadsCount}</div>,
    },
    {
      accessorKey: 'transacionado',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">Transacionado</SortableHeader>,
      cell: ({ row }) => <div className="text-right font-medium text-blue-600">{formatMoney(row.original.transacionado)}</div>,
    },
    {
      accessorKey: 'receita',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">Receita Líquida</SortableHeader>,
      cell: ({ row }) => <div className="text-right">{formatMoney(row.original.receita)}</div>,
    },
    {
      accessorKey: 'comissao',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">Comissão</SortableHeader>,
      cell: ({ row }) => <div className="text-right font-bold text-green-600">{formatMoney(row.original.comissao)}</div>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header - Static */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/gestao')} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatório de Comissões</h1>
            <p className="text-muted-foreground">Valores reais por comercial com base na Orenda</p>
          </div>
        </div>
      </div>

      {/* Date / Month Selection - Static */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 border-b border-border/50 pb-2 mb-2">
            <Button
              variant={reportMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setReportMode('month')}
              className="h-8"
            >
              Por Mês
            </Button>
            <Button
              variant={reportMode === 'range' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setReportMode('range')}
              className="h-8"
            >
              Período Personalizado
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3">
            {reportMode === 'month' ? (
              <div className="flex items-end gap-3 w-full">
                <div className="space-y-1 w-full sm:w-40">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Mês</label>
                  <Select value={`${mes}`} onValueChange={(v) => setMes(Number(v))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((name, idx) => (
                        <SelectItem key={idx} value={`${idx + 1}`}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 w-full sm:w-32">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Ano</label>
                  <Select value={`${ano}`} onValueChange={(v) => setAno(Number(v))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(year => (
                        <SelectItem key={year} value={`${year}`}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Data Início</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Data Fim</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  if (reportMode === 'month') {
                    setMes(new Date().getMonth() + 1);
                    setAno(new Date().getFullYear());
                  } else {
                    setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                    setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                  }
                }}
              >
                Mês Atual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading || subsLoading || commissionLoading ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Detalhamento por Comercial
                </CardTitle>
                <CardDescription>
                  Período: {reportMode === 'month' ? `${mes}/${ano}` : `${startDate && format(new Date(startDate), 'dd/MM/yyyy')} até ${endDate && format(new Date(endDate), 'dd/MM/yyyy')}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar comercial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={exportSummaryExcel}
                  disabled={filteredCommissions.length === 0}
                  title="Exportar resumo por comercial"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Resumo
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-9"
                  onClick={exportDetailedExcel}
                  disabled={clienteRows.length === 0}
                  title="Exportar detalhado por cliente"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Por Cliente
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filteredCommissions}
              emptyMessage={searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhum dado encontrado para o período selecionado.'}
              renderAfterRows={() =>
                filteredCommissions.length > 0 ? (
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell>TOTAL {searchTerm ? '(Filtrado)' : 'ACUMULADO'}</TableCell>
                    <TableCell className="text-right">{filteredCommissions.reduce((acc, u) => acc + u.leadsCount, 0)}</TableCell>
                    <TableCell className="text-right text-blue-600">{formatMoney(filteredCommissions.reduce((acc, u) => acc + u.transacionado, 0))}</TableCell>
                    <TableCell className="text-right">{formatMoney(filteredCommissions.reduce((acc, u) => acc + u.receita, 0))}</TableCell>
                    <TableCell className="text-right text-green-600">{formatMoney(filteredCommissions.reduce((acc, u) => acc + u.comissao, 0))}</TableCell>
                  </TableRow>
                ) : null
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
