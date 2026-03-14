import { useMemo, useEffect, useState } from 'react';
import { Check, X, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface PasswordStrengthIndicatorProps {
  password: string;
  onStrengthChange?: (isStrong: boolean, isLeaked: boolean) => void;
}

interface Criterion {
  label: string;
  met: boolean;
  required?: boolean;
}

// Check password against Have I Been Pwned API using k-anonymity
async function checkLeakedPassword(password: string): Promise<{ leaked: boolean; count: number }> {
  if (!password || password.length < 4) return { leaked: false, count: 0 };
  
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Send only first 5 characters (k-anonymity)
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) return { leaked: false, count: 0 };
    
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return { leaked: true, count: parseInt(count.trim(), 10) };
      }
    }
    
    return { leaked: false, count: 0 };
  } catch (error: unknown) {
    logger.error('Error checking password:', error);
    return { leaked: false, count: 0 };
  }
}

export function PasswordStrengthIndicator({ password, onStrengthChange }: PasswordStrengthIndicatorProps) {
  const [leakCheck, setLeakCheck] = useState<{ checking: boolean; leaked: boolean; count: number }>({
    checking: false,
    leaked: false,
    count: 0
  });

  const analysis = useMemo(() => {
    const criteria: Criterion[] = [
      { label: 'Mínimo 8 caracteres', met: password.length >= 8, required: true },
      { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
      { label: 'Letra minúscula', met: /[a-z]/.test(password) },
      { label: 'Número', met: /[0-9]/.test(password) },
      { label: 'Caractere especial (!@#$%&*)', met: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password), required: true },
    ];

    const metCount = criteria.filter(c => c.met).length;
    const requiredMet = criteria.filter(c => c.required).every(c => c.met);
    const strength = (metCount / criteria.length) * 100;

    let level: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    let label = 'Fraca';
    let color = 'bg-destructive';

    if (strength >= 80 && requiredMet) {
      level = 'strong';
      label = 'Forte';
      color = 'bg-success';
    } else if (strength >= 60 && requiredMet) {
      level = 'good';
      label = 'Boa';
      color = 'bg-primary';
    } else if (strength >= 40) {
      level = 'fair';
      label = 'Média';
      color = 'bg-warning';
    }

    return { criteria, strength, level, label, color, requiredMet };
  }, [password]);

  // Debounced leak check
  useEffect(() => {
    if (password.length < 8) {
      setLeakCheck({ checking: false, leaked: false, count: 0 });
      return;
    }

    setLeakCheck(prev => ({ ...prev, checking: true }));
    
    const timeoutId = setTimeout(async () => {
      const result = await checkLeakedPassword(password);
      setLeakCheck({ checking: false, leaked: result.leaked, count: result.count });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [password]);

  // Notify parent of strength changes
  useEffect(() => {
    if (onStrengthChange) {
      const isStrong = analysis.requiredMet && analysis.level !== 'weak';
      onStrengthChange(isStrong, leakCheck.leaked);
    }
  }, [analysis.requiredMet, analysis.level, leakCheck.leaked, onStrengthChange]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Leaked password warning */}
      {leakCheck.leaked && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
          <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">
              Senha comprometida!
            </p>
            <p className="text-destructive/80 text-xs">
              Esta senha foi encontrada em {leakCheck.count.toLocaleString()} vazamentos de dados. 
              Escolha uma senha diferente.
            </p>
          </div>
        </div>
      )}

      {/* Barra de progresso */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            Força da senha
            {leakCheck.checking && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
          </span>
          <span className={cn(
            'font-medium',
            leakCheck.leaked && 'text-red-500',
            !leakCheck.leaked && analysis.level === 'weak' && 'text-red-500',
            !leakCheck.leaked && analysis.level === 'fair' && 'text-yellow-500',
            !leakCheck.leaked && analysis.level === 'good' && 'text-blue-500',
            !leakCheck.leaked && analysis.level === 'strong' && 'text-green-500'
          )}>
            {leakCheck.leaked ? 'Comprometida' : analysis.label}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out rounded-full',
              leakCheck.leaked ? 'bg-red-500' : analysis.color
            )}
            style={{ width: `${leakCheck.leaked ? 100 : analysis.strength}%` }}
          />
        </div>
      </div>

      {/* Critérios */}
      <div className="grid grid-cols-2 gap-1.5">
        {analysis.criteria.map((criterion, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors',
              criterion.met ? 'text-green-600 dark:text-green-400' : 
                criterion.required ? 'text-red-500' : 'text-muted-foreground'
            )}
          >
            {criterion.met ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0" />
            )}
            <span>
              {criterion.label}
              {criterion.required && !criterion.met && ' *'}
            </span>
          </div>
        ))}
      </div>

      {/* Verificação de vazamento */}
      <div className={cn(
        'flex items-center gap-1.5 text-xs',
        leakCheck.checking && 'text-muted-foreground',
        !leakCheck.checking && !leakCheck.leaked && password.length >= 8 && 'text-green-600 dark:text-green-400',
        leakCheck.leaked && 'text-red-500'
      )}>
        {leakCheck.checking ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Verificando vazamentos...</span>
          </>
        ) : password.length >= 8 ? (
          leakCheck.leaked ? (
            <>
              <AlertTriangle className="h-3 w-3" />
              <span>Senha encontrada em vazamentos</span>
            </>
          ) : (
            <>
              <Check className="h-3 w-3" />
              <span>Senha não encontrada em vazamentos</span>
            </>
          )
        ) : null}
      </div>
    </div>
  );
}
