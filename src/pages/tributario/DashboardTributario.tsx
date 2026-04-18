// ============================================
// DASHBOARD TRIBUTÁRIO V2 — Bento Grid Premium
// ============================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Scale, TrendingDown, Sparkles, Calendar, Heart, FileDown, Loader2, FileCode2 } from 'lucide-react';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useDashboardTributario } from '@/hooks/useDashboardTributario';
import { useRelatorioAnual } from '@/hooks/useRelatorioAnual';
import { useExportarSped } from '@/hooks/useExportarSped';
import { formatCurrency } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EvolucaoCargaChart } from '@/components/tributario/dashboard/EvolucaoCargaChart';
import { ComparativoRegimes } from '@/components/tributario/dashboard/ComparativoRegimes';
import { OportunidadesElisaoWidget } from '@/components/tributario/dashboard/OportunidadesElisaoWidget';
import { ProximosVencimentosTimeline } from '@/components/tributario/dashboard/ProximosVencimentosTimeline';
import { AlertasAtivosResumo } from '@/components/tributario/dashboard/AlertasAtivosResumo';
import { RelatoriosAgendadosCard } from '@/components/tributario/dashboard/RelatoriosAgendadosCard';
import { PrevisaoTributariaIA } from '@/components/tributario/dashboard/PrevisaoTributariaIA';
import { ConformidadeFiscalCard } from '@/components/tributario/dashboard/ConformidadeFiscalCard';
import { BenchmarkSetorialCard } from '@/components/tributario/dashboard/BenchmarkSetorialCard';
import { CopilotTributarioFloat } from '@/components/tributario/dashboard/CopilotTributarioFloat';
import { DRETributariaPanel } from '@/components/tributario/dashboard/DRETributariaPanel';
import { AssistenteFechamentoMensal } from '@/components/tributario/dashboard/AssistenteFechamentoMensal';

const REGIME_LABEL: Record<string, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
};

type Periodo = 3 | 6 | 12;

export default function DashboardTributario() {
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();
  const [periodo, setPeriodo] = useState<Periodo>(12);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [anoRelatorio, setAnoRelatorio] = useState<number>(new Date().getFullYear());

  const empresaSelecionada = empresas.find((e) => e.id === empresaId);
  const { kpis, serie, simulacao, oportunidades, vencimentos, alertas, isLoading } =
    useDashboardTributario(empresaId, periodo);
  const { isLoading: loadingRelatorio, gerarPDF } = useRelatorioAnual(
    relatorioOpen ? empresaId : undefined,
    relatorioOpen ? anoRelatorio : undefined
  );
  const exportarSped = useExportarSped();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Scale className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Dashboard Tributário
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Visão consolidada · Reforma Tributária · Elisão fiscal
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Selecionar empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v) as Periodo)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>

          {empresaSelecionada?.regime_tributario && (
            <Badge variant="secondary" className="self-center">
              {REGIME_LABEL[empresaSelecionada.regime_tributario] ?? empresaSelecionada.regime_tributario}
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={!empresaId || exportarSped.isPending}
            onClick={() =>
              empresaId &&
              exportarSped.mutate({
                empresaId,
                periodo: new Date().toISOString().slice(0, 7),
              })
            }
            className="gap-2"
          >
            {exportarSped.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCode2 className="h-4 w-4" />}
            SPED
          </Button>

          <Dialog open={relatorioOpen} onOpenChange={setRelatorioOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" disabled={!empresaId} className="gap-2">
                <FileDown className="h-4 w-4" /> Relatório Anual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Relatório Anual Tributário</DialogTitle>
                <DialogDescription>
                  PDF executivo com sumário, apuração mensal, oportunidades de elisão e recomendações.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <label className="text-sm font-medium">Ano de referência</label>
                <Select value={String(anoRelatorio)} onValueChange={(v) => setAnoRelatorio(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 3 }).map((_, i) => {
                      const y = new Date().getFullYear() - i;
                      return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRelatorioOpen(false)}>Cancelar</Button>
                <Button onClick={gerarPDF} disabled={loadingRelatorio} className="gap-2">
                  {loadingRelatorio ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                  Baixar PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!empresaId ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">Selecione uma empresa para visualizar o dashboard</p>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={itemVariants}>
              <KpiCard icon={<TrendingDown className="h-4 w-4" />} label="Carga Tributária Efetiva" value={`${kpis.cargaEfetiva.toFixed(2)}%`} hint="Sobre faturamento" accent="primary" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard icon={<Sparkles className="h-4 w-4" />} label="Economia Estimada" value={formatCurrency(kpis.totalEconomizado)} hint="Estratégias de elisão" accent="success" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard
                icon={<Calendar className="h-4 w-4" />}
                label="Próximo Vencimento"
                value={kpis.proximoVencimento?.data ? format(parseISO(kpis.proximoVencimento.data), 'dd/MM', { locale: ptBR }) : '—'}
                hint={kpis.proximoVencimento?.descricao ?? 'Sem vencimentos'}
                accent="warning"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard
                icon={<Heart className="h-4 w-4" />}
                label="Saúde Fiscal"
                value={`${kpis.saudeFiscal}/100`}
                hint={kpis.saudeFiscal >= 80 ? 'Excelente' : kpis.saudeFiscal >= 60 ? 'Boa' : 'Atenção'}
                accent={kpis.saudeFiscal >= 80 ? 'success' : kpis.saudeFiscal >= 60 ? 'warning' : 'destructive'}
              />
            </motion.div>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <EvolucaoCargaChart serie={serie} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <ComparativoRegimes resultado={simulacao} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <OportunidadesElisaoWidget oportunidades={oportunidades} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <ProximosVencimentosTimeline vencimentos={vencimentos} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <AlertasAtivosResumo alertas={alertas} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <RelatoriosAgendadosCard empresaId={empresaId} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <PrevisaoTributariaIA empresaId={empresaId} serieReal={serie} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <ConformidadeFiscalCard empresaId={empresaId} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <BenchmarkSetorialCard empresaId={empresaId} />
            </motion.div>
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <DRETributariaPanel empresaId={empresaId} />
            </motion.div>
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <AssistenteFechamentoMensal
                empresaId={empresaId}
                ano={new Date().getFullYear()}
                mes={new Date().getMonth() + 1}
              />
            </motion.div>
          </motion.div>
        </>
      )}
      <CopilotTributarioFloat empresaId={empresaId} />
    </div>
  );
}

interface KpiProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: 'primary' | 'success' | 'warning' | 'destructive';
}

function KpiCard({ icon, label, value, hint, accent }: KpiProps) {
  const accentMap = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
  };
  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50 hover-scale transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>
      </CardContent>
    </Card>
  );
}
