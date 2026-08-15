// Sub-componentes da página OnboardingTributario — extraídos para zerar max-lines.
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, FileSearch, SkipForward } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CnpjaData } from '@/hooks/useCnpjaLookup';
import { regimeLabel } from './OnboardingTributario.helpers';

export type Step = 1 | 2 | 3 | 4;

export function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Buscar CNPJ' },
    { n: 2, label: 'Confirmar empresa' },
    { n: 3, label: 'Importar histórico' },
    { n: 4, label: 'Convidar contador' },
  ];
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((s, idx) => (
        <div key={s.n} className="flex items-center gap-2 flex-1 min-w-fit">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap',
              current === s.n
                ? 'bg-primary text-primary-foreground border-primary'
                : current > s.n
                  ? 'bg-success/15 text-success border-success/30'
                  : 'bg-muted/50 text-muted-foreground border-border',
            )}
          >
            <span className="font-mono">{s.n}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'h-px flex-1 transition-colors min-w-[12px]',
                current > s.n ? 'bg-success/40' : 'bg-border',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function CnpjaPreview({
  data,
  empresaExistenteRazao,
}: {
  data: CnpjaData;
  empresaExistenteRazao?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{data.razaoSocial || 'Sem razão social'}</p>
        <Badge variant="outline">{regimeLabel(data.regimeAtual)}</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <InfoRow label="CNPJ" value={data.cnpj} mono />
        <InfoRow label="Situação" value={data.situacaoCadastral || '—'} />
        <InfoRow label="Porte" value={data.porte || '—'} />
        <InfoRow label="CNAE principal" value={data.cnaePrincipal?.codigo || '—'} />
        <InfoRow
          label="Cidade/UF"
          value={
            data.endereco?.cidade
              ? `${data.endereco.cidade}/${data.endereco.uf}`
              : '—'
          }
        />
        <InfoRow
          label="Capital social"
          value={
            typeof data.capitalSocial === 'number'
              ? data.capitalSocial.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '—'
          }
        />
      </div>
      {empresaExistenteRazao && (
        <p className="text-xs text-warning flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Empresa já cadastrada como “{empresaExistenteRazao}”.
        </p>
      )}
    </motion.div>
  );
}

export function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-sm', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

export function StepImportarHistorico({
  onVoltar,
  onAvancar,
  onPular,
}: {
  onVoltar: () => void;
  onAvancar: () => void;
  onPular: () => void;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-card/50 backdrop-blur border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            3. Importar histórico (opcional)
          </CardTitle>
          <CardDescription>
            Para uma recomendação mais precisa, importe faturamento e folha. Você pode pular e fazer depois.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Faturamento mensal</CardTitle>
                <CardDescription className="text-xs">
                  CSV com colunas: ano, mês, receita_bruta, receita_servicos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/tributario/dashboard')}
                >
                  Ir para importação
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Folha de pagamento</CardTitle>
                <CardDescription className="text-xs">
                  CSV com colunas: ano, mês, total_folha, encargos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/tributario/dashboard')}
                >
                  Ir para importação
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={onVoltar}>
              Voltar
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={onPular}>
                <SkipForward className="h-4 w-4" />
                Pular para convidar contador
              </Button>
              <Button onClick={onAvancar}>
                Avançar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
