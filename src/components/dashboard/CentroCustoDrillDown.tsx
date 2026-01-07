import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(150, 70%, 42%)', 'hsl(42, 95%, 48%)', 'hsl(0, 78%, 55%)', 'hsl(215, 90%, 52%)', 'hsl(275, 75%, 48%)'];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface CentroCustoData {
  nome: string;
  pagar: number;
  receber: number;
  saldo: number;
}

interface CentroCustoDrillDownProps {
  dadosPorCentroCusto: CentroCustoData[];
}

export function CentroCustoDrillDown({ dadosPorCentroCusto }: CentroCustoDrillDownProps) {
  const [drillDownOpen, setDrillDownOpen] = useState<string | null>(null);

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Drill-Down por Centro de Custo
          </CardTitle>
          <CardDescription>Clique para expandir detalhes de cada centro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {dadosPorCentroCusto.map((cc, index) => (
            <Collapsible 
              key={cc.nome} 
              open={drillDownOpen === cc.nome} 
              onOpenChange={() => setDrillDownOpen(drillDownOpen === cc.nome ? null : cc.nome)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium">{cc.nome}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">A Receber</p>
                      <p className="text-sm font-semibold text-success">{formatCurrency(cc.receber)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">A Pagar</p>
                      <p className="text-sm font-semibold text-destructive">{formatCurrency(cc.pagar)}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className={cn("text-sm font-bold", cc.saldo >= 0 ? "text-success" : "text-destructive")}>
                        {formatCurrency(cc.saldo)}
                      </p>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", drillDownOpen === cc.nome && "rotate-180")} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 ml-6 p-4 rounded-lg border bg-background space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
                      <p className="text-xs text-muted-foreground mb-1">Total a Receber</p>
                      <p className="text-lg font-bold text-success">{formatCurrency(cc.receber)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-xs text-muted-foreground mb-1">Total a Pagar</p>
                      <p className="text-lg font-bold text-destructive">{formatCurrency(cc.pagar)}</p>
                    </div>
                    <div className={cn("text-center p-3 rounded-lg border", cc.saldo >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20")}>
                      <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                      <p className={cn("text-lg font-bold", cc.saldo >= 0 ? "text-success" : "text-destructive")}>
                        {formatCurrency(cc.saldo)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/contas-receber?centro_custo=${encodeURIComponent(cc.nome)}`}>
                        Ver Contas a Receber
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/contas-pagar?centro_custo=${encodeURIComponent(cc.nome)}`}>
                        Ver Contas a Pagar
                      </Link>
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
          {dadosPorCentroCusto.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum dado disponível para os filtros selecionados</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
