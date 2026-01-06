import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  completed: boolean;
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
  },
  {
    id: 'conta-bancaria',
    title: 'Adicionar conta bancária',
    description: 'Conecte suas contas para conciliação automática',
    icon: Landmark,
    href: '/contas-bancarias',
  },
  {
    id: 'cliente',
    title: 'Cadastrar primeiro cliente',
    description: 'Adicione clientes para emitir cobranças',
    icon: Users,
    href: '/clientes',
  },
  {
    id: 'conta-receber',
    title: 'Criar conta a receber',
    description: 'Registre sua primeira receita no sistema',
    icon: FileText,
    href: '/contas-receber',
  },
];

export const OnboardingChecklist = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Load checklist state from localStorage
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

  // Save checklist state
  const saveChecklist = (items: ChecklistItem[]) => {
    const state: Record<string, boolean> = {};
    items.forEach(item => {
      state[item.id] = item.completed;
    });
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
  };

  const toggleItem = (id: string) => {
    const updated = checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    saveChecklist(updated);

    // Check if all completed
    if (updated.every(item => item.completed)) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
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
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  // Don't show if dismissed or all completed
  if (isDismissed || (checklist.length > 0 && completedCount === checklist.length)) {
    return null;
  }

  return (
    <>
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-xl"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 0.5 }}
              >
                <Trophy className="h-16 w-16 text-warning mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold">Parabéns! 🎉</h2>
              <p className="text-muted-foreground">
                Você completou a configuração inicial do sistema!
              </p>
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
              <p className="text-xs text-muted-foreground">
                {completedCount} de {checklist.length} concluídos
              </p>
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

        {/* Progress */}
        <div className="px-4 py-2">
          <Progress value={progress} className="h-1.5" />
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
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg transition-colors',
                        item.completed
                          ? 'bg-success/10'
                          : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="flex-shrink-0 mt-0.5"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
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
                      </div>
                      {!item.completed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
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

// Export a button to reset checklist for testing
export const ResetChecklistButton = () => {
  const resetChecklist = () => {
    localStorage.removeItem(CHECKLIST_KEY);
    localStorage.removeItem(CHECKLIST_DISMISSED_KEY);
    window.location.reload();
  };

  return (
    <Button variant="outline" size="sm" onClick={resetChecklist} className="gap-2">
      <Sparkles className="h-4 w-4" />
      Resetar Checklist
    </Button>
  );
};
