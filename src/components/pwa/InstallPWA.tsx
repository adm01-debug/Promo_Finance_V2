import { useState, useEffect, forwardRef } from 'react';
import { Button } from '@/components/ui/button';

// BeforeInstallPromptEvent is not in the standard DOM types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA = forwardRef<HTMLButtonElement>(function InstallPWA(_props, ref) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    }
  };
  
  return installPrompt ? (
    <Button ref={ref} onClick={handleInstall} size="sm">
      Instalar App
    </Button>
  ) : null;
});
