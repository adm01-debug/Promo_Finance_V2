import { motion } from 'framer-motion';
import { Building2, Target, Settings2, Sparkles, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
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

  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-4">
      {/* Greeting + Title */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {/* Contextual Greeting */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <GreetingIcon className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground font-medium">
              {greeting.emoji} {greeting.text}! Aqui está seu resumo.
            </span>
          </motion.div>

          <div className="flex items-center gap-3">
            <h1 className="text-display-md gradient-text">Dashboard Executivo</h1>
            <Badge variant="outline" className="hidden sm:flex h-7 px-2.5 gap-1.5 border-success/30 bg-success/5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-success font-medium">Ao vivo</span>
            </Badge>
          </div>

          <p className="text-muted-foreground text-sm sm:text-base flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary hidden sm:block" />
            {insight}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={onOpenConfig} className="h-9 w-9 shrink-0">
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
        <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-9">
            <Building2 className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
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
          <SelectTrigger className="w-full sm:w-[200px] h-9">
            <Target className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
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
    </motion.div>
  );
}
