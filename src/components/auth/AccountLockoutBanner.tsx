import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface AccountLockoutBannerProps {
  locked: boolean;
  remainingMinutes?: number;
}

export function AccountLockoutBanner({ locked, remainingMinutes = 0 }: AccountLockoutBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState(remainingMinutes * 60);

  useEffect(() => {
    setSecondsLeft(remainingMinutes * 60);
  }, [remainingMinutes]);

  useEffect(() => {
    if (!locked || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked, secondsLeft]);

  if (!locked) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = remainingMinutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 100;

  return (
    <Alert variant="error" className="mb-4 border-destructive/50 bg-destructive/10">
      <ShieldAlert className="h-5 w-5" />
      <AlertTitle className="font-bold">Conta Temporariamente Bloqueada</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Sua conta foi bloqueada por excesso de tentativas de login incorretas.
        </p>
        {secondsLeft > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold text-lg">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-sm">restantes</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : (
          <p className="text-sm font-medium">
            O bloqueio expirou. Tente novamente com suas credenciais corretas.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Se você não reconhece estas tentativas, entre em contato com o administrador.
        </p>
      </AlertDescription>
    </Alert>
  );
}
