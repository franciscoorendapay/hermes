import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserPerformance {
  userId: string;
  nome: string;
  metaNC: number;
  realizadoNC: number;
  metaTPV: number;
  realizadoTPV: number;
}

interface PerformanceTableProps {
  data: UserPerformance[];
}

export function PerformanceTable({ data }: PerformanceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getPercentage = (realizado: number, meta: number) => {
    if (meta === 0) return 0;
    return Math.round((realizado / meta) * 100);
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
          <TrendingUp className="h-3 w-3" />
          {percentage}%
        </Badge>
      );
    }
    if (percentage >= 60) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 gap-1">
          <Minus className="h-3 w-3" />
          {percentage}%
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 gap-1">
        <TrendingDown className="h-3 w-3" />
        {percentage}%
      </Badge>
    );
  };

  // Calcular totais
  const totals = data.reduce(
    (acc, user) => ({
      metaNC: acc.metaNC + user.metaNC,
      realizadoNC: acc.realizadoNC + user.realizadoNC,
      metaTPV: acc.metaTPV + user.metaTPV,
      realizadoTPV: acc.realizadoTPV + user.realizadoTPV,
    }),
    { metaNC: 0, realizadoNC: 0, metaTPV: 0, realizadoTPV: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          📊 Performance da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Comercial</TableHead>
                <TableHead className="text-center font-semibold">Meta NC</TableHead>
                <TableHead className="text-center font-semibold">Realiz. NC</TableHead>
                <TableHead className="text-center font-semibold">% Conv NC</TableHead>
                <TableHead className="text-right font-semibold">Meta TPV</TableHead>
                <TableHead className="text-right font-semibold">Realiz. TPV</TableHead>
                <TableHead className="text-center font-semibold">% Ating.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum comercial encontrado
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.map((user) => {
                    const pctNC = getPercentage(user.realizadoNC, user.metaNC);
                    const pctTPV = getPercentage(user.realizadoTPV, user.metaTPV);
                    return (
                      <TableRow key={user.userId} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell className="text-center">{user.metaNC}</TableCell>
                        <TableCell className="text-center font-semibold">{user.realizadoNC}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(pctNC)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(user.metaTPV)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(user.realizadoTPV)}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(pctTPV)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Linha de Total */}
                  <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                    <TableCell className="font-bold text-primary">TOTAL</TableCell>
                    <TableCell className="text-center">{totals.metaNC}</TableCell>
                    <TableCell className="text-center">{totals.realizadoNC}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(getPercentage(totals.realizadoNC, totals.metaNC))}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.metaTPV)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.realizadoTPV)}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(getPercentage(totals.realizadoTPV, totals.metaTPV))}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
