import { useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  FileSearch,
  Wand2,
  ShieldAlert,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSpedEcdValidacao } from '@/hooks/useSpedContabil';
import { usePreValidacaoSped } from '@/hooks/usePreValidacaoSped';
import { useAuditoriaCFC } from '@/hooks/useAuditoriaCFC';
import { SpedChecklistRow } from './SpedChecklistRow';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  empresaId: string;
  anoCalendario: number;
  onAbrirWizard?: () => void;
}

export function SpedEcdPreviewDialog({
  open,
  onOpenChange,
  empresaId,
  anoCalendario,
  onAbrirWizard,
}: Props) {
  const validar = useSpedEcdValidacao();
  const preValidacao = usePreValidacaoSped(empresaId, anoCalendario);
  const auditoriaCFC = useAuditoriaCFC(empresaId);

  useEffect(() => {
    if (open && empresaId && anoCalendario) {
      validar.mutate({ empresaId, anoCalendario });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaId, anoCalendario]);

  const data = validar.data;
  const erros = data?.validacoes.erros ?? [];
  const avisos = data?.validacoes.avisos ?? [];
  const checklist = data?.checklist ?? [];

  const resumoChecklist = useMemo(() => {
    const total = checklist.length;
    const ok = checklist.filter((c) => c.status === 'ok').length;
    const warn = checklist.filter((c) => c.status === 'warn').length;
    const error = checklist.filter((c) => c.status === 'error').length;
    return { total, ok, warn, error };
  }, [checklist]);

  const totalErros = erros.length + (auditoriaCFC.problemasCriticos || 0);
  const totalAvisos = avisos.length;
  const podeGerar =
    !!data &&
    totalErros === 0 &&
    preValidacao.podeGerar &&
    auditoriaCFC.problemasCriticos === 0;

  const statusGlobal: 'ok' | 'warn' | 'error' = totalErros > 0
    ? 'error'
    : totalAvisos > 0
      ? 'warn'
      : 'ok';

  const StatusIcon = statusGlobal === 'ok' ? CheckCircle2 : statusGlobal === 'warn' ? AlertTriangle : XCircle;
  const statusLabel = statusGlobal === 'ok'
    ? 'Pronto para gerar'
    : statusGlobal === 'warn'
      ? 'Pronto com avisos'
      : 'Geração bloqueada';
  const statusTone = statusGlobal === 'ok'
    ? 'bg-success/10 text-success border-success/30'
    : statusGlobal === 'warn'
      ? 'bg-warning/10 text-warning border-warning/30'
      : 'bg-destructive/10 text-destructive border-destructive/30';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            Pré-visualização SPED ECD · {anoCalendario}
          </DialogTitle>
          <DialogDescription>
            Inspecione checklist, erros e avisos antes de gerar o arquivo TXT.
          </DialogDescription>
        </DialogHeader>

        {validar.isPending && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Coletando validações...
          </div>
        )}

        {!validar.isPending && data && (
          <div className="space-y-4">
            {/* Banner de status global */}
            <div
              className={cn(
                'rounded-lg border p-4 flex items-start gap-3',
                statusTone,
              )}
            >
              <StatusIcon className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{statusLabel}</p>
                <p className="text-sm opacity-90 mt-0.5">
                  {totalErros > 0
                    ? `${totalErros} erro(s) crítico(s) impedem a geração do arquivo.`
                    : totalAvisos > 0
                      ? `Nenhum erro crítico. ${totalAvisos} aviso(s) recomendam revisão.`
                      : 'Todas as validações passaram. O arquivo pode ser gerado.'}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => validar.mutate({ empresaId, anoCalendario })}
                className="gap-1 shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Re-validar
              </Button>
            </div>

            {/* Cabeçalho com dados da empresa */}
            <Card>
              <CardContent className="pt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Info label="Empresa" value={data.empresa.razao_social} />
                <Info label="CNPJ" value={data.empresa.cnpj} mono />
                <Info label="Período" value={`${data.periodo.inicio} → ${data.periodo.fim}`} />
                <Info label="Lançamentos" value={String(data.total_lancamentos)} mono />
              </CardContent>
            </Card>

            {/* Resumo do checklist */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResumoCard label="Itens checados" value={resumoChecklist.total} tone="default" />
              <ResumoCard label="OK" value={resumoChecklist.ok} tone="success" />
              <ResumoCard label="Avisos" value={resumoChecklist.warn + totalAvisos} tone="warn" />
              <ResumoCard label="Erros" value={resumoChecklist.error + totalErros} tone="error" />
            </div>

            {/* Erros e avisos detalhados */}
            {(erros.length > 0 || avisos.length > 0) && (
              <Card>
                <CardContent className="pt-5 space-y-4">
                  {erros.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <p className="text-sm font-semibold">Erros ({erros.length})</p>
                      </div>
                      <ScrollArea className="max-h-40 rounded-md border bg-destructive/5 p-2">
                        <ul className="space-y-1 text-sm">
                          {erros.map((e, i) => (
                            <li key={i} className="flex gap-2">
                              <Badge variant="destructive" className="h-5 px-1.5 shrink-0">{i + 1}</Badge>
                              <span className="text-foreground">{e}</span>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  )}

                  {erros.length > 0 && avisos.length > 0 && <Separator />}

                  {avisos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <p className="text-sm font-semibold">Avisos ({avisos.length})</p>
                      </div>
                      <ScrollArea className="max-h-40 rounded-md border bg-warning/5 p-2">
                        <ul className="space-y-1 text-sm">
                          {avisos.map((a, i) => (
                            <li key={i} className="flex gap-2">
                              <Badge variant="outline" className="h-5 px-1.5 shrink-0 border-warning/40 text-warning">
                                {i + 1}
                              </Badge>
                              <span className="text-foreground">{a}</span>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Checklist completo */}
            <div>
              <p className="text-sm font-semibold mb-2">Checklist de validação</p>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <SpedChecklistRow key={item.id} item={item} />
                ))}
              </div>
            </div>

            {auditoriaCFC.problemasCriticos > 0 && (
              <Alert variant="error" title="Códigos referenciais CFC com problemas">
                {auditoriaCFC.problemasCriticos} problema(s) crítico(s) detectado(s) no plano de contas.
                Audite o plano antes de gerar o SPED.
              </Alert>
            )}

            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Pré-visualização preliminar</AlertTitle>
              <AlertDescription>
                Esta tela mostra apenas o que será validado e gerado. Após gerar o TXT, valide-o no
                PVA-ECD da Receita Federal antes da transmissão oficial.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {onAbrirWizard && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onAbrirWizard();
              }}
              disabled={!podeGerar}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {podeGerar ? 'Abrir wizard de geração' : 'Corrija os erros para gerar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('font-medium', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

function ResumoCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'default' | 'success' | 'warn' | 'error';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warn'
        ? 'text-warning'
        : tone === 'error'
          ? 'text-destructive'
          : 'text-foreground';
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold', toneClass)}>{value}</p>
    </div>
  );
}
