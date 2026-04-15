import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Smartphone, Download } from 'lucide-react';

interface PwaInstallPromptProps {
  onInstall: () => Promise<boolean>;
  onDismiss: () => void;
  show: boolean;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_COUNT_KEY = 'pwa-install-dismiss-count';
const MAX_DISMISSALS = 3;

export const PwaInstallPrompt = ({ onInstall, onDismiss, show }: PwaInstallPromptProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (!show) return;

    // Check if user has dismissed too many times
    const dismissCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0');
    if (dismissCount >= MAX_DISMISSALS) {
      return;
    }

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return;
      }
    }

    // Show the prompt
    setIsOpen(true);
  }, [show]);

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await onInstall();
    setIsInstalling(false);

    if (success) {
      setIsOpen(false);
      localStorage.removeItem(DISMISS_KEY);
      localStorage.removeItem(DISMISS_COUNT_KEY);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);

    // Track dismissal
    const currentCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0');
    localStorage.setItem(DISMISS_COUNT_KEY, (currentCount + 1).toString());
    localStorage.setItem(DISMISS_KEY, Date.now().toString());

    onDismiss();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Smartphone className="h-12 w-12 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Instale o HERMES - Opay
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Tenha acesso rápido ao HERMES direto da sua tela inicial.
            Funciona offline e oferece uma experiência nativa de aplicativo!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 py-4">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="font-medium text-sm">Acesso rápido</p>
              <p className="text-xs text-muted-foreground">Ícone na tela inicial</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="font-medium text-sm">Experiência nativa</p>
              <p className="text-xs text-muted-foreground">Como um app instalado</p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleDismiss} disabled={isInstalling}>
            Depois
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleInstall}
            disabled={isInstalling}
            className="gap-2"
          >
            {isInstalling ? (
              <>Instalando...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Instalar Agora
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
