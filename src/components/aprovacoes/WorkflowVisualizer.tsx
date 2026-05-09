import { CheckCircle2, Circle, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: string;
  nome: string;
  status: 'completo' | 'atual' | 'pendente';
  aprovador?: string;
  data?: string;
}

interface WorkflowVisualizerProps {
  steps: WorkflowStep[];
}

export const WorkflowVisualizer = ({ steps }: WorkflowVisualizerProps) => {
  return (
    <div className="relative flex items-center justify-between w-full py-4">
      {/* Linha de fundo */}
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
      
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isFirst = index === 0;

        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center">
            {/* Ícone */}
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
              step.status === 'completo' ? "bg-success border-success text-white" :
              step.status === 'atual' ? "bg-background border-primary text-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]" :
              "bg-background border-muted text-muted-foreground"
            )}>
              {step.status === 'completo' ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : step.status === 'atual' ? (
                <Clock className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
            </div>

            {/* Label */}
            <div className="absolute top-12 whitespace-nowrap text-center">
              <p className={cn(
                "text-xs font-semibold",
                step.status === 'atual' ? "text-primary" : "text-muted-foreground"
              )}>
                {step.nome}
              </p>
              {step.aprovador && (
                <p className="text-[10px] text-muted-foreground italic">
                  {step.aprovador}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
