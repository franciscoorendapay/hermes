import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface CommercialHeroCardProps {
  nome: string;
  metaValor: number;
  realizadoValor: number;
}

export function CommercialHeroCard({ 
  nome, 
  metaValor,
  realizadoValor 
}: CommercialHeroCardProps) {
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const metaPercentual = metaValor > 0 
    ? Math.round((realizadoValor / metaValor) * 100) 
    : 0;

  const getMetaColor = () => {
    if (metaPercentual >= 100) return 'text-green-500';
    if (metaPercentual >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMetaBadge = () => {
    if (metaPercentual >= 100) return { text: 'Meta Atingida!', variant: 'default' as const };
    if (metaPercentual >= 60) return { text: 'Em progresso', variant: 'secondary' as const };
    return { text: 'Atenção', variant: 'destructive' as const };
  };

  const badge = getMetaBadge();

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar e Nome */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-primary/30 shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {getInitials(nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-foreground">{nome}</h2>
              <p className="text-sm text-muted-foreground">Comercial</p>
            </div>
          </div>

          {/* Percentual de Meta */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className={`h-6 w-6 ${getMetaColor()}`} />
              <span className={`text-4xl font-bold ${getMetaColor()}`}>
                {metaPercentual}%
              </span>
            </div>
            <p className="text-muted-foreground text-sm">da meta de faturamento</p>
            <Badge variant={badge.variant} className="mt-2">
              {badge.text}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
