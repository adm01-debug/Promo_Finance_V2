import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => {
        setInstallPrompt(null);
      });
    }
  };
  
  return installPrompt ? (
    <Button onClick={handleInstall} size="sm">
      Instalar App
    </Button>
  ) : null;
}
