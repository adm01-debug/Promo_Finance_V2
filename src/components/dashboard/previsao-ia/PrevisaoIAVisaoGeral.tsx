import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Users, Clock, Wallet, DollarSign, Target } from 'lucide-react';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } } as const;

interface IndicadoresChave {
  prazo_medio_recebimento: string;
  prazo_medio_pagamento: string;
  ciclo_financeiro: string;
  liquidez_corrente: string;
  cobertura_despesas: string;
}

interface InadimplenciaData {
  taxa_atual: string;
  tendencia: string;
  clientes_risco: string[];
  valor_em_risco: string;
}

interface Props {
  indicadores?: IndicadoresChave;
  inadimplencia?: InadimplenciaData;
  getTendenciaIcon: (t: string) => React.ReactNode;
}

export function PrevisaoIAVisaoGeral({ indicadores, inadimplencia, getTendenciaIcon }: Props) {
  return (
    <div className="space-y-4">
      {indicadores && (
        <motion.div variants={itemVariants}>
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Target className="h-4 w-4 text-primary" />
            Indicadores Chave
          </h3>
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="text-center p-4"><Clock className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-xs text-muted-foreground">PMR</p><p className="text-lg font-bold">{indicadores.prazo_medio_recebimento}</p></Card>
            <Card className="text-center p-4"><Clock className="h-5 w-5 text-streak mx-auto mb-2" /><p className="text-xs text-muted-foreground">PMP</p><p className="text-lg font-bold">{indicadores.prazo_medio_pagamento}</p></Card>
            <Card className="text-center p-4"><Activity className="h-5 w-5 text-secondary mx-auto mb-2" /><p className="text-xs text-muted-foreground">Ciclo Financeiro</p><p className="text-lg font-bold">{indicadores.ciclo_financeiro}</p></Card>
            <Card className="text-center p-4"><Wallet className="h-5 w-5 text-success mx-auto mb-2" /><p className="text-xs text-muted-foreground">Liquidez</p><p className="text-lg font-bold">{indicadores.liquidez_corrente}</p></Card>
            <Card className="text-center p-4"><DollarSign className="h-5 w-5 text-accent-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">Cobertura</p><p className="text-lg font-bold">{indicadores.cobertura_despesas}</p></Card>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Análise de Inadimplência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><span className="text-sm text-muted-foreground">Taxa Atual</span><p className="font-semibold text-lg">{inadimplencia?.taxa_atual}</p></div>
              <div><span className="text-sm text-muted-foreground">Tendência</span><div className="flex items-center gap-2">{getTendenciaIcon(inadimplencia?.tendencia || '')}<span className="font-medium capitalize">{inadimplencia?.tendencia}</span></div></div>
              <div><span className="text-sm text-muted-foreground">Valor em Risco</span><p className="font-semibold text-lg text-destructive">{inadimplencia?.valor_em_risco}</p></div>
            </div>
            {inadimplencia?.clientes_risco?.length ? (
              <div className="border-t pt-3">
                <p className="mb-2 text-sm font-medium">Clientes em Risco:</p>
                <div className="flex flex-wrap gap-1">
                  {inadimplencia.clientes_risco.slice(0, 5).map((cliente, i) => <Badge key={i} variant="outline" className="text-xs">{cliente}</Badge>)}
                  {inadimplencia.clientes_risco.length > 5 && <Badge variant="secondary" className="text-xs">+{inadimplencia.clientes_risco.length - 5}</Badge>}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
