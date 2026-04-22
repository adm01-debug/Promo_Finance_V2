import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Download, FileArchive, Copy, Check, ChevronRight, ShieldAlert, RefreshCw, Lock, Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpedEcdValidacao, useGerarSpedContabil, type SpedGeracaoResult } from '@/hooks/useSpedContabil';
import { usePreValidacaoSped } from '@/hooks/usePreValidacaoSped';
import { useAuditoriaCFC } from '@/hooks/useAuditoriaCFC';
import { baixarSpedZip } from '@/lib/sped-zip';
import { SpedChecklistRow } from './SpedChecklistRow';
import { PreValidacaoSpedPanel } from './PreValidacaoSpedPanel';
import { AuditoriaCFCPanel } from './AuditoriaCFCPanel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  empresaId: string;
  anoCalendario: number;
}

type Step = 1 | 2 | 3;

export function SpedEcdWizard({ open, onOpenChange, empresaId, anoCalendario }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [resultado, setResultado] = useState<SpedGeracaoResult | null>(null);
  const [hashCopied, setHashCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validar = useSpedEcdValidacao();
  const gerar = useGerarSpedContabil();
  const preValidacao = usePreValidacaoSped(empresaId, anoCalendario);
  const auditoriaCFC = useAuditoriaCFC(empresaId);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  useEffect(() => {
    if (open && empresaId && anoCalendario) {
      setStep(1);
      setResultado(null);
      validar.mutate({ empresaId, anoCalendario });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaId, anoCalendario]);

  const data = validar.data;
  const erros = data?.validacoes.erros.length || 0;
  const avisos = data?.validacoes.avisos.length || 0;
  const errosLista = data?.validacoes.erros ?? [];
  const avisosLista = data?.validacoes.avisos ?? [];
  const cfcCriticos = auditoriaCFC.problemasCriticos || 0;
  const preValidacaoBloqueia = !preValidacao.podeGerar;
  const totalBloqueios = erros + cfcCriticos + (preValidacaoBloqueia ? 1 : 0);
  const podeGerar = !!data && totalBloqueios === 0;
  const motivoBloqueio = !data
    ? 'Aguarde a validação concluir antes de gerar o SPED ECD.'
    : erros > 0
      ? `${erros} erro(s) crítico(s) na validação do SPED ECD impedem a geração.`
      : cfcCriticos > 0
        ? `${cfcCriticos} problema(s) crítico(s) na auditoria CFC do plano de contas.`
        : preValidacaoBloqueia
          ? 'A pré-validação do período identificou bloqueios. Resolva-os antes de gerar.'
          : '';

  // Bloqueio adicional no Step 3 caso o backend retorne erros mesmo após gerar
  const errosResultado = resultado?.validacoes.erros ?? [];
  const avisosResultado = resultado?.validacoes.avisos ?? [];
  const downloadBloqueado = errosResultado.length > 0;

  const handleGerar = async () => {
    try {
      const r = await gerar.mutateAsync({ empresaId, anoCalendario, tipo: 'ECD', silent: true });
      setResultado(r);
      setStep(3);
    } catch {
      // erro tratado pelo onError do hook
    }
  };

  const copyHash = async () => {
    if (!resultado?.hash_sha256) return;
    try {
      await navigator.clipboard.writeText(resultado.hash_sha256);
      setHashCopied(true);
      toast.success('Hash SHA-256 copiado');
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setHashCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o hash');
    }
  };

  const baixarZip = async () => {
    if (!resultado) return;
    try {
      await baixarSpedZip({
        txtUrl: resultado.url,
        fileName: resultado.file_name,
        hash: resultado.hash_sha256,
        empresa: resultado.empresa,
        periodo: resultado.periodo,
        totalLinhas: resultado.total_linhas,
        totalLancamentos: resultado.total_lancamentos,
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha ao gerar ZIP: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  const progresso = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wizard SPED ECD · {anoCalendario}</DialogTitle>
          <DialogDescription>Validação completa antes da geração do arquivo</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={cn(step >= 1 && 'text-foreground font-medium')}>1. Período</span>
            <span className={cn(step >= 2 && 'text-foreground font-medium')}>2. Validações</span>
            <span className={cn(step >= 3 && 'text-foreground font-medium')}>3. Download</span>
          </div>
          <Progress value={progresso} className="h-1.5" />
        </div>

        {validar.isPending && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando validações...
          </div>
        )}

        {!validar.isPending && data && step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Empresa</p>
                    <p className="font-medium">{data.empresa.razao_social}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CNPJ</p>
                    <p className="font-mono">{data.empresa.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Período</p>
                    <p className="font-medium">{data.periodo.inicio} → {data.periodo.fim}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lançamentos no período</p>
                    <p className="font-medium">{data.total_lancamentos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <div className="flex-1" />
              <Button onClick={() => setStep(2)}>
                Próximo: Validações <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {!validar.isPending && data && step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={erros === 0 ? 'default' : 'destructive'} className="gap-1">
                {erros === 0 ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {erros} erro(s)
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {avisos} aviso(s)
              </Badge>
              {cfcCriticos > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <ShieldAlert className="h-3 w-3" /> CFC: {cfcCriticos} crítico(s)
                </Badge>
              )}
              <Button size="sm" variant="ghost" onClick={() => validar.mutate({ empresaId, anoCalendario })} className="ml-auto gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Re-validar
              </Button>
            </div>

            {/* Lista detalhada de erros bloqueantes */}
            {errosLista.length > 0 && (
              <Alert variant="error" title={`${errosLista.length} erro(s) impedem a geração`}>
                <div className="mt-2">
                  <ScrollArea className="max-h-48 rounded-md border bg-destructive/5 p-2">
                    <ul className="space-y-1.5 text-sm">
                      {errosLista.map((e, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <Badge variant="destructive" className="h-5 px-1.5 shrink-0 mt-0.5">{i + 1}</Badge>
                          <span className="text-foreground break-words">{e}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              </Alert>
            )}

            {/* Lista detalhada de avisos (não bloqueantes) */}
            {avisosLista.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{avisosLista.length} aviso(s) recomendam revisão</AlertTitle>
                <AlertDescription>
                  <ScrollArea className="max-h-40 rounded-md border bg-muted/30 p-2 mt-2">
                    <ul className="space-y-1.5 text-sm">
                      {avisosLista.map((a, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <Badge variant="outline" className="h-5 px-1.5 shrink-0 mt-0.5">{i + 1}</Badge>
                          <span className="text-foreground break-words">{a}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            <PreValidacaoSpedPanel resultado={preValidacao} />

            <AuditoriaCFCPanel resultado={auditoriaCFC} empresa={data.empresa} compact />

            <div className="space-y-2">
              {data.checklist.map((item) => <SpedChecklistRow key={item.id} item={item} />)}
            </div>

            {!podeGerar && data && (
              <Alert variant="error" title="Geração de arquivo bloqueada">
                <div className="space-y-1">
                  <p className="font-medium">{motivoBloqueio}</p>
                  <p className="text-xs opacity-90">
                    Resolva os itens marcados acima e clique em <strong>Re-validar</strong> antes de tentar gerar novamente.
                  </p>
                </div>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <div className="flex-1" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={!podeGerar ? 0 : -1}>
                      <Button
                        onClick={handleGerar}
                        disabled={!podeGerar || gerar.isPending}
                        aria-disabled={!podeGerar || gerar.isPending}
                      >
                        {gerar.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : !podeGerar ? (
                          <Lock className="h-4 w-4 mr-1" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        {!podeGerar ? 'Geração bloqueada' : 'Gerar arquivo SPED ECD'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!podeGerar && (
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium mb-1">Não é possível gerar o SPED ECD</p>
                      <p className="text-xs">{motivoBloqueio}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {step === 3 && resultado && (
          <div className="space-y-4">
            {downloadBloqueado ? (
              <Alert variant="error" title="Download bloqueado: arquivo gerado com erros">
                <p className="mt-1">
                  O arquivo <span className="font-mono">{resultado.file_name}</span> foi gerado, mas a validação
                  retornou {errosResultado.length} erro(s). Os botões de download estão bloqueados até que os
                  erros sejam corrigidos.
                </p>
              </Alert>
            ) : (
              <Alert className="border-success/40 bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertTitle>Arquivo gerado com sucesso</AlertTitle>
                <AlertDescription>{resultado.file_name}</AlertDescription>
              </Alert>
            )}

            {errosResultado.length > 0 && (
              <Alert variant="error" title={`${errosResultado.length} erro(s) na geração`}>
                <ScrollArea className="max-h-48 rounded-md border bg-destructive/5 p-2 mt-2">
                  <ul className="space-y-1.5 text-sm">
                    {errosResultado.map((e, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <Badge variant="destructive" className="h-5 px-1.5 shrink-0 mt-0.5">{i + 1}</Badge>
                        <span className="text-foreground break-words">{e}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </Alert>
            )}

            {avisosResultado.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{avisosResultado.length} aviso(s)</AlertTitle>
                <AlertDescription>
                  <ScrollArea className="max-h-32 rounded-md border bg-muted/30 p-2 mt-2">
                    <ul className="space-y-1 text-sm">
                      {avisosResultado.map((a, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <Badge variant="outline" className="h-5 px-1.5 shrink-0 mt-0.5">{i + 1}</Badge>
                          <span className="text-foreground break-words">{a}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground">Linhas</p><p className="font-mono font-medium">{resultado.total_linhas}</p></div>
                  <div><p className="text-muted-foreground">Lançamentos</p><p className="font-mono font-medium">{resultado.total_lancamentos}</p></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-muted-foreground">Hash SHA-256</p>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Integridade do arquivo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-muted p-2 rounded break-all select-all">{resultado.hash_sha256}</code>
                    <TooltipProvider>
                      <Tooltip open={hashCopied || undefined}>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant={hashCopied ? 'default' : 'outline'}
                            onClick={copyHash}
                            aria-label={hashCopied ? 'Hash copiado' : 'Copiar hash SHA-256'}
                            className={cn('transition-colors', hashCopied && 'bg-success text-success-foreground hover:bg-success/90')}
                          >
                            {hashCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {hashCopied ? (
                            <span className="flex items-center gap-1.5 font-medium">
                              <Check className="h-3.5 w-3.5" /> Copiado para a área de transferência
                            </span>
                          ) : (
                            <span>Copiar hash SHA-256</span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Arquivo preliminar</AlertTitle>
              <AlertDescription>Sempre valide no PVA-ECD da Receita Federal antes da transmissão oficial.</AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={downloadBloqueado ? 0 : -1}>
                      <Button
                        onClick={() => !downloadBloqueado && window.open(resultado.url, '_blank')}
                        disabled={downloadBloqueado}
                        aria-disabled={downloadBloqueado}
                        className="gap-2"
                      >
                        {downloadBloqueado ? <Ban className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                        Baixar .txt
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {downloadBloqueado && (
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium">Download bloqueado</p>
                      <p className="text-xs">Corrija os {errosResultado.length} erro(s) antes de baixar.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={downloadBloqueado ? 0 : -1}>
                      <Button
                        variant="outline"
                        onClick={() => !downloadBloqueado && baixarZip()}
                        disabled={downloadBloqueado}
                        aria-disabled={downloadBloqueado}
                        className="gap-2"
                      >
                        {downloadBloqueado ? <Ban className="h-4 w-4" /> : <FileArchive className="h-4 w-4" />}
                        Baixar .zip (com README)
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {downloadBloqueado && (
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium">Download bloqueado</p>
                      <p className="text-xs">Corrija os {errosResultado.length} erro(s) antes de baixar.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <div className="flex-1" />
              {downloadBloqueado && (
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Voltar e revalidar
                </Button>
              )}
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
