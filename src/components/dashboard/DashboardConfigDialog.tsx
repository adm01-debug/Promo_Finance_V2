import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings2,
  GripVertical,
  RotateCcw,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DashboardWidget } from '@/hooks/useDashboardConfig';

interface DashboardConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: DashboardWidget[];
  onToggleWidget: (widgetId: string) => void;
  onResizeWidget: (widgetId: string, size: 'sm' | 'md' | 'lg') => void;
  onResetToDefault: () => void;
}

const WIDGET_LABELS: Record<string, { label: string; description: string }> = {
  'kpi-saldo': { label: 'Saldo Total', description: 'Card com saldo consolidado de todas as contas' },
  'kpi-receber': { label: 'A Receber', description: 'Total de contas a receber pendentes' },
  'kpi-pagar': { label: 'A Pagar', description: 'Total de contas a pagar pendentes' },
  'kpi-vencidas': { label: 'Contas Vencidas', description: 'Alertas de contas em atraso' },
  'fluxo-caixa': { label: 'Fluxo de Caixa', description: 'Gráfico de projeção financeira' },
  'composicao': { label: 'Composição Financeira', description: 'Gráfico de pizza com distribuição' },
  'vencimentos': { label: 'Próximos Vencimentos', description: 'Lista de contas próximas ao vencimento' },
  'previsao-ia': { label: 'Previsão IA', description: 'Previsões inteligentes de fluxo de caixa' },
  'aprovacoes': { label: 'Aprovações Pendentes', description: 'Contador de aprovações necessárias' },
  'top-clientes': { label: 'Top Clientes', description: 'Ranking de clientes por volume' },
};

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Pequeno', icon: Minimize2 },
  { value: 'md', label: 'Médio', icon: null },
  { value: 'lg', label: 'Grande', icon: Maximize2 },
];

export const DashboardConfigDialog = forwardRef<HTMLDivElement, DashboardConfigDialogProps>(
  function DashboardConfigDialog({
    open,
    onOpenChange,
    widgets,
    onToggleWidget,
    onResizeWidget,
    onResetToDefault,
  }, ref) {
  const visibleCount = widgets.filter(w => w.visible).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Personalizar Dashboard
          </DialogTitle>
          <DialogDescription>
            Escolha quais widgets exibir e ajuste seus tamanhos
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{visibleCount} widgets ativos</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onResetToDefault}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar padrão
          </Button>
        </div>

        <Separator />

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {widgets
              .sort((a, b) => a.order - b.order)
              .map((widget) => {
                const info = WIDGET_LABELS[widget.type] || { label: widget.title, description: '' };
                
                return (
                  <motion.div
                    key={widget.id}
                    layout
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-all",
                      widget.visible 
                        ? "bg-card border-border" 
                        : "bg-muted/30 border-transparent opacity-60"
                    )}
                  >
                    <div className="cursor-grab hover:text-primary">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{info.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {widget.size === 'sm' ? 'P' : widget.size === 'md' ? 'M' : 'G'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>

                    <Select
                      value={widget.size}
                      onValueChange={(size) => onResizeWidget(widget.id, size as 'sm' | 'md' | 'lg')}
                      disabled={!widget.visible}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Switch
                      checked={widget.visible}
                      onCheckedChange={() => onToggleWidget(widget.id)}
                    />
                  </motion.div>
                );
              })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            <Check className="h-4 w-4 mr-2" />
            Concluído
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
