// Widget: Conformidade fiscal automática
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Play, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useConformidadeFiscal } from '@/hooks/useConformidadeFiscal';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  empresaId?: string;
}

const NIVEL_COLOR: Record<string, string> = {
  excelente: 'text-success',
  bom: 'text-primary',
  atencao: 'text-warning',
  critico: 'text-destructive',
};

const STATUS_ICON = {
  aprovado: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  atencao: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
  reprovado: <XCircle className="h-3.5 w-3.5 text-destructive" />,
};

export function ConformidadeFiscalCard({ empresaId }: Props) {
  const { data, verificar } = useConformidadeFiscal(empresaId);

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Conformidade Fiscal
        </CardTitle>
        <Button
          size="sm"
          variant="default"
          disabled={!empresaId || verificar.isPending}
          onClick={() => verificar.mutate()}
          className="gap-1"
        >
          {verificar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Verificar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!data ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {empresaId ? 'Clique em "Verificar" para rodar 8 checks automáticos' : 'Selecione uma empresa'}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
            <div className="flex items-end gap-3">
              <div className={`text-4xl font-bold ${NIVEL_COLOR[data.nivel]}`}>{data.score}</div>
              <div className="text-xs text-muted-foreground pb-1">/100</div>
              <Badge variant="outline" className={`ml-auto capitalize ${NIVEL_COLOR[data.nivel]}`}>
                {data.nivel}
              </Badge>
            </div>
            <Progress value={data.score} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {data.checks_aprovados}/{data.total_checks} checks aprovados ·{' '}
              {format(parseISO(data.gerado_em), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {data.itens.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-xs p-2 rounded-md bg-muted/30">
                  {STATUS_ICON[item.status]}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.titulo}</div>
                    {item.detalhes && <div className="text-muted-foreground truncate">{item.detalhes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
