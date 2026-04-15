import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { Button } from '@/components/ui/button';

export function ImpersonationBanner() {
  const { impersonatedUser, isImpersonating, stopImpersonation } = useAuthStore();

  if (!isImpersonating || !impersonatedUser) return null;

  return (
    <div className="bg-amber-500/10 border-y border-amber-500/30 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Visualizando como: <span className="font-bold">{impersonatedUser.name}</span> ({impersonatedUser.email})
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonation}
          className="bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 dark:bg-amber-900 dark:hover:bg-amber-800 dark:border-amber-700 dark:text-amber-100"
        >
          Voltar para modo admin
        </Button>
      </div>
    </div>
  );
}
