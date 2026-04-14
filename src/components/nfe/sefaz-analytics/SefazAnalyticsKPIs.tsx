import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, Zap, Activity, TrendingUp, TrendingDown } from 'lucide-react';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface Props {
  taxaSucesso: number;
  taxaRejeicao: number;
  tempoMedio: number;
  total: number;
  autorizadas: number;
  rejeitadas: number;
  cancelamentos: number;
  erros: number;
}

export function SefazAnalyticsKPIs({ taxaSucesso, taxaRejeicao, tempoMedio, total, autorizadas, rejeitadas, cancelamentos, erros }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <motion.div variants={itemVariants}>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Taxa de Sucesso</p><p className="text-2xl font-bold text-success">{taxaSucesso.toFixed(1)}%</p></div>
            <div className="p-2 rounded-full bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs"><TrendingUp className="h-3 w-3 text-success" /><span className="text-muted-foreground">{autorizadas} autorizadas</span></div>
        </CardContent></Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Taxa de Rejeição</p><p className="text-2xl font-bold text-destructive">{taxaRejeicao.toFixed(1)}%</p></div>
            <div className="p-2 rounded-full bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs"><TrendingDown className="h-3 w-3 text-destructive" /><span className="text-muted-foreground">{rejeitadas} rejeitadas</span></div>
        </CardContent></Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Tempo Médio</p><p className="text-2xl font-bold">{(tempoMedio / 1000).toFixed(1)}s</p></div>
            <div className="p-2 rounded-full bg-primary/10"><Clock className="h-5 w-5 text-primary" /></div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs"><Zap className="h-3 w-3 text-primary" /><span className="text-muted-foreground">resposta SEFAZ</span></div>
        </CardContent></Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Total de Eventos</p><p className="text-2xl font-bold">{total}</p></div>
            <div className="p-2 rounded-full bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs"><span className="text-muted-foreground">{cancelamentos} cancelamentos • {erros} erros</span></div>
        </CardContent></Card>
      </motion.div>
    </div>
  );
}
