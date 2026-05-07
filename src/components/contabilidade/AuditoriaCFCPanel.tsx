// Painel de auditoria de códigos referenciais CFC. Mostra score, KPIs e lista
// detalhada de problemas. Usado em modal (PlanoContasTab) e inline (SpedEcdWizard).
import { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Copy,
  FileText,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { AuditoriaCFCResult } from '@/hooks/useAuditoriaCFC';
import type { EmpresaHeader } from '@/lib/export-contabil';
import { exportAuditoriaCFCCSV, exportAuditoriaCFCPDF } from '@/lib/export-contabil';
import { toast } from 'sonner';

interface Props {
  resultado: AuditoriaCFCResult;
  empresa?: EmpresaHeader;
  className?: string;
  /** Modo compacto, sem ações de exportação (usado inline nos wizards) */
  compact?: boolean;
}

function scoreColor(score: number) {
  if (score >= 95) return { tone: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Excelente', shadow: 'shadow-success/20' };
  if (score >= 80) return { tone: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', label: 'Bom', shadow: 'shadow-primary/20' };
  if (score >= 60) return { tone: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Atenção', shadow: 'shadow-warning/20' };
  return { tone: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', label: 'Crítico', shadow: 'shadow-destructive/20' };
}

export function AuditoriaCFCPanel({ resultado, empresa, className, compact = false }: Props) {
  const [tab, setTab] = useState<'formato' | 'prefixo' | 'duplicidade' | 'sem-ref'>('formato');

  if (resultado.isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Auditando códigos referenciais CFC…
        </CardContent>
      </Card>
    );
  }

  const score = scoreColor(resultado.scoreConformidade);
  const tudoOk = resultado.totalProblemas === 0;

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast.success('Código copiado', { description: s });
  };

  return (
    <Card className={cn("border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/10 relative group", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className={cn('h-5 w-5', score.tone)} />
              Auditoria CFC do Plano de Contas
            </CardTitle>
            <CardDescription>
              Validação de formato, prefixo por natureza e duplicidades dos códigos referenciais usados no SPED.
            </CardDescription>
          </div>
          {!compact && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportAuditoriaCFCCSV(resultado, empresa)}
                disabled={tudoOk}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportAuditoriaCFCPDF(resultado, empresa)}
                disabled={tudoOk}
              >
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI de score + totais */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={cn('rounded-[1.5rem] border p-5 col-span-2 sm:col-span-1 shadow-lg backdrop-blur-md transition-all', score.bg, score.border, score.shadow)}
          >
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60 mb-1">Score</p>
            <p className={cn('text-4xl font-black font-mono tracking-tighter', score.tone)}>{resultado.scoreConformidade}</p>
            <Badge variant="outline" className={cn('mt-2 text-[10px] font-black uppercase border-none bg-current/10', score.tone)}>
              {score.label}
            </Badge>
          </motion.div>
          <KPI label="Contas ativas" value={resultado.totalContas} />
          <KPI label="Analíticas" value={resultado.totalAnaliticas} />
          <KPI
            label="Com referencial"
            value={resultado.comReferencial}
            tone={resultado.comReferencial === resultado.totalAnaliticas ? 'success' : undefined}
          />
          <KPI
            label="Sem referencial"
            value={resultado.semReferencial}
            tone={resultado.semReferencial > 0 ? 'warning' : undefined}
          />
        </div>

        {/* Resumo por categoria */}
        <div className="grid grid-cols-3 gap-4">
          <ProblemKPI
            icon={AlertCircle}
            label="Formato inválido"
            value={resultado.formatoInvalido.length}
            critical
          />
          <ProblemKPI
            icon={AlertTriangle}
            label="Prefixo incorreto"
            value={resultado.prefixoIncorreto.length}
          />
          <ProblemKPI
            icon={Copy}
            label="Duplicidades"
            value={resultado.duplicidades.length}
            critical
          />
        </div>

        <Separator />

        {tudoOk ? (
          <Alert className="border-success/40 bg-success/5">
            <Sparkles className="h-4 w-4 text-success" />
            <AlertTitle>Plano de contas 100% conforme!</AlertTitle>
            <AlertDescription>
              Todos os códigos referenciais CFC estão no formato esperado, com prefixos corretos e sem
              duplicidades. Pronto para SPED ECD/ECF.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {resultado.problemasCriticos > 0 && (
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {resultado.problemasCriticos} problema(s) crítico(s) impedem a transmissão
                </AlertTitle>
                <AlertDescription>
                  Formato inválido e duplicidades causam rejeição direta na Receita Federal — corrija antes de
                  gerar o SPED.
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="grid grid-cols-4 w-full h-12 bg-white/5 rounded-2xl p-1">
                <TabsTrigger value="formato" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2 text-xs font-black uppercase tracking-tighter">
                  Formato
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-black bg-current/20 border-none">
                    {resultado.formatoInvalido.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="prefixo" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2 text-xs font-black uppercase tracking-tighter">
                  Prefixo
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-black bg-current/20 border-none">
                    {resultado.prefixoIncorreto.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="duplicidade" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2 text-xs font-black uppercase tracking-tighter">
                  Duplicidade
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-black bg-current/20 border-none">
                    {resultado.duplicidades.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="sem-ref" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2 text-xs font-black uppercase tracking-tighter">
                  Sem ref.
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-black bg-current/20 border-none">
                    {resultado.semReferencial}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="formato" className="mt-3 space-y-1.5 max-h-72 overflow-y-auto">
                {resultado.formatoInvalido.length === 0 ? (
                  <EmptyOk msg="Todos os códigos seguem o padrão N.NN.NN.NN[.NNN]." />
                ) : (
                  resultado.formatoInvalido.map((c) => (
                    <Row
                      key={c.id}
                      severity="error"
                      codigo={c.codigo}
                      descricao={c.descricao}
                      atual={c.codigo_referencial || '—'}
                      msg="Não corresponde ao padrão CFC (N.NN.NN.NN[.NNN])."
                      onCopy={() => copy(c.codigo_referencial || '')}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="prefixo" className="mt-3 space-y-1.5 max-h-72 overflow-y-auto">
                {resultado.prefixoIncorreto.length === 0 ? (
                  <EmptyOk msg="Todos os prefixos batem com a natureza declarada." />
                ) : (
                  resultado.prefixoIncorreto.map(({ conta, esperado, atual, sugestao }) => (
                    <Row
                      key={conta.id}
                      severity="warning"
                      codigo={conta.codigo}
                      descricao={`${conta.descricao} (${conta.natureza})`}
                      atual={conta.codigo_referencial || '—'}
                      msg={`Prefixo "${atual}" não combina com natureza. Esperado: ${esperado.join(' ou ')}.${
                        sugestao ? ` Sugerido: ${sugestao}` : ''
                      }`}
                      onCopy={sugestao ? () => copy(sugestao) : undefined}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="duplicidade" className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {resultado.duplicidades.length === 0 ? (
                  <EmptyOk msg="Nenhum código referencial usado em mais de uma conta." />
                ) : (
                  resultado.duplicidades.map((d) => (
                    <div
                      key={d.codigo_referencial}
                      className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <code className="font-mono font-semibold text-destructive">{d.codigo_referencial}</code>
                        <Badge variant="destructive" className="text-[10px]">
                          {d.contas.length} contas
                        </Badge>
                      </div>
                      <ul className="space-y-1 ml-2">
                        {d.contas.map((c) => (
                          <li key={c.id} className="flex items-baseline gap-2">
                            <code className="font-mono text-muted-foreground">{c.codigo}</code>
                            <span>{c.descricao}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="sem-ref" className="mt-3 space-y-1.5 max-h-72 overflow-y-auto">
                {resultado.semReferencial === 0 ? (
                  <EmptyOk msg="Todas as contas analíticas têm código referencial." />
                ) : (
                  <p className="text-xs text-muted-foreground px-2">
                    {resultado.semReferencial} conta(s) analítica(s) sem código referencial CFC. Sem isso o SPED é
                    gerado mas algumas validações da Receita podem falhar. Edite cada conta no Plano de Contas
                    para adicionar o código.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function KPI({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'rounded-2xl border bg-white/[0.03] px-4 py-3 shadow-sm transition-all',
        tone === 'success' && 'border-success/20 bg-success/5 shadow-success/10',
        tone === 'warning' && 'border-warning/20 bg-warning/5 shadow-warning/10',
        !tone && 'border-white/5'
      )}
    >
      <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground opacity-60 mb-1">{label}</p>
      <p
        className={cn(
          'font-mono font-black text-xl tracking-tighter tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
        )}
      >
        {value.toLocaleString('pt-BR')}
      </p>
    </motion.div>
  );
}

function ProblemKPI({
  icon: Icon,
  label,
  value,
  critical,
}: {
  icon: typeof AlertCircle;
  label: string;
  value: number;
  critical?: boolean;
}) {
  const ok = value === 0;
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        'rounded-2xl border px-4 py-3 flex items-center gap-4 transition-all shadow-lg backdrop-blur-md',
        ok && 'border-success/20 bg-success/5 shadow-success/10',
        !ok && critical && 'border-destructive/20 bg-destructive/5 shadow-destructive/10',
        !ok && !critical && 'border-warning/20 bg-warning/5 shadow-warning/10',
      )}
    >
      <div className={cn(
        'p-2.5 rounded-xl transition-all',
        ok && 'bg-success/10 text-success',
        !ok && critical && 'bg-destructive/10 text-destructive',
        !ok && !critical && 'bg-warning/10 text-warning',
      )}>
        <Icon className="h-5 w-5 shrink-0" />
      </div>
      <div>
        <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground opacity-60 mb-0.5">{label}</p>
        <p
          className={cn(
            'font-mono font-black text-xl tracking-tighter tabular-nums',
            ok && 'text-success',
            !ok && critical && 'text-destructive',
            !ok && !critical && 'text-warning',
          )}
        >
          {value.toLocaleString('pt-BR')}
        </p>
      </div>
    </motion.div>
  );
}

function Row({
  severity,
  codigo,
  descricao,
  atual,
  msg,
  onCopy,
}: {
  severity: 'error' | 'warning';
  codigo: string;
  descricao: string;
  atual: string;
  msg: string;
  onCopy?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, x: 5 }}
      className={cn(
        'flex items-start gap-4 rounded-2xl border p-4 text-xs transition-all shadow-sm group/row',
        severity === 'error' && 'border-destructive/20 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10',
        severity === 'warning' && 'border-warning/20 bg-warning/5 hover:border-warning/40 hover:bg-warning/10',
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className={cn(
            "font-mono font-black border-none",
            severity === 'error' ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
          )}>
            {codigo}
          </Badge>
          <span className="font-bold text-foreground opacity-80 truncate">{descricao}</span>
          <code
            className={cn(
              'font-mono ml-auto px-2.5 py-1 rounded-xl text-[10px] font-black tracking-tighter shadow-inner',
              severity === 'error' && 'bg-destructive/10 text-destructive',
              severity === 'warning' && 'bg-warning/10 text-warning',
            )}
          >
            {atual}
          </code>
        </div>
        <p className="text-muted-foreground mt-2 font-medium leading-relaxed">{msg}</p>
      </div>
      {onCopy && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 shrink-0 rounded-xl hover:bg-current/10 transition-colors" 
          onClick={onCopy} 
          aria-label="Copiar"
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
}

function EmptyOk({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-success py-2 px-2">
      <CheckCircle2 className="h-4 w-4" /> {msg}
    </div>
  );
}
