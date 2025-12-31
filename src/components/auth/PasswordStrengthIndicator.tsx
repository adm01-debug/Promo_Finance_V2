import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Criterion {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const analysis = useMemo(() => {
    const criteria: Criterion[] = [
      { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
      { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
      { label: 'Letra minúscula', met: /[a-z]/.test(password) },
      { label: 'Número', met: /[0-9]/.test(password) },
      { label: 'Caractere especial (!@#$%)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const metCount = criteria.filter(c => c.met).length;
    const strength = (metCount / criteria.length) * 100;

    let level: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    let label = 'Fraca';
    let color = 'bg-red-500';

    if (strength >= 80) {
      level = 'strong';
      label = 'Forte';
      color = 'bg-green-500';
    } else if (strength >= 60) {
      level = 'good';
      label = 'Boa';
      color = 'bg-blue-500';
    } else if (strength >= 40) {
      level = 'fair';
      label = 'Média';
      color = 'bg-yellow-500';
    }

    return { criteria, strength, level, label, color };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Barra de progresso */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn(
            'font-medium',
            analysis.level === 'weak' && 'text-red-500',
            analysis.level === 'fair' && 'text-yellow-500',
            analysis.level === 'good' && 'text-blue-500',
            analysis.level === 'strong' && 'text-green-500'
          )}>
            {analysis.label}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out rounded-full',
              analysis.color
            )}
            style={{ width: `${analysis.strength}%` }}
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
              criterion.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
            )}
          >
            {criterion.met ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0" />
            )}
            <span>{criterion.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
