import { Trophy, TrendingUp, Users, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface UserStats {
  userId: string;
  nome: string;
  leads: {
    total: number;
    credenciados: number;
    tpvTotal: number;
  };
  visitas: {
    total: number;
  };
  metas: {
    metaClientes: number;
    realizadoClientes: number;
    metaValor: number;
    realizadoValor: number;
    metaVisitas: number;
    realizadoVisitas: number;
  };
}

interface MonthlyHighlightCardProps {
  users: UserStats[];
  isLoading?: boolean;
}

export function MonthlyHighlightCard({ users, isLoading = false }: MonthlyHighlightCardProps) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-primary/20">
        <CardContent className="relative p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 bg-muted/20 rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted/20 rounded animate-pulse" />
            <div className="ml-auto h-6 w-24 bg-muted/20 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-muted/20 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-48 bg-muted/20 rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted/20 rounded animate-pulse" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-muted/20 animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-5 w-16 bg-muted/20 rounded animate-pulse" />
                      <div className="h-3 w-10 bg-muted/20 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!users.length) return null;

  // Encontrar o melhor performer (maior TPV credenciado)
  const topPerformer = users.reduce((best, current) => {
    const currentScore = current.leads.tpvTotal;
    const bestScore = best.leads.tpvTotal;
    return currentScore > bestScore ? current : best;
  }, users[0]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Calcular percentual de atingimento da meta
  const metaPercentual = topPerformer.metas.metaValor > 0
    ? Math.round((topPerformer.metas.realizadoValor / topPerformer.metas.metaValor) * 100)
    : 0;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <CardContent className="relative p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium text-muted-foreground">Destaque do Mês</span>
          <Badge variant="secondary" className="ml-auto bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            ⭐ Top Performer
          </Badge>
        </div>

        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-lg">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {getInitials(topPerformer.nome)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {topPerformer.nome}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {metaPercentual}% da meta de faturamento atingida
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(topPerformer.leads.tpvTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">TPV</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {topPerformer.leads.credenciados}
                  </p>
                  <p className="text-xs text-muted-foreground">Credenciados</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {topPerformer.visitas.total}
                  </p>
                  <p className="text-xs text-muted-foreground">Visitas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
