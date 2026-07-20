import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertOctagon, 
  MoreVertical,
  Trash2,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { usePlanosAcao, useUpdatePlanoAcao, useCreatePlanoAcao, type PlanoAcao } from '@/hooks/useInteligenciaOperacional';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PRIORIDADE_CONFIG = {
  critica: { color: 'text-destructive bg-destructive/10', icon: AlertOctagon, label: 'Crítica' },
  alta: { color: 'text-orange-500 bg-orange-500/10', icon: Clock, label: 'Alta' },
  media: { color: 'text-blue-500 bg-blue-500/10', icon: Circle, label: 'Média' },
  baixa: { color: 'text-success bg-success/10', icon: CheckCircle2, label: 'Baixa' },
};

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'bg-muted/20 text-muted-foreground' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-500 text-white' },
  concluido: { label: 'Concluído', color: 'bg-success text-primary-foreground' },
  cancelado: { label: 'Cancelado', color: 'bg-destructive text-primary-foreground' },
};

export function PlanosAcaoPanel() {
  const { data: planos, isLoading } = usePlanosAcao();
  const updatePlano = useUpdatePlanoAcao();
  const [filtroStatus, setFiltroStatus] = useState<string | 'todos'>('todos');

  const planosFiltrados = planos?.filter(p => filtroStatus === 'todos' || p.status === filtroStatus);

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus: PlanoAcao['status'] = currentStatus === 'concluido' ? 'pendente' : 'concluido';
    const progresso = nextStatus === 'concluido' ? 100 : 0;
    updatePlano.mutate({ id, status: nextStatus, progresso });
  };

  return (
    <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
      <CardHeader className="p-8 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Planos de Ação</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Gestão de iniciativas estratégicas</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/5 font-bold gap-2">
                  <Filter className="h-4 w-4" />
                  {filtroStatus === 'todos' ? 'Todos' : STATUS_CONFIG[filtroStatus as keyof typeof STATUS_CONFIG].label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                <DropdownMenuItem onClick={() => setFiltroStatus('todos')}>Todos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFiltroStatus('pendente')}>Pendente</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFiltroStatus('em_andamento')}>Em Andamento</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFiltroStatus('concluido')}>Concluído</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="icon" className="h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 pt-6">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 w-full rounded-2xl bg-card/5 animate-pulse" />
              ))
            ) : !planosFiltrados || planosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40 italic">
                Nenhum plano de ação encontrado.
              </div>
            ) : (
              planosFiltrados.map((plano, idx) => {
                const prio = PRIORIDADE_CONFIG[plano.prioridade];
                const PrioIcon = prio.icon;
                
                return (
                  <motion.div
                    key={plano.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "group relative p-5 rounded-2xl border border-white/5 bg-card/[0.03] transition-all hover:bg-card/[0.07]",
                      plano.status === 'concluido' && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="mt-1 h-6 w-6 rounded-full p-0 shrink-0"
                        onClick={() => handleToggleStatus(plano.id, plano.status)}
                      >
                        {plano.status === 'concluido' ? (
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                        )}
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className={cn(
                            "text-base font-bold tracking-tight truncate",
                            plano.status === 'concluido' && "line-through"
                          )}>
                            {plano.titulo}
                          </h4>
                          <div className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1", prio.color)}>
                            <PrioIcon className="h-3 w-3" />
                            {prio.label}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground/70 mb-4 line-clamp-1">
                          {plano.descricao}
                        </p>
                        
                        <div className="flex items-center gap-6 flex-wrap">
                          {plano.prazo && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/50">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(plano.prazo), "dd 'de' MMM", { locale: ptBR })}
                            </div>
                          )}
                          
                          {plano.responsavel && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/50">
                              <User className="h-3.5 w-3.5" />
                              {plano.responsavel}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-[120px] max-w-[200px] flex items-center gap-3 ml-auto">
                            <Progress value={plano.progresso} className="h-1.5 bg-card/5" />
                            <span className="text-[10px] font-black text-primary w-8">{plano.progresso}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="text-destructive font-bold gap-2">
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
