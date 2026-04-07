import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { logsService } from '@/features/admin/logs.service';
import type { Log, LogStats } from '@/features/admin/logs.types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const levelConfig = {
  INFO: {
    label: 'Info',
    icon: Info,
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    bgClass: 'bg-blue-500/10',
  },
  WARNING: {
    label: 'Atenção',
    icon: AlertTriangle,
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    bgClass: 'bg-yellow-500/10',
  },
  ERROR: {
    label: 'Erro',
    icon: AlertCircle,
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
    bgClass: 'bg-red-500/10',
  },
  CRITICAL: {
    label: 'Crítico',
    icon: XCircle,
    className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    bgClass: 'bg-purple-500/10',
  },
};

const categoryLabels = {
  visit: 'Visita',
  accreditation: 'Credenciamento',
  api_error: 'Erro de API',
  api_request: 'Requisição API',
  system: 'Sistema',
  auth: 'Autenticação',
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);

      const filters: any = { limit: 100 };
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (levelFilter !== 'all') filters.level = levelFilter;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const [logsData, statsData] = await Promise.all([
        logsService.fetchLogs(filters),
        logsService.fetchStats(dateFrom || undefined, dateTo || undefined),
      ]);

      setLogs(logsData.logs);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, levelFilter, dateFrom, dateTo]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.message.toLowerCase().includes(query) ||
      log.category.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Logs do Sistema"
        description="Monitore atividades, erros e eventos do sistema"
        showBack
        backTo="/admin"
      >
        <Button
          onClick={loadData}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </PageHeader>

      {/* Statistics Cards — labels always visible, values skeleton when loading */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total de Logs', icon: <Activity className="h-4 w-4 text-muted-foreground" />, value: stats?.total_logs, color: '', sub: `Últimos ${dateFrom && dateTo ? 'filtrados' : '30 dias'}` },
          { title: 'Erros', icon: <AlertCircle className="h-4 w-4 text-red-500" />, value: stats ? (stats.by_level.ERROR || 0) + (stats.by_level.CRITICAL || 0) : undefined, color: 'text-red-500', sub: stats ? `${stats.by_level.ERROR || 0} erros, ${stats.by_level.CRITICAL || 0} críticos` : '' },
          { title: 'Avisos', icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />, value: stats?.by_level.WARNING, color: 'text-yellow-500', sub: 'Requer atenção' },
          { title: 'Info', icon: <Info className="h-4 w-4 text-blue-500" />, value: stats?.by_level.INFO, color: 'text-blue-500', sub: 'Logs informativos' },
        ].map(({ title, icon, value, color, sub }) => (
          <Card key={title} className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              {icon}
            </CardHeader>
            <CardContent>
              {isLoading
                ? <Skeleton className="h-8 w-16 mb-2" />
                : <div className={`text-2xl font-bold ${color}`}>{(value ?? 0).toLocaleString()}</div>
              }
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Errors */}
      {!isLoading && stats && stats.top_errors.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              Erros Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.top_errors.slice(0, 5).map((error, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <p className="text-sm flex-1 truncate">{error.message}</p>
                  <Badge variant="outline" className="ml-2">
                    {error.count}x
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="visit">Visitas</SelectItem>
                <SelectItem value="accreditation">Credenciamentos</SelectItem>
                <SelectItem value="api_error">Erros de API</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Níveis</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARNING">Atenção</SelectItem>
                <SelectItem value="ERROR">Erro</SelectItem>
                <SelectItem value="CRITICAL">Crítico</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="De"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Até"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full max-w-[400px]" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const config = levelConfig[log.level as keyof typeof levelConfig];
                const LevelIcon = config.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className={`h-10 w-10 rounded-full ${config.bgClass} flex items-center justify-center`}>
                      <LevelIcon className={`h-5 w-5 ${config.className.split(' ')[1]}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[log.category as keyof typeof categoryLabels] || log.category}
                        </Badge>
                        <Badge variant="outline" className={`${config.className} text-xs`}>
                          {config.label}
                        </Badge>
                        {log.user && (
                          <span className="text-xs text-muted-foreground">
                            {log.user.name}
                          </span>
                        )}
                      </div>
                      <p className="font-medium truncate">{log.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.action} • {formatDate(log.created_at)}
                      </p>
                    </div>

                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Log</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-full ${levelConfig[selectedLog.level as keyof typeof levelConfig].bgClass
                      } flex items-center justify-center`}
                  >
                    {React.createElement(
                      levelConfig[selectedLog.level as keyof typeof levelConfig].icon,
                      {
                        className: `h-6 w-6 ${levelConfig[selectedLog.level as keyof typeof levelConfig].className.split(' ')[1]
                          }`,
                      }
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={levelConfig[selectedLog.level as keyof typeof levelConfig].className}
                      >
                        {levelConfig[selectedLog.level as keyof typeof levelConfig].label}
                      </Badge>
                      <Badge variant="outline">
                        {categoryLabels[selectedLog.category as keyof typeof categoryLabels] || selectedLog.category}
                      </Badge>
                    </div>
                    <p className="font-semibold">{selectedLog.message}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Ação</p>
                    <p className="font-medium">{selectedLog.action}</p>
                  </div>

                  {selectedLog.user && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Usuário</p>
                      <p className="font-medium">{selectedLog.user.name}</p>
                    </div>
                  )}

                  {selectedLog.entity_type && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Tipo de Entidade</p>
                        <p className="font-medium">{selectedLog.entity_type}</p>
                      </div>
                      {selectedLog.entity_id && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">ID da Entidade</p>
                          <p className="font-mono text-xs truncate">{selectedLog.entity_id}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Data e Hora</p>
                    <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                  </div>

                  {selectedLog.ip_address && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">IP</p>
                        <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                      </div>
                      {selectedLog.user_agent && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">User Agent</p>
                          <p className="text-xs truncate">{selectedLog.user_agent}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Context JSON */}
                  {selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Contexto (JSON)</p>
                      <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
