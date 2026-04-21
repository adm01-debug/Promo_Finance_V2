import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Download, FileArchive, Copy, ChevronRight, ShieldAlert, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { useSpedEcdValidacao, useGerarSpedContabil, type ChecklistItem, type SpedGeracaoResult } from '@/hooks/useSpedContabil';
import { baixarSpedZip } from '@/lib/sped-zip';
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
  const validar = useSpedEcdValidacao();
  const gerar = useGerarSpedContabil();

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
  const podeGerar = data && erros === 0;

  const handleGerar = async () => {
    try {
      const r = await gerar.mutateAsync({ empresaId, anoCalendario, tipo: 'ECD', silent: true });
      setResultado(r);
      setStep(3);
    } catch {
      // erro tratado pelo onError do hook
    }
  };

  const copyHash = () => {
    if (resultado?.hash_sha256) {
      navigator.clipboard.writeText(resultado.hash_sha256);
      toast.success('Hash copiado');
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
              <Button size="sm" variant="ghost" onClick={() => validar.mutate({ empresaId, anoCalendario })} className="ml-auto gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Re-validar
              </Button>
            </div>

            <div className="space-y-2">
              {data.checklist.map((item) => <ChecklistRow key={item.id} item={item} />)}
            </div>

            {erros > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Geração bloqueada</AlertTitle>
                <AlertDescription>Corrija os {erros} erro(s) acima antes de gerar o arquivo.</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <div className="flex-1" />
              <Button onClick={handleGerar} disabled={!podeGerar || gerar.isPending}>
                {gerar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                Gerar arquivo SPED ECD
              </Button>
            </div>
          </div>
        )}

        {step === 3 && resultado && (
          <div className="space-y-4">
            <Alert className="border-emerald-500/40 bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Arquivo gerado com sucesso</AlertTitle>
              <AlertDescription>{resultado.file_name}</AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground">Linhas</p><p className="font-mono font-medium">{resultado.total_linhas}</p></div>
                  <div><p className="text-muted-foreground">Lançamentos</p><p className="font-mono font-medium">{resultado.total_lancamentos}</p></div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Hash SHA-256</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-muted p-2 rounded break-all">{resultado.hash_sha256}</code>
                    <Button size="icon" variant="outline" onClick={copyHash}><Copy className="h-3.5 w-3.5" /></Button>
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
              <Button onClick={() => window.open(resultado.url, '_blank')} className="gap-2">
                <Download className="h-4 w-4" /> Baixar .txt
              </Button>
              <Button variant="outline" onClick={baixarZip} className="gap-2">
                <FileArchive className="h-4 w-4" /> Baixar .zip (com README)
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const [open, setOpen] = useState(false);
  const Icon = item.status === 'ok' ? CheckCircle2 : item.status === 'warn' ? AlertTriangle : XCircle;
  const color =
    item.status === 'ok' ? 'text-emerald-600' :
    item.status === 'warn' ? 'text-amber-600' : 'text-destructive';
  const border =
    item.status === 'ok' ? 'border-l-emerald-500/50' :
    item.status === 'warn' ? 'border-l-amber-500/50' : 'border-l-destructive';
  const hasItens = item.itens && item.itens.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn('rounded border bg-card border-l-4 p-3', border)}>
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', color)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{item.label}</p>
            {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
          </div>
          {hasItens && (
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                {open ? 'Ocultar' : 'Detalhes'}
              </Button>
            </CollapsibleTrigger>
          )}
        </div>
        {hasItens && (
          <CollapsibleContent className="mt-2 pl-8">
            <ul className="text-xs space-y-1 text-muted-foreground">
              {item.itens!.map((i, idx) => <li key={idx} className="font-mono">• {i}</li>)}
              {item.itens!.length >= 20 && <li className="italic">… mais itens omitidos</li>}
            </ul>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}
