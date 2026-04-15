import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, MonitorSmartphone } from 'lucide-react';

const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
};

const isPwaInstalled = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIosStandalone = (window.navigator as any).standalone === true;
  return isStandalone || isIosStandalone;
};

interface MobilePwaBlockerProps {
  onInstall?: () => Promise<boolean>;
}

export const MobilePwaBlocker = ({ onInstall }: MobilePwaBlockerProps) => {
  const [shouldBlock, setShouldBlock] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isMobile = isMobileDevice();
    const isInstalled = isPwaInstalled();
    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

    setIsIos(isIosDevice);
    
    // Check if user dismissed the blocker previously
    const wasDismissed = localStorage.getItem('pwa_blocker_dismissed') === 'true';
    if (wasDismissed) {
      setDismissed(true);
    }
    
    setShouldBlock(isMobile && !isInstalled);
  }, []);

  const handleInstall = async () => {
    if (onInstall) {
      await onInstall();
    }
  };

  if (!shouldBlock || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa_blocker_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-6 bg-primary/10 rounded-full">
            <MonitorSmartphone className="h-20 w-20 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            HERMES - Opay
          </h1>
          <p className="text-muted-foreground">
            Aplicativo Mobile
          </p>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <p className="text-lg">
            Este sistema foi desenvolvido para uso mobile através do aplicativo PWA.
          </p>
          <p className="text-sm text-muted-foreground">
            Para melhor experiência e performance, instale o aplicativo em seu dispositivo.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3 text-left bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Instalação gratuita</p>
              <p className="text-xs text-muted-foreground">Não ocupa espaço como apps tradicionais</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Funciona offline</p>
              <p className="text-xs text-muted-foreground">Continue trabalhando sem internet</p>
            </div>
          </div>
        </div>

        {/* Install Instructions */}
        {isIos ? (
          <div className="space-y-4 bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
            <p className="font-semibold text-sm">Como instalar no iOS:</p>
            <ol className="text-left text-sm space-y-2 list-decimal list-inside">
              <li>Toque no botão <strong>Compartilhar</strong> (ícone quadrado com seta) na barra inferior</li>
              <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
              <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
              <li>Abra o app pela tela inicial</li>
            </ol>
          </div>
        ) : (
          <Button
            onClick={handleInstall}
            size="lg"
            className="w-full gap-2"
          >
            <Download className="h-5 w-5" />
            Instalar Aplicativo
          </Button>
        )}

        {/* Footer */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Instale o app para a melhor experiência
          </p>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground">
            Continuar pelo navegador
          </Button>
        </div>
      </div>
    </div>
  );
};
