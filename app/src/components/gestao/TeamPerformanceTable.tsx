import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceData {
  userId: string;
  nome: string;
  metaNC: number;
  realizadoNC: number;
  metaTPV: number;
  realizadoTPV: number;
  visitas: number;
  metaVisitas: number;
}

interface TeamPerformanceTableProps {
  data: PerformanceData[];
  isLoading?: boolean;
}

export function TeamPerformanceTable({ data, isLoading = false }: TeamPerformanceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500/10 text-green-700 border-green-500/30';
    if (percentage >= 60) return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30';
    return 'bg-red-500/10 text-red-700 border-red-500/30';
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 100) return <TrendingUp className="h-3 w-3" />;
    if (percentage >= 60) return <Minus className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  // Ordenar por TPV realizado (maior primeiro)
  const sortedData = [...data].sort((a, b) => b.realizadoTPV - a.realizadoTPV);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Performance da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Comercial</TableHead>
                <TableHead className="text-center">NC (Meta/Real)</TableHead>
                <TableHead className="text-center">TPV (Meta/Real)</TableHead>
                <TableHead className="text-center">Visitas</TableHead>
                <TableHead className="text-center">Ating. Geral</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><div className="h-4 w-4 bg-muted/20 rounded animate-pulse" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted/20 animate-pulse" />
                        <div className="h-4 w-24 bg-muted/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell><div className="h-4 w-16 mx-auto bg-muted/20 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-16 mx-auto bg-muted/20 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-12 mx-auto bg-muted/20 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-6 w-12 mx-auto bg-muted/20 rounded-full animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : (
                sortedData.map((row, index) => {
                  const ncPercentage = row.metaNC > 0 ? Math.round((row.realizadoNC / row.metaNC) * 100) : 0;
                  const tpvPercentage = row.metaTPV > 0 ? Math.round((row.realizadoTPV / row.metaTPV) * 100) : 0;
                  const visitasPercentage = row.metaVisitas > 0 ? Math.round((row.visitas / row.metaVisitas) * 100) : 0;

                  // Atingimento geral é a média ponderada (TPV tem peso maior)
                  const atingimentoGeral = Math.round((ncPercentage + tpvPercentage * 2 + visitasPercentage) / 4);

                  return (
                    <TableRow key={row.userId} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {row.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="truncate max-w-[120px]">{row.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm">
                            {row.realizadoNC}/{row.metaNC}
                          </span>
                          <Badge variant="outline" className={`text-xs ${getPercentageColor(ncPercentage)}`}>
                            {ncPercentage}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm">
                            {formatCurrency(row.realizadoTPV)}/{formatCurrency(row.metaTPV)}
                          </span>
                          <Badge variant="outline" className={`text-xs ${getPercentageColor(tpvPercentage)}`}>
                            {tpvPercentage}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm">{row.visitas}/{row.metaVisitas}</span>
                          <Badge variant="outline" className={`text-xs ${getPercentageColor(visitasPercentage)}`}>
                            {visitasPercentage}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`${getPercentageColor(atingimentoGeral)} flex items-center gap-1 justify-center`}
                        >
                          {getTrendIcon(atingimentoGeral)}
                          {atingimentoGeral}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                }))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
