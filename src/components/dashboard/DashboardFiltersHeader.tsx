import { motion } from 'framer-motion';
import { Building2, Target, Settings2, Sparkles, Sun, Moon, Sunrise, Sunset, Activity, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

function getGreeting(): { text: string; icon: React.ElementType; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', icon: Sunrise, emoji: '☀️' };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', icon: Sun, emoji: '🌤️' };
  if (hour >= 18 && hour < 22) return { text: 'Boa noite', icon: Sunset, emoji: '🌅' };
  return { text: 'Boa noite', icon: Moon, emoji: '🌙' };
}

function getMotivationalInsight(): string {
  const day = new Date().getDay();
  const insights = [
    'Comece a semana revisando suas metas financeiras.',
    'Verifique suas cobranças pendentes para manter o fluxo de caixa saudável.',
    'Meio de semana é ideal para revisar conciliações bancárias.',
    'Antecipe pagamentos com desconto para economizar.',
    'Sexta-feira: revise o fechamento semanal antes do fim do dia.',
    'Aproveite o sábado para planejar a próxima semana.',
    'Domingo de planejamento: defina prioridades para amanhã.',
  ];
  return insights[day];
}

function formatDate(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

interface DashboardFiltersHeaderProps {
  empresas: Array<{ id: string; nome_fantasia: string | null; razao_social: string }>;
  centrosCusto: Array<{ id: string; nome: string }>;
  empresaFilter: string;
  setEmpresaFilter: (value: string) => void;
  centroCustoFilter: string;
  setCentroCustoFilter: (value: string) => void;
  onOpenConfig: () => void;
}

export function DashboardFiltersHeader({
  empresas,
  centrosCusto,
  empresaFilter,
  setEmpresaFilter,
  centroCustoFilter,
  setCentroCustoFilter,
  onOpenConfig,
}: DashboardFiltersHeaderProps) {
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const insight = getMotivationalInsight();
  const dateStr = formatDate();

  return (
    <motion.div variants={itemVariants} className="relative">
      {/* Premium Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] p-5 sm:p-6 md:p-8 shadow-[var(--shadow-md)]">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-primary/[0.06] via-accent/[0.04] to-transparent rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-success/[0.05] to-transparent rounded-full translate-y-1/3 -translate-x-1/4 blur-xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-radial from-primary/[0.02] to-transparent rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Top Row: Greeting + Actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1 min-w-0">
              {/* Date & Status Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border/40"
                >
                  <Calendar className="h-3 w-3" />
                  <span className="capitalize">{dateStr}</span>
                </motion.div>
                <Badge variant="outline" className="h-6 px-2.5 gap-1.5 border-success/30 bg-success/5 shadow-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-success font-medium">Ao vivo</span>
                </Badge>
              </div>

              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2.5"
              >
                <motion.div 
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center border border-warning/20 shadow-sm"
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <GreetingIcon className="h-5 w-5 text-warning" />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
                    {greeting.emoji} {greeting.text}!
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Aqui está seu painel financeiro executivo.
                  </p>
                </div>
              </motion.div>

              {/* Motivational Insight */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/[0.04] border border-primary/10 max-w-lg"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {insight}
                </p>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onOpenConfig}
                  className="h-9 w-9 rounded-xl border-border/60 bg-card/80 backdrop-blur-sm hover:bg-muted/80 hover:border-primary/30 transition-all shadow-sm"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2 border-t border-border/30">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hidden sm:block">
              Filtros
            </span>
            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 flex-1">
              <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-9 rounded-lg border-border/50 bg-background/60 backdrop-blur-sm text-xs">
                  <Building2 className="h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    <SelectValue placeholder="Todas Empresas" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Empresas</SelectItem>
                  {empresas.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_fantasia || e.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={centroCustoFilter} onValueChange={setCentroCustoFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-9 rounded-lg border-border/50 bg-background/60 backdrop-blur-sm text-xs">
                  <Target className="h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    <SelectValue placeholder="Todos Centros" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Centros</SelectItem>
                  {centrosCusto.map(cc => (
                    <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
