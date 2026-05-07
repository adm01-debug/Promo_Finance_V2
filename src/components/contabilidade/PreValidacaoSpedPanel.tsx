// Painel visual de pré-validação cruzada Razão × DRE para SPED ECD/ECF.
import { 
  AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, 
  Activity, ArrowRightLeft, PieChart, ShieldAlert, Zap,
  Search, ShieldCheck, Target, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { PreValidacaoResult, SeveridadeAlerta } from '@/hooks/usePreValidacaoSped';

interface Props {
  resultado: PreValidacaoResult;
  className?: string;
}

const SEV_META: Record<
  SeveridadeAlerta,
  { icon: any; label: string; tone: string; iconClass: string; bg: string }
> = {
  error: {
    icon: AlertCircle,
    label: 'Crítico',
    tone: 'border-destructive/40 bg-destructive/5',
    bg: 'bg-destructive/10',
    iconClass: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Atenção',
    tone: 'border-warning/40 bg-warning/5',
    bg: 'bg-warning/10',
    iconClass: 'text-warning',
  },
  info: {
    icon: Info,
    label: 'Info',
    tone: 'border-primary/30 bg-primary/5',
    bg: 'bg-primary/10',
    iconClass: 'text-primary',
  },
};

const CATEGORIA_LABEL: Record<string, string> = {
  razao: 'Escrituração',
  dre: 'Resultado',
  cruzado: 'Integridade Cruzada',
  cobertura: 'Cobertura Fiscal',
  cfc: 'CFC Referencial',
};

export function PreValidacaoSpedPanel({ resultado, className }: Props) {
  const { isLoading, alertas, totais, resumo, podeGerar } = resultado;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Executando pré-validação cruzada Razão × DRE...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-none bg-white/[0.02] backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10", className)}>
      <CardHeader className="p-8 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-4">
            <div className={cn(
              "p-2.5 rounded-xl transition-all shadow-lg",
              podeGerar ? "bg-success/20 text-success" : "bg-white/5 text-white/20"
            )}>
              <CheckCircle2 className="h-6 w-6" />
            </div>
            Validations Analytics
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant={totais.erros > 0 ? 'destructive' : 'secondary'} className="gap-1">
              <AlertCircle className="h-3 w-3" /> {totais.erros} erro(s)
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> {totais.avisos} aviso(s)
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Info className="h-3 w-3" /> {totais.info} info
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-2 space-y-8">
        {/* Resumo numérico */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <ResumoBox label="Lançamentos" value={resumo.totalLancamentos.toLocaleString('pt-BR')} />
          <ResumoBox label="Partidas" value={resumo.totalPartidas.toLocaleString('pt-BR')} />
          <ResumoBox
            label="Débitos Razão"
            value={formatCurrency(resumo.debitoRazao)}
            highlight={Math.abs(resumo.diferencaRazao) > 0.01}
          />
          <ResumoBox
            label="Créditos Razão"
            value={formatCurrency(resumo.creditoRazao)}
            highlight={Math.abs(resumo.diferencaRazao) > 0.01}
          />
          <ResumoBox label="Receita Bruta (DRE)" value={formatCurrency(resumo.receitaBruta)} />
          <ResumoBox
            label="Lucro Líquido (DRE)"
            value={formatCurrency(resumo.lucroLiquido)}
            highlight={resumo.lucroLiquido < 0}
          />
          <ResumoBox
            label="Lanç. desbalanceados"
            value={resumo.lancamentosNaoBalanceados.toLocaleString('pt-BR')}
            highlight={resumo.lancamentosNaoBalanceados > 0}
          />
          <ResumoBox
            label="Partidas s/ conta"
            value={resumo.partidasSemConta.toLocaleString('pt-BR')}
            highlight={resumo.partidasSemConta > 0}
          />
        </div>

        <Separator />

        {alertas.length === 0 ? (
          <Alert className="border-success/40 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle>Tudo consistente</AlertTitle>
            <AlertDescription>
              Razão fechado, DRE coerente e nenhum desvio detectado. Você pode prosseguir com a geração do SPED.
            </AlertDescription>
          </Alert>
        ) : (
          <ul className="space-y-2" role="list" aria-label="Lista de alertas de pré-validação">
            {alertas.map((a) => {
              const meta = SEV_META[a.severidade];
              const Icon = meta.icon;
              return (
                <li
                  key={a.id}
                  className={cn('flex gap-3 rounded-md border p-3 text-xs', meta.tone)}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', meta.iconClass)} aria-hidden />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{a.titulo}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {CATEGORIA_LABEL[a.categoria] ?? a.categoria}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          a.severidade === 'error' && 'border-destructive/50 text-destructive',
                          a.severidade === 'warning' && 'border-warning/50 text-warning',
                          a.severidade === 'info' && 'border-primary/40 text-primary',
                        )}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{a.detalhe}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totais.erros > 0 && (
          <Alert variant="error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Geração bloqueada por erros críticos</AlertTitle>
            <AlertDescription>
              Resolva os {totais.erros} erro(s) acima — eles indicam dados incompletos ou inconsistentes que
              invalidariam o SPED.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function ResumoBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-black/20 p-4 transition-all duration-500 hover:bg-black/30 shadow-inner group/box',
        highlight && 'border-warning/40 bg-warning/5 ring-1 ring-warning/20',
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1 group-hover/box:text-primary transition-colors">{label}</p>
      <p className={cn('font-black text-lg tracking-tight tabular-nums', highlight ? 'text-warning' : 'text-white')}>{value}</p>
    </div>
  );
}
