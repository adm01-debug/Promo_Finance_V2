import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Target,
  Shield,
  DollarSign,
  Calendar,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export interface ClienteRisco {
  id: string;
  nome: string;
  nomeFantasia: string | null;
  score: number;
  totalPendente: number;
  diasAteVencimento: number;
  historicoAtrasos: number;
  probabilidadeAtraso: number;
  nivelRisco: 'alto' | 'medio' | 'baixo';
  fatoresRisco: string[];
  acaoSugerida: string;
}

function getRiscoConfig(nivel: 'alto' | 'medio' | 'baixo') {
  switch (nivel) {
    case 'alto':
      return { color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle, label: 'Alto Risco' };
    case 'medio':
      return { color: 'text-warning', bg: 'bg-warning/10', icon: Target, label: 'Médio Risco' };
    case 'baixo':
      return { color: 'text-success', bg: 'bg-success/10', icon: Shield, label: 'Baixo Risco' };
  }
}

export function PrevisaoClienteCard({ cliente }: { cliente: ClienteRisco }) {
  const config = getRiscoConfig(cliente.nivelRisco);
  return (
    <motion.div
      key={cliente.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border transition-colors hover:bg-accent/50",
        config.bg
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <config.icon className={cn("h-4 w-4", config.color)} />
            <span className="font-medium truncate">
              {cliente.nomeFantasia || cliente.nome}
            </span>
            <Badge variant="outline" className={cn("text-xs", config.color)}>
              {cliente.probabilidadeAtraso.toFixed(0)}% risco
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(cliente.totalPendente)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Vence em {cliente.diasAteVencimento} dia(s)
            </span>
            <span className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Score: {cliente.score}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {cliente.fatoresRisco.map((fator, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {fator}
              </Badge>
            ))}
          </div>

          <p className="text-xs text-primary font-medium">
            💡 {cliente.acaoSugerida}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Progress value={cliente.probabilidadeAtraso} className="w-20 h-2" />
          <Button size="sm" variant="ghost">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
