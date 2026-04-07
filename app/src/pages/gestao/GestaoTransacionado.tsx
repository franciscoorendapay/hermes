import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, TrendingUp, CreditCard, Smartphone, Banknote, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubordinates } from '@/hooks/useSubordinates';
import { useAuth } from '@/hooks/useAuth';
import { http } from '@/shared/api/http';
import { formatMoney } from '@/lib/formatters';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Search, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TransacionadoItem {
  token: string;
  transacionado: number;
  receita_bruta: number;
  custos: number;
  receita_liquida: number;
  pix: number;
  cartao: number;
  maquininha: number;
  boleto: number;
  dominant_method: string;
}

interface LeadTransacionadoRow {
  leadId: string;
  leadName: string;
  comercialName: string;
  total: number;
  pix: number;
  cartao: number;
  maquininha: number;
  boleto: number;
  dominant: string;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function GestaoTransacionado() {
  const navigate = useNavigate();
  const [reportMode, setReportMode] = useState<'month' | 'range'>('month');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [rows, setRows] = useState<LeadTransacionadoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { subordinates, isLoading: subsLoading } = useSubordinates();

  useEffect(() => {
    if (subsLoading) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const activeSubordinates = subordinates.filter(s => s.includeInStats !== false);
        const allUsers = user
          ? [{ id: user.id, nome: user.name }, ...activeSubordinates]
          : activeSubordinates;
        const userIds = allUsers.map(s => s.id);
        const idsParam = userIds.join(',');

        // 1. Fetch leads
        const leadsRes = await http.get('/leads', { params: { user_ids: idsParam } });
        const leads = (Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data?.leads) || [];

        // 2. Fetch transacted data
        const params: any = { user_ids: idsParam };
        if (reportMode === 'month') {
          params.month = `${ano}-${String(mes).padStart(2, '0')}`;
        } else {
          params.startDate = startDate;
          params.endDate = endDate;
        }

        const transRes = await http.get('/leads/transacionado', { params });
        // Handle empty array [] vs object {} from backend
        const transMap: Record<string, TransacionadoItem> =
          Array.isArray(transRes.data) ? {} : (transRes.data || {});

        // 3. Merge
        const processedRows: LeadTransacionadoRow[] = [];
        leads.forEach((l: any) => {
             const trans = transMap[l.id];
             const total = Number(trans?.transacionado) || 0;
             if (trans && total > 0) {
                 processedRows.push({
                     leadId: l.id,
                     leadName: l.tradeName || l.companyName || l.name || 'Sem Nome',
                     comercialName: l.user?.name || 'N/A',
                     total,
                     pix: Number(trans.pix) || 0,
                     cartao: Number(trans.cartao) || 0,
                     maquininha: Number(trans.maquininha) || 0,
                     boleto: Number(trans.boleto) || 0,
                     dominant: trans.dominant_method || 'Nenhum',
                 });
             }
        });

        // Sort by total by default
        setRows(processedRows.sort((a, b) => b.total - a.total));
      } catch (err) {
        console.error('Error fetching transacted data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [subordinates, subsLoading, user, startDate, endDate, mes, ano, reportMode]);

  const filteredRows = rows.filter(r =>
    r.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comercialName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
      total: filteredRows.reduce((acc, r) => acc + r.total, 0),
      pix: filteredRows.reduce((acc, r) => acc + r.pix, 0),
      cartao: filteredRows.reduce((acc, r) => acc + r.cartao, 0),
      maquininha: filteredRows.reduce((acc, r) => acc + r.maquininha, 0),
      boleto: filteredRows.reduce((acc, r) => acc + r.boleto, 0),
  };

  const getMethodIcon = (method: string) => {
      switch (method) {
          case 'PIX': return <QrCode className="h-3 w-3 mr-1" />;
          case 'Cartão': return <CreditCard className="h-3 w-3 mr-1" />;
          case 'Maquininha': return <Smartphone className="h-3 w-3 mr-1" />;
          case 'Boleto': return <Banknote className="h-3 w-3 mr-1" />;
          default: return null;
      }
  };

  const getMethodColor = (method: string) => {
      switch (method) {
          case 'PIX': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'Cartão': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Maquininha': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'Boleto': return 'bg-orange-100 text-orange-700 border-orange-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  const columns: ColumnDef<LeadTransacionadoRow>[] = [
    {
      accessorKey: 'leadName',
      header: ({ column }) => <SortableHeader column={column}>Cliente / Comercial</SortableHeader>,
      size: 300,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground line-clamp-1">{row.original.leadName}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">{row.original.comercialName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'pix',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">PIX</SortableHeader>,
      cell: ({ row }) => <div className="text-right text-emerald-600 font-medium">{formatMoney(row.original.pix)}</div>,
    },
    {
      accessorKey: 'cartao',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">Cartão</SortableHeader>,
      cell: ({ row }) => <div className="text-right text-blue-600 font-medium">{formatMoney(row.original.cartao)}</div>,
    },
    {
      accessorKey: 'maquininha',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto">Maquininha</SortableHeader>,
      cell: ({ row }) => <div className="text-right text-purple-600 font-medium">{formatMoney(row.original.maquininha)}</div>,
    },
    {
      accessorKey: 'total',
      header: ({ column }) => <SortableHeader column={column} className="ml-auto font-bold text-foreground">Total Geral</SortableHeader>,
      cell: ({ row }) => <div className="text-right font-black text-foreground bg-primary/[0.02]">{formatMoney(row.original.total)}</div>,
    },
    {
      accessorKey: 'dominant',
      header: () => <div className="text-center w-[150px]">Principal Canal</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className={`font-bold border px-2 py-0.5 ${getMethodColor(row.original.dominant)}`}>
            {getMethodIcon(row.original.dominant)}
            {row.original.dominant}
          </Badge>
        </div>
      ),
    },
  ];

  const dataLoading = isLoading || subsLoading;

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/gestao')} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transacionado por Lead</h1>
            <p className="text-muted-foreground">Volume financeiro real detalhado por canal</p>
          </div>
        </div>
      </div>

      {/* Summary Cards — labels always visible, values skeleton when loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Transacionado', sub: 'Soma de todos os canais no período', value: stats.total, color: 'text-primary', bg: 'bg-primary/[0.03]', iconBg: 'bg-primary/10 text-primary', icon: <Wallet className="h-5 w-5" /> },
          { label: 'Volume PIX', sub: `${((stats.pix / (stats.total || 1)) * 100).toFixed(1)}% do total`, value: stats.pix, color: 'text-emerald-600', bg: 'bg-emerald-500/[0.03]', iconBg: 'bg-emerald-100 text-emerald-600', icon: <QrCode className="h-5 w-5" /> },
          { label: 'Volume Cartão', sub: `${((stats.cartao / (stats.total || 1)) * 100).toFixed(1)}% do total`, value: stats.cartao, color: 'text-blue-600', bg: 'bg-blue-500/[0.03]', iconBg: 'bg-blue-100 text-blue-600', icon: <CreditCard className="h-5 w-5" /> },
          { label: 'Volume Maquininha', sub: `${((stats.maquininha / (stats.total || 1)) * 100).toFixed(1)}% do total`, value: stats.maquininha, color: 'text-purple-600', bg: 'bg-purple-500/[0.03]', iconBg: 'bg-purple-100 text-purple-600', icon: <Smartphone className="h-5 w-5" /> },
        ].map(({ label, sub, value, color, bg, iconBg, icon }) => (
          <Card key={label} className={`shadow-sm border-none ${bg}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                  {dataLoading
                    ? <Skeleton className="h-7 w-28 my-1" />
                    : <h3 className={`text-2xl font-bold ${color}`}>{formatMoney(value)}</h3>
                  }
                  <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
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
                className="h-9 whitespace-nowrap"
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

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Financeira por Lead
              </CardTitle>
              <CardDescription>
                Exibindo leads com movimentação ativa no período
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou comercial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dataLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {['Cliente / Comercial', 'PIX', 'Cartão', 'Maquininha', 'Total Geral', 'Principal Canal'].map(h => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-36 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full mx-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRows}
              emptyMessage={searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhum lead com transações no período selecionado.'}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
