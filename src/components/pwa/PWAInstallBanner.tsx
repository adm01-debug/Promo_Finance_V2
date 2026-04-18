import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function PWAInstallBanner() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      role="region"
      aria-label="Instalar aplicativo"
      className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-lg md:bottom-4"
    >
      <Download className="h-4 w-4 text-primary" aria-hidden="true" />
      <span className="text-sm text-foreground">Instalar Promo Finance</span>
      <Button size="sm" onClick={() => void promptInstall()} aria-label="Instalar aplicativo agora">
        Instalar
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={dismiss}
        aria-label="Dispensar banner de instalação"
        className="h-7 w-7"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
