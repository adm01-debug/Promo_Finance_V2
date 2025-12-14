import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  TrendingDown,
  Calendar,
  Lightbulb,
  X,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { AlertaRuptura, CENARIOS_CONFIG } from '@/lib/cashflow-scenarios';

interface AlertasRupturaProps {
  alertas: AlertaRuptura[];
  onDismiss?: (id: string) => void;
  onVerDetalhes?: (alerta: AlertaRuptura) => void;
}

const alertaConfig = {
  ruptura: {
    icon: AlertTriangle,
    bgClass: 'bg-destructive/10 border-destructive/30',
    iconClass: 'text-destructive',
    badgeVariant: 'destructive' as const,
    label: 'Ruptura',
  },
  risco_alto: {
    icon: AlertCircle,
    bgClass: 'bg-warning/10 border-warning/30',
    iconClass: 'text-warning',
    badgeVariant: 'outline' as const,
    label: 'Risco Alto',
  },
  risco_medio: {
    icon: Info,
    bgClass: 'bg-accent/50 border-accent',
    iconClass: 'text-muted-foreground',
    badgeVariant: 'secondary' as const,
    label: 'Atenção',
  },
  recuperacao: {
    icon: TrendingDown,
    bgClass: 'bg-success/10 border-success/30',
    iconClass: 'text-success',
    badgeVariant: 'outline' as const,
    label: 'Recuperação',
  },
};

export function AlertasRuptura({ alertas, onDismiss, onVerDetalhes }: AlertasRupturaProps) {
  if (alertas.length === 0) {
    return (
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Alertas de Ruptura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <AlertCircle className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum alerta detectado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Seu fluxo de caixa está saudável em todos os cenários
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar alertas por tipo
  const alertasRuptura = alertas.filter(a => a.tipo === 'ruptura');
  const alertasRiscoAlto = alertas.filter(a => a.tipo === 'risco_alto');
  const outrosAlertas = alertas.filter(a => a.tipo !== 'ruptura' && a.tipo !== 'risco_alto');

  return (
    <Card className={cn(
      "card-elevated transition-all",
      alertasRuptura.length > 0 && "border-destructive/50 shadow-destructive/10"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-5 w-5",
              alertasRuptura.length > 0 ? "text-destructive" : "text-primary"
            )} />
            Alertas de Ruptura
            {alertas.length > 0 && (
              <Badge variant={alertasRuptura.length > 0 ? "destructive" : "secondary"} className="ml-2">
                {alertas.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {/* Alertas de Ruptura (mais críticos primeiro) */}
              {alertasRuptura.map((alerta, index) => (
                <AlertaItem
                  key={alerta.id}
                  alerta={alerta}
                  index={index}
                  onDismiss={onDismiss}
                  onVerDetalhes={onVerDetalhes}
                />
              ))}
              
              {/* Alertas de Risco Alto */}
              {alertasRiscoAlto.map((alerta, index) => (
                <AlertaItem
                  key={alerta.id}
                  alerta={alerta}
                  index={alertasRuptura.length + index}
                  onDismiss={onDismiss}
                  onVerDetalhes={onVerDetalhes}
                />
              ))}
              
              {/* Outros alertas */}
              {outrosAlertas.map((alerta, index) => (
                <AlertaItem
                  key={alerta.id}
                  alerta={alerta}
                  index={alertasRuptura.length + alertasRiscoAlto.length + index}
                  onDismiss={onDismiss}
                  onVerDetalhes={onVerDetalhes}
                />
              ))}
            </div>
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface AlertaItemProps {
  alerta: AlertaRuptura;
  index: number;
  onDismiss?: (id: string) => void;
  onVerDetalhes?: (alerta: AlertaRuptura) => void;
}

function AlertaItem({ alerta, index, onDismiss, onVerDetalhes }: AlertaItemProps) {
  const config = alertaConfig[alerta.tipo];
  const Icon = config.icon;
  const cenarioConfig = CENARIOS_CONFIG[alerta.cenario];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative p-3 rounded-lg border transition-all hover:shadow-sm",
        config.bgClass
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", config.iconClass)}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={config.badgeVariant} className="text-xs">
              {config.label}
            </Badge>
            <Badge variant="outline" className="text-xs" style={{ borderColor: cenarioConfig.cor, color: cenarioConfig.cor }}>
              {cenarioConfig.nome}
            </Badge>
          </div>
          
          <p className="text-sm font-medium text-foreground truncate">
            {alerta.mensagem}
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(alerta.data)}
            </span>
            <span className={cn(
              "font-medium",
              alerta.saldoProjetado < 0 ? "text-destructive" : "text-foreground"
            )}>
              {formatCurrency(alerta.saldoProjetado)}
            </span>
            <span className="text-warning">
              {alerta.diasAteEvento === 0 ? 'Hoje' : 
               alerta.diasAteEvento === 1 ? 'Amanhã' : 
               `Em ${alerta.diasAteEvento} dias`}
            </span>
          </div>
          
          {alerta.acaoSugerida && (
            <div className="flex items-center gap-1 mt-2 text-xs text-primary">
              <Lightbulb className="h-3 w-3" />
              <span>{alerta.acaoSugerida}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onVerDetalhes && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onVerDetalhes(alerta)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDismiss(alerta.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
