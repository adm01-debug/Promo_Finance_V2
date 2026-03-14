import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2,
  Landmark,
  Users,
  FileText,
  ArrowRight,
  Trophy,
  X,
  Clock,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  completed: boolean;
  estimatedMinutes: number;
}

const CHECKLIST_KEY = 'promo-financeiro-onboarding-checklist';
const CHECKLIST_DISMISSED_KEY = 'promo-financeiro-onboarding-dismissed';

const defaultChecklist: Omit<ChecklistItem, 'completed'>[] = [
  {
    id: 'empresa',
    title: 'Cadastrar sua empresa',
    description: 'Configure o CNPJ principal e dados da empresa',
    icon: Building2,
    href: '/empresas',
    estimatedMinutes: 3,
  },
  {
    id: 'conta-bancaria',
    title: 'Adicionar conta bancária',
    description: 'Conecte suas contas para conciliação automática',
    icon: Landmark,
    href: '/contas-bancarias',
    estimatedMinutes: 2,
  },
  {
    id: 'cliente',
    title: 'Cadastrar primeiro cliente',
    description: 'Adicione clientes para emitir cobranças',
    icon: Users,
    href: '/clientes',
    estimatedMinutes: 2,
  },
  {
    id: 'conta-receber',
    title: 'Criar conta a receber',
    description: 'Registre sua primeira receita no sistema',
    icon: FileText,
    href: '/contas-receber',
    estimatedMinutes: 1,
  },
];

// Confetti particles component
function ConfettiParticles() {
  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--accent))',
    '#FFD700',
    '#FF6B6B',
  ];
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: 300,
            opacity: 0,
            rotate: Math.random() * 720 - 360,
            x: Math.random() * 200 - 100,
          }}
          transition={{
            duration: 1.5 + Math.random() * 1,
            delay: Math.random() * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export const OnboardingChecklist = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(CHECKLIST_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    const saved = localStorage.getItem(CHECKLIST_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChecklist(defaultChecklist.map(item => ({
          ...item,
          completed: parsed[item.id] || false,
        })));
      } catch {
        setChecklist(defaultChecklist.map(item => ({ ...item, completed: false })));
      }
    } else {
      setChecklist(defaultChecklist.map(item => ({ ...item, completed: false })));
    }
  }, []);

  const saveChecklist = useCallback((items: ChecklistItem[]) => {
    const state: Record<string, boolean> = {};
    items.forEach(item => {
      state[item.id] = item.completed;
    });
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
  }, []);

  const toggleItem = (id: string) => {
    const updated = checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    saveChecklist(updated);

    // Show per-item celebration
    const item = updated.find(i => i.id === id);
    if (item?.completed) {
      setJustCompleted(id);
      setTimeout(() => setJustCompleted(null), 1500);
    }

    // Check if all completed
    if (updated.every(item => item.completed)) {
      setTimeout(() => {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      }, 500);
    }
  };

  const goToItem = (href: string) => {
    navigate(href);
  };

  const dismissChecklist = () => {
    localStorage.setItem(CHECKLIST_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const totalItems = checklist.length;
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
  const remainingMinutes = checklist
    .filter(item => !item.completed)
    .reduce((sum, item) => sum + item.estimatedMinutes, 0);

  if (isDismissed || (totalItems > 0 && completedCount === totalItems)) {
    return null;
  }

  return (
    <>
      {/* Full celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <ConfettiParticles />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-xl relative overflow-hidden"
            >
              <ConfettiParticles />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 15, -15, 0],
                }}
                transition={{ duration: 0.6, repeat: 2 }}
              >
                <Trophy className="h-16 w-16 text-warning mx-auto drop-shadow-[0_0_12px_hsl(var(--warning)/0.5)]" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold flex items-center justify-center gap-2">
                  <PartyPopper className="h-6 w-6 text-primary" />
                  Parabéns!
                  <PartyPopper className="h-6 w-6 text-primary scale-x-[-1]" />
                </h2>
                <p className="text-muted-foreground">
                  Você completou a configuração inicial do sistema!
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Agora explore todas as funcionalidades do Dashboard.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checklist widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl shadow-md overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-accent/10 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Configuração Inicial</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {completedCount} de {totalItems} concluídos
                </p>
                {remainingMinutes > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                    <Clock className="h-2.5 w-2.5" />
                    ~{remainingMinutes} min restantes
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                dismissChecklist();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="px-4 py-2">
          <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: progress === 100
                  ? 'hsl(var(--success))'
                  : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Shimmer effect on progress bar */}
            {progress > 0 && progress < 100 && (
              <motion.div
                className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ left: ['-10%', '110%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground/50">{Math.round(progress)}%</span>
            <span className="text-[10px] text-muted-foreground/50">{completedCount}/{totalItems}</span>
          </div>
        </div>

        {/* Checklist items */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {checklist.map((item, index) => {
                  const Icon = item.icon;
                  const isJustDone = justCompleted === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg transition-all duration-300 relative overflow-hidden',
                        item.completed
                          ? 'bg-success/10'
                          : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      {/* Per-item celebration flash */}
                      {isJustDone && (
                        <motion.div
                          initial={{ opacity: 0.5, scale: 0.5 }}
                          animate={{ opacity: 0, scale: 2 }}
                          transition={{ duration: 0.8 }}
                          className="absolute inset-0 bg-success/20 rounded-lg"
                        />
                      )}
                      
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="flex-shrink-0 mt-0.5"
                      >
                        <motion.div
                          animate={isJustDone ? { scale: [1, 1.3, 1], rotate: [0, 10, 0] } : {}}
                          transition={{ duration: 0.4 }}
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </motion.div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium text-sm',
                            item.completed && 'line-through text-muted-foreground'
                          )}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                        {!item.completed && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 mt-1">
                            <Clock className="h-2.5 w-2.5" />
                            ~{item.estimatedMinutes} min
                          </span>
                        )}
                      </div>
                      {!item.completed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0 hover:text-primary hover:bg-primary/10"
                          onClick={() => goToItem(item.href)}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
