import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface UserVisitas {
  userId: string;
  nome: string;
  metaNC: number;
  realizadoNC: number;
  visitas: number;
}

interface VisitasConversaoTableProps {
  data: UserVisitas[];
}

export function VisitasConversaoTable({ data }: VisitasConversaoTableProps) {
  const getConversao = (realizadoNC: number, visitas: number) => {
    if (visitas === 0) return 0;
    return Math.round((realizadoNC / visitas) * 100);
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 50) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
          <TrendingUp className="h-3 w-3" />
          {percentage}%
        </Badge>
      );
    }
    if (percentage >= 25) {
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
      visitas: acc.visitas + user.visitas,
    }),
    { metaNC: 0, realizadoNC: 0, visitas: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          📈 Visitas e Conversão
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
                <TableHead className="text-center font-semibold">Visitas</TableHead>
                <TableHead className="text-center font-semibold">Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum comercial encontrado
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.map((user) => {
                    const conversao = getConversao(user.realizadoNC, user.visitas);
                    return (
                      <TableRow key={user.userId} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell className="text-center">{user.metaNC}</TableCell>
                        <TableCell className="text-center font-semibold">{user.realizadoNC}</TableCell>
                        <TableCell className="text-center">{user.visitas}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(conversao)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Linha de Total */}
                  <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                    <TableCell className="font-bold text-primary">TOTAL</TableCell>
                    <TableCell className="text-center">{totals.metaNC}</TableCell>
                    <TableCell className="text-center">{totals.realizadoNC}</TableCell>
                    <TableCell className="text-center">{totals.visitas}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(getConversao(totals.realizadoNC, totals.visitas))}
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
