import { motion } from 'framer-motion';
import { Building2, CheckCircle2, AlertTriangle, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export interface CentroCustoComGastos {
  id: string;
  codigo: string;
  nome: string;
  tipo: string | null;
  responsavel: string | null;
  orcamento_previsto: number;
  orcamento_realizado: number;
  gasto_real_pagar: number;
  gasto_real_receber: number;
  qtd_pagar: number;
  qtd_receber: number;
  margem: number;
  percentual_usado: number;
  status: 'ok' | 'atencao' | 'estouro';
}

const statusConfig = {
  ok: { label: 'No Orçamento', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  atencao: { label: 'Atenção', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  estouro: { label: 'Estourado', icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

export function OrcamentoCardsView({ centros }: { centros: CentroCustoComGastos[] }) {
  if (centros.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        Nenhum centro de custo encontrado com o filtro selecionado.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {centros.map((centro, i) => {
        const config = statusConfig[centro.status];
        const Icon = config.icon;
        return (
          <motion.div
            key={centro.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={cn('border', config.border, 'hover:shadow-md transition-shadow')}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {centro.nome}
                  </CardTitle>
                  <Badge variant="outline" className={cn('text-xs', config.color, config.bg)}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {centro.codigo} {centro.responsavel ? `• ${centro.responsavel}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Execução</span>
                    <span className={cn('font-medium', config.color)}>
                      {centro.percentual_usado.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(centro.percentual_usado, 100)}
                    className={cn('h-2', centro.status === 'estouro' && '[&>div]:bg-destructive')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground block">Orçamento</span>
                    <span className="font-semibold">{formatCurrency(centro.orcamento_previsto)}</span>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground block">Gasto</span>
                    <span className={cn('font-semibold', centro.status === 'estouro' && 'text-destructive')}>
                      {formatCurrency(centro.gasto_real_pagar)}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground block">Receita</span>
                    <span className="font-semibold text-success">{formatCurrency(centro.gasto_real_receber)}</span>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground block">Margem</span>
                    <span className={cn('font-semibold', centro.margem >= 0 ? 'text-success' : 'text-destructive')}>
                      {formatCurrency(centro.margem)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span>{centro.qtd_pagar} despesas</span>
                  <span>{centro.qtd_receber} receitas</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
