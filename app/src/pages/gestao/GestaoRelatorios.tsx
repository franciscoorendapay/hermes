import { useState, useEffect, useMemo } from 'react';
import { Download, Users, TrendingUp, BarChart3, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubordinates, Subordinate } from '@/hooks/useSubordinates';
import { http } from '@/shared/api/http';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';
import { FUNIL, FUNIL_COLORS } from '@/constants/funil';

interface LeadsByUser {
  userId: string;
  userName: string;
  total: number;
  byFunil: Record<number, number>;
  credenciados: number;
  tpvTotal: number;
}

interface FaturamentoByUser {
  userId: string;
  userName: string;
  totalCredenciados: number;
  tpvTotal: number;
  metaClientes: number;
  metaValor: number;
  atingimentoClientes: number;
  atingimentoValor: number;
}

const COLORS = ['#F58320', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function GestaoRelatorios() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [leadsByUser, setLeadsByUser] = useState<LeadsByUser[]>([]);
  const [faturamentoByUser, setFaturamentoByUser] = useState<FaturamentoByUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { subordinates, isLoading: subsLoading } = useSubordinates();
  const { user } = useAuth();
  const { role } = useUserRole();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    if (subsLoading || !subordinates.length) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userIds = subordinates.map(s => s.id);
        
        // Fetch leads data from local API
        const leadsResponse = await http.get('/leads', {
          params: { user_ids: userIds.join(',') }
        });
        const leadsData: any[] = Array.isArray(leadsResponse.data) ? leadsResponse.data : (leadsResponse.data?.leads || []);

        // Fetch metas data for current month from local API
        const metasResponse = await http.get('/goals', {
          params: { mes, ano }
        });
        const metasData: any[] = Array.isArray(metasResponse.data) ? metasResponse.data : [];

        // Process leads by user
        const leadsMap: Record<string, LeadsByUser> = {};
        subordinates.forEach(sub => {
          leadsMap[sub.id] = {
            userId: sub.id,
            userName: sub.nome,
            total: 0,
            byFunil: {},
            credenciados: 0,
            tpvTotal: 0,
          };
        });

        leadsData?.forEach((lead: any) => {
          const leadUserId = lead.user?.id || lead.user_id;
          if (leadUserId && leadsMap[leadUserId]) {
            leadsMap[leadUserId].total++;
            const funil = lead.appFunnel || lead.funil_app || 1;
            leadsMap[leadUserId].byFunil[funil] = (leadsMap[leadUserId].byFunil[funil] || 0) + 1;
            if (lead.accreditation === 1 || lead.credenciado === 1) {
              leadsMap[leadUserId].credenciados++;
              leadsMap[leadUserId].tpvTotal += Number(lead.tpv) || 0;
            }
          }
        });

        setLeadsByUser(Object.values(leadsMap).sort((a, b) => b.total - a.total));

        // Process faturamento by user
        const faturamentoMap: Record<string, FaturamentoByUser> = {};
        subordinates.forEach(sub => {
          const meta = metasData?.find((m: any) => {
            const metaUserId = m.user?.id || m.user_id;
            return metaUserId === sub.id;
          });
          const leads = leadsMap[sub.id];
          
          const metaClientes = meta?.meta_clientes || 0;
          const metaValor = Number(meta?.meta_valor) || 0;
          
          faturamentoMap[sub.id] = {
            userId: sub.id,
            userName: sub.nome,
            totalCredenciados: leads?.credenciados || 0,
            tpvTotal: leads?.tpvTotal || 0,
            metaClientes,
            metaValor,
            atingimentoClientes: metaClientes > 0 ? ((leads?.credenciados || 0) / metaClientes) * 100 : 0,
            atingimentoValor: metaValor > 0 ? ((leads?.tpvTotal || 0) / metaValor) * 100 : 0,
          };
        });

        setFaturamentoByUser(Object.values(faturamentoMap).sort((a, b) => b.tpvTotal - a.tpvTotal));
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [subordinates, subsLoading, mes, ano]);

  // Chart data
  const leadsChartData = useMemo(() => {
    return leadsByUser.slice(0, 10).map(item => ({
      name: item.userName.split(' ')[0],
      leads: item.total,
      credenciados: item.credenciados,
    }));
  }, [leadsByUser]);

  const faturamentoChartData = useMemo(() => {
    return faturamentoByUser.slice(0, 10).map(item => ({
      name: item.userName.split(' ')[0],
      tpv: item.tpvTotal,
      meta: item.metaValor,
    }));
  }, [faturamentoByUser]);

  const funilDistribution = useMemo(() => {
    const totals: Record<number, number> = {};
    leadsByUser.forEach(user => {
      Object.entries(user.byFunil).forEach(([funil, count]) => {
        totals[Number(funil)] = (totals[Number(funil)] || 0) + count;
      });
    });
    
    return Object.entries(totals).map(([funil, count]) => {
      const stage = FUNIL.find(s => s.id === Number(funil));
      return {
        name: stage?.label || `Etapa ${funil}`,
        value: count,
        color: FUNIL_COLORS[Number(funil)] || '#888888',
      };
    });
  }, [leadsByUser]);

  const getProgressColor = (value: number) => {
    if (value >= 100) return 'text-green-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

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

  if (isLoading || subsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise de performance da equipe</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={`${mes}`} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, idx) => (
                <SelectItem key={idx} value={`${idx + 1}`}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={`${ano}`} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-24">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {leadsByUser.reduce((acc, u) => acc + u.total, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total de Leads</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {leadsByUser.reduce((acc, u) => acc + u.credenciados, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Credenciados</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(faturamentoByUser.reduce((acc, u) => acc + u.tpvTotal, 0))}
                </div>
                <div className="text-sm text-muted-foreground">TPV Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{subordinates.length}</div>
                <div className="text-sm text-muted-foreground">Comerciais</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leads" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leads">Leads por Comercial</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento por Comercial</TabsTrigger>
          <TabsTrigger value="funil">Distribuição do Funil</TabsTrigger>
        </TabsList>

        {/* Leads por Comercial */}
        <TabsContent value="leads" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leads por Comercial</CardTitle>
                <CardDescription>Top 10 comerciais por quantidade de leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="credenciados" name="Credenciados" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Tabela Detalhada</CardTitle>
                  <CardDescription>Todos os comerciais e seus leads</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(leadsByUser.map(u => ({
                  Comercial: u.userName,
                  Total: u.total,
                  Credenciados: u.credenciados,
                  TPV: u.tpvTotal,
                })), 'leads-por-comercial')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comercial</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">Credenciados</TableHead>
                        <TableHead className="text-right">Conversão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadsByUser.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">{user.userName}</TableCell>
                          <TableCell className="text-right">{user.total}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {user.credenciados}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {user.total > 0 ? ((user.credenciados / user.total) * 100).toFixed(1) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Faturamento por Comercial */}
        <TabsContent value="faturamento" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">TPV por Comercial</CardTitle>
                <CardDescription>Top 10 comerciais por valor faturado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={faturamentoChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="tpv" name="TPV Realizado" fill="#F58320" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="meta" name="Meta" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Atingimento de Metas</CardTitle>
                  <CardDescription>Performance vs metas definidas</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(faturamentoByUser.map(u => ({
                  Comercial: u.userName,
                  Credenciados: u.totalCredenciados,
                  'Meta Clientes': u.metaClientes,
                  'Atingimento Clientes': `${u.atingimentoClientes.toFixed(1)}%`,
                  TPV: u.tpvTotal,
                  'Meta Valor': u.metaValor,
                  'Atingimento Valor': `${u.atingimentoValor.toFixed(1)}%`,
                })), 'faturamento-por-comercial')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comercial</TableHead>
                        <TableHead className="text-right">TPV</TableHead>
                        <TableHead className="text-right">Meta Valor</TableHead>
                        <TableHead className="text-right">Atingimento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faturamentoByUser.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">{user.userName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(user.tpvTotal)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(user.metaValor)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress 
                                value={Math.min(user.atingimentoValor, 100)} 
                                className="w-16 h-2"
                              />
                              <span className={`text-sm font-medium ${getProgressColor(user.atingimentoValor)}`}>
                                {user.atingimentoValor.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribuição do Funil */}
        <TabsContent value="funil" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição do Funil</CardTitle>
                <CardDescription>Leads por etapa do funil de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={funilDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={true}
                      >
                        {funilDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhamento por Etapa</CardTitle>
                <CardDescription>Quantidade de leads em cada etapa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {funilDistribution.map((stage) => (
                  <div key={stage.name} className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded-full shrink-0" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{stage.name}</span>
                        <span className="text-muted-foreground">{stage.value} leads</span>
                      </div>
                      <Progress 
                        value={(stage.value / Math.max(...funilDistribution.map(s => s.value))) * 100} 
                        className="h-2"
                        style={{ '--progress-color': stage.color } as any}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
