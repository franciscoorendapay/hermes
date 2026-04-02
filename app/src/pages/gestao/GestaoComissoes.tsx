import { useState, useEffect } from 'react';
import { Download, Coins, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubordinates } from '@/hooks/useSubordinates';
import { http } from '@/shared/api/http';
import { useCommissionSettings } from '@/hooks/useCommissionSettings';
import { formatMoney } from '@/lib/formatters';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface ComissaoByUser {
  userId: string;
  userName: string;
  transacionado: number;
  receita: number;
  comissao: number;
  leadsCount: number;
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
  const [isLoading, setIsLoading] = useState(true);
  
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
        const userIds = subordinates.map(s => s.id);
        const idsParam = userIds.join(',');

        // 1. Fetch leads to get IDs and Safra
        const leadsRes = await http.get('/leads', { params: { user_ids: idsParam } });
        const leads = (Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data?.leads) || [];
        
        // 2. Fetch real transacted data for these users/period
        const params: any = { user_ids: idsParam };
        if (reportMode === 'month') {
          params.month = `${ano}-${String(mes).padStart(2, '0')}`;
        } else {
          params.startDate = startDate;
          params.endDate = endDate;
        }

        const transRes = await http.get('/leads/transacionado', { params });
        const transMap: Record<string, any> = transRes.data || {};

        // 3. Process and calculate
        const commissionsMap: Record<string, ComissaoByUser> = {};
        subordinates.forEach(sub => {
          commissionsMap[sub.id] = {
            userId: sub.id,
            userName: sub.nome,
            transacionado: 0,
            receita: 0,
            comissao: 0,
            leadsCount: 0
          };
        });

        leads.forEach((l: any) => {
          const uid = l.user?.id || l.user_id;
          const isCredenciado = l.credenciado === 1 || l.accreditation === 1;
          const funil = l.funil_app || l.appFunnel || l.app_funnel;
          
          if (uid && commissionsMap[uid] && isCredenciado && (funil === 5 || funil === 4)) {
            const trans = transMap[l.id];
            if (trans) {
              const receita = Number(trans.receita_liquida || 0);
              const diff = getSafraDiff(l.data_credenciamento || l.data_registro || l.updated_at);
              
              let rate: number;
              if (commissionSettings.type === 'fixed') {
                rate = commissionSettings.rate_fixed ?? 0.05;
              } else {
                rate = diff <= 3 ? (commissionSettings.rate_novos ?? 0.07) : (commissionSettings.rate_consolidados ?? 0.035);
              }

              commissionsMap[uid].transacionado += Number(trans.transacionado || 0);
              commissionsMap[uid].receita += receita;
              commissionsMap[uid].comissao += receita * rate;
              commissionsMap[uid].leadsCount++;
            }
          }
        });

        setComissaoByUser(Object.values(commissionsMap).sort((a, b) => b.comissao - a.comissao));
      } catch (err) {
        console.error('Error fetching commissions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommissions();
  }, [subordinates, subsLoading, startDate, endDate, mes, ano, reportMode, commissionSettings]);

  const filteredCommissions = comissaoByUser.filter(u => 
    u.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || subsLoading || commissionLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Date / Month Selection */}
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

      {/* Report Table */}
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
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar comercial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredCommissions.map(u => ({
                Comercial: u.userName,
                Clientes: u.leadsCount,
                Transacionado: formatMoney(u.transacionado),
                Receita: formatMoney(u.receita),
                Comissão: formatMoney(u.comissao),
              })), 'relatorio-comissoes')}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comercial</TableHead>
                <TableHead className="text-right">Clientes Ativos</TableHead>
                <TableHead className="text-right">Transacionado</TableHead>
                <TableHead className="text-right">Receita Líquida</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhum dado encontrado para o período selecionado.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommissions.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.userName}</TableCell>
                    <TableCell className="text-right">{user.leadsCount}</TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      {formatMoney(user.transacionado)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(user.receita)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatMoney(user.comissao)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {filteredCommissions.length > 0 && (
              <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell>TOTAL {searchTerm ? '(Filtrado)' : 'ACUMULADO'}</TableCell>
                <TableCell className="text-right">
                  {filteredCommissions.reduce((acc, u) => acc + u.leadsCount, 0)}
                </TableCell>
                <TableCell className="text-right text-blue-600">
                  {formatMoney(filteredCommissions.reduce((acc, u) => acc + u.transacionado, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatMoney(filteredCommissions.reduce((acc, u) => acc + u.receita, 0))}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatMoney(filteredCommissions.reduce((acc, u) => acc + u.comissao, 0))}
                </TableCell>
              </TableRow>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
