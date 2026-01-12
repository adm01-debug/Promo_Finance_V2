import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { CheckCircle2, Trophy, Sparkles, PartyPopper, Banknote, TrendingUp } from 'lucide-react';
import { ReactNode } from 'react';

// Tipos de celebração
type CelebrationLevel = 'subtle' | 'normal' | 'epic';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  scalar?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

// Configurações de confetti por nível de celebração
const confettiConfigs: Record<CelebrationLevel, ConfettiOptions> = {
  subtle: {
    particleCount: 30,
    spread: 60,
    startVelocity: 20,
    decay: 0.95,
    gravity: 1.2,
    scalar: 0.8,
    origin: { x: 0.5, y: 0.6 },
  },
  normal: {
    particleCount: 80,
    spread: 100,
    startVelocity: 35,
    decay: 0.92,
    gravity: 1,
    scalar: 1,
    origin: { x: 0.5, y: 0.5 },
  },
  epic: {
    particleCount: 150,
    spread: 160,
    startVelocity: 45,
    decay: 0.9,
    gravity: 0.8,
    scalar: 1.2,
    origin: { x: 0.5, y: 0.4 },
  },
};

// Cores temáticas para confetti (hex required by canvas-confetti library)
const colorThemes = {
  success: ['#22c55e', '#16a34a', '#4ade80', '#86efac'],
  gold: ['#fbbf24', '#f59e0b', '#eab308', '#facc15'],
  celebration: ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'],
  money: ['#22c55e', '#10b981', '#34d399', '#fbbf24', '#f59e0b'],
  rainbow: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
} as const;

// Dispara o confetti
function fireConfetti(level: CelebrationLevel, theme: keyof typeof colorThemes = 'success') {
  const config = confettiConfigs[level];
  const colors = colorThemes[theme];

  // Primeiro disparo
  confetti({
    ...config,
    colors,
  });

  // Para níveis mais altos, disparos adicionais
  if (level === 'normal' || level === 'epic') {
    setTimeout(() => {
      confetti({
        ...config,
        particleCount: Math.floor(config.particleCount! * 0.5),
        origin: { x: 0.3, y: 0.6 },
        colors,
      });
    }, 100);

    setTimeout(() => {
      confetti({
        ...config,
        particleCount: Math.floor(config.particleCount! * 0.5),
        origin: { x: 0.7, y: 0.6 },
        colors,
      });
    }, 200);
  }

  // Para epic, mais efeitos
  if (level === 'epic') {
    // Chuva de estrelas
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 360,
        startVelocity: 20,
        decay: 0.95,
        gravity: 0.5,
        scalar: 2,
        shapes: ['star'],
        colors: colorThemes.gold,
        origin: { x: 0.5, y: 0.3 },
      });
    }, 300);

    // Disparo lateral esquerdo
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
    }, 400);

    // Disparo lateral direito
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });
    }, 500);
  }
}

interface CelebrationToastOptions {
  title: string;
  description?: string;
  icon?: ReactNode;
  duration?: number;
  level?: CelebrationLevel;
  theme?: keyof typeof colorThemes;
}

// Toast com confetti principal
export function toastWithConfetti({
  title,
  description,
  icon,
  duration = 4000,
  level = 'normal',
  theme = 'success',
}: CelebrationToastOptions) {
  // Dispara o confetti
  fireConfetti(level, theme);

  // Exibe o toast com estilo especial
  return toast.success(title, {
    description,
    duration,
    icon: icon || <Sparkles className="h-5 w-5 text-primary animate-pulse" />,
    className: 'celebration-toast',
  });
}

// Toasts específicos pré-configurados

// Pagamento confirmado
export function toastPaymentSuccess(value?: string) {
  fireConfetti('normal', 'money');
  
  return toast.success('Pagamento Confirmado!', {
    description: value ? `Valor: ${value}` : 'O pagamento foi registrado com sucesso.',
    duration: 4000,
    icon: <Banknote className="h-5 w-5 text-success" />,
  });
}

// Recebimento confirmado
export function toastReceiptSuccess(value?: string) {
  fireConfetti('normal', 'money');
  
  return toast.success('Recebimento Confirmado!', {
    description: value ? `Valor: ${value}` : 'O recebimento foi registrado com sucesso.',
    duration: 4000,
    icon: <TrendingUp className="h-5 w-5 text-success" />,
  });
}

// Meta atingida
export function toastGoalAchieved(goalName: string) {
  fireConfetti('epic', 'celebration');
  
  return toast.success('Meta Atingida!', {
    description: `Parabéns! Você atingiu a meta "${goalName}"`,
    duration: 6000,
    icon: <Trophy className="h-5 w-5 text-warning" />,
  });
}

// Aprovação concluída
export function toastApprovalSuccess(description?: string) {
  fireConfetti('normal', 'success');
  
  return toast.success('Aprovado com Sucesso!', {
    description: description || 'A solicitação foi aprovada.',
    duration: 4000,
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
  });
}

// Conciliação automática
export function toastReconciliationSuccess(count: number) {
  fireConfetti(count > 5 ? 'epic' : 'normal', 'success');
  
  return toast.success('Conciliação Concluída!', {
    description: `${count} ${count === 1 ? 'transação conciliada' : 'transações conciliadas'} com sucesso.`,
    duration: 5000,
    icon: <Sparkles className="h-5 w-5 text-primary" />,
  });
}

// Importação concluída
export function toastImportSuccess(count: number, type: string) {
  fireConfetti(count > 10 ? 'epic' : 'normal', 'success');
  
  return toast.success('Importação Concluída!', {
    description: `${count} ${type} ${count === 1 ? 'importado' : 'importados'} com sucesso.`,
    duration: 5000,
    icon: <PartyPopper className="h-5 w-5 text-primary" />,
  });
}

// Operação em lote concluída
export function toastBulkSuccess(count: number, action: string) {
  fireConfetti(count > 5 ? 'normal' : 'subtle', 'success');
  
  return toast.success(`${count} ${count === 1 ? 'item' : 'itens'} ${action}!`, {
    description: 'Operação concluída com sucesso.',
    duration: 4000,
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
  });
}

// Celebração genérica épica
export function toastEpicCelebration(title: string, description?: string) {
  fireConfetti('epic', 'rainbow');
  
  return toast.success(title, {
    description,
    duration: 6000,
    icon: <PartyPopper className="h-5 w-5 text-primary animate-bounce" />,
  });
}

// Primeiro acesso / onboarding
export function toastWelcome(userName?: string) {
  fireConfetti('epic', 'celebration');
  
  return toast.success(`Bem-vindo${userName ? `, ${userName}` : ''}!`, {
    description: 'Sua conta foi configurada com sucesso.',
    duration: 6000,
    icon: <PartyPopper className="h-5 w-5 text-primary" />,
  });
}
