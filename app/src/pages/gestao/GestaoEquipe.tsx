import { useNavigate } from 'react-router-dom';
import { EquipeTable } from '@/components/gestao/EquipeTable';
import { useGestaoStats } from '@/hooks/useGestaoStats';
import { Skeleton } from '@/components/ui/skeleton';

export default function GestaoEquipe() {
  const navigate = useNavigate();
  const { porUsuario, isLoading } = useGestaoStats();

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
        <p className="text-muted-foreground">Visualize a performance de cada comercial</p>
      </div>

      <EquipeTable
        data={porUsuario}
        onViewUser={(userId) => navigate(`/gestao?user=${userId}`)}
      />
    </div>
  );
}
