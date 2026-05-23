import { motion } from 'framer-motion';
import { Building2, Target, Settings2, Calendar, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
} as const;

function getGreeting(): { text: string; icon: React.ElementType } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', icon: Sunrise };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', icon: Sun };
  if (hour >= 18 && hour < 22) return { text: 'Boa noite', icon: Sunset };
  return { text: 'Boa noite', icon: Moon };
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
  const { currentEmpresaId, profile, user } = useAuth();
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const dateStr = formatDate();
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Gestor';

  useEffect(() => {
    if (currentEmpresaId && empresaFilter !== currentEmpresaId && empresaFilter === 'all') {
      setEmpresaFilter(currentEmpresaId);
    }
  }, [currentEmpresaId, empresaFilter, setEmpresaFilter]);

  return (
    <motion.div variants={itemVariants} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wider">{dateStr}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center border border-border shadow-sm text-primary">
              <GreetingIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {greeting.text}, <span className="text-primary">{displayName}</span>
              </h1>
              <p className="text-sm font-normal text-muted-foreground">
                Bem-vindo ao seu painel financeiro consolidado.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onOpenConfig}
          className="h-10 px-4 rounded-md border-border bg-card font-medium text-xs gap-2 hover:bg-accent transition-all self-start md:self-auto"
        >
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          Personalizar Painel
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 p-2 rounded-md bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2 flex-1 w-full px-2">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
            <SelectTrigger className="w-full h-9 rounded-md border-transparent bg-transparent hover:bg-accent transition-all font-medium text-xs focus:ring-0">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Empresas</SelectItem>
              {empresas.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome_fantasia || e.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-px h-6 bg-border hidden sm:block" />

        <div className="flex items-center gap-2 flex-1 w-full px-2">
          <Target className="h-4 w-4 text-[#64748b] shrink-0" />
          <Select value={centroCustoFilter} onValueChange={setCentroCustoFilter}>
            <SelectTrigger className="w-full h-9 rounded-md border-transparent bg-transparent hover:bg-[#f1f3f9] transition-all font-bold text-xs focus:ring-0">
              <SelectValue placeholder="Centro de Custos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Filtro Global</SelectItem>
              {centrosCusto.map(cc => (
                <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}