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
    <motion.div variants={itemVariants} className="relative px-1">
      {/* Floating Premium Hero Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-background/20 backdrop-blur-3xl p-8 sm:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] ring-1 ring-white/10 group">
        {/* Animated Accent Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        {/* Glass Orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col gap-8">
          {/* Header Top Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-6">
              {/* Status & Date Badges */}
              <div className="flex items-center gap-4 flex-wrap">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm"
                >
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">{dateStr}</span>
                </motion.div>
                
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 border border-success/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-success">Sistema Autônomo Online</span>
                </div>
              </div>

              {/* Greeting with Dynamic Icon */}
              <div className="flex items-center gap-6">
                <motion.div 
                  className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/20 relative overflow-hidden"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <div className="absolute inset-0 bg-white/20 blur-sm -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <GreetingIcon className="h-8 w-8 text-white relative z-10" />
                </motion.div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground flex items-center gap-3">
                    {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">Usuário</span>
                  </h1>
                  <p className="text-lg font-medium text-muted-foreground/70 mt-1 max-w-xl italic">
                    "{insight}"
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Global */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={onOpenConfig}
                className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold gap-3 transition-all hover:translate-y-[-2px] shadow-xl"
              >
                <Settings2 className="h-5 w-5 text-primary" />
                Customizar Painel
              </Button>
            </div>
          </div>
          
          {/* Intelligence Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-2 rounded-[1.8rem] bg-black/20 border border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-3 pl-6 border-r border-white/10 pr-6 h-10 hidden sm:flex">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Governança</span>
            </div>
            
            <div className="grid grid-cols-1 sm:flex items-center gap-4 flex-1 w-full px-4 sm:px-0">
              <div className="flex items-center gap-3 flex-1">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-none bg-transparent hover:bg-white/5 transition-all font-bold text-sm focus:ring-0">
                    <SelectValue placeholder="Selecione a Organização" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl">
                    <SelectItem value="all">Todas as Empresas</SelectItem>
                    {empresas.map(e => (
                      <SelectItem key={e.id} value={e.id} className="rounded-lg">
                        {e.nome_fantasia || e.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-px h-6 bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-3 flex-1">
                <Target className="h-4 w-4 text-purple-400 shrink-0" />
                <Select value={centroCustoFilter} onValueChange={setCentroCustoFilter}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-none bg-transparent hover:bg-white/5 transition-all font-bold text-sm focus:ring-0">
                    <SelectValue placeholder="Centro de Custos" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl">
                    <SelectItem value="all">Filtro Global de Custos</SelectItem>
                    {centrosCusto.map(cc => (
                      <SelectItem key={cc.id} value={cc.id} className="rounded-lg">{cc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
