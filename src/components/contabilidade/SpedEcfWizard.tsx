import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Download, FileArchive, Copy, ChevronRight, ShieldAlert, RefreshCw, Link2, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useSpedEcfValidacao,
  useGerarSpedContabil,
  useRegistrarTransmissaoSped,
  type SpedGeracaoResult,
} from '@/hooks/useSpedContabil';
import { usePreValidacaoSped } from '@/hooks/usePreValidacaoSped';
import { baixarSpedZip } from '@/lib/sped-zip';
import { SpedChecklistRow } from './SpedChecklistRow';
import { PreValidacaoSpedPanel } from './PreValidacaoSpedPanel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  empresaId: string;
  anoCalendario: number;
}

type Step = 1 | 2 | 3;

export function SpedEcfWizard({ open, onOpenChange, empresaId, anoCalendario }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [resultado, setResultado] = useState<(SpedGeracaoResult & { arquivo_id?: string }) | null>(null);
  const [recibo, setRecibo] = useState('');
  const validar = useSpedEcfValidacao();
  const gerar = useGerarSpedContabil();
  const transmitir = useRegistrarTransmissaoSped();

  useEffect(() => {
    if (open && empresaId && anoCalendario) {
      setStep(1);
      setResultado(null);
      setRecibo('');
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
      const r = await gerar.mutateAsync({ empresaId, anoCalendario, tipo: 'ECF', silent: true });
      setResultado(r);
      setStep(3);
    } catch {
      // tratado pelo onError
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
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  const handleRegistrar = async () => {
    if (!resultado?.arquivo_id || !recibo.trim()) return;
    await transmitir.mutateAsync({ arquivoId: resultado.arquivo_id, recibo: recibo.trim() });
    setRecibo('');
  };

  const progresso = step === 1 ? 33 : step === 2 ? 66 : 100;
  const ecd = data?.ecd_referencia;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wizard SPED ECF · {anoCalendario}</DialogTitle>
          <DialogDescription>Validação cruzada com a ECD do mesmo período</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={cn(step >= 1 && 'text-foreground font-medium')}>1. Período & ECD</span>
            <span className={cn(step >= 2 && 'text-foreground font-medium')}>2. Validações</span>
            <span className={cn(step >= 3 && 'text-foreground font-medium')}>3. Download & Transmissão</span>
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

            {ecd ? (
              <Card className="border-emerald-500/40 bg-emerald-500/5">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="h-4 w-4 text-emerald-600" /> ECD vinculada localizada
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Gerada em</p>
                      <p className="font-mono">{format(new Date(ecd.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant={ecd.status === 'transmitido' ? 'default' : 'secondary'}>{ecd.status}</Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Hash SHA-256</p>
                      <code className="text-xs font-mono">{(ecd.hash_sha256 || '').substring(0, 32)}…</code>
                    </div>
                    {ecd.recibo_transmissao && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Recibo de transmissão</p>
                        <p className="font-mono text-xs">{ecd.recibo_transmissao}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert variant="error" title="ECD do período não localizada">
                Gere e (idealmente) transmita a SPED ECD do mesmo ano-calendário antes de prosseguir com a ECF.
              </Alert>
            )}

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
              {data.checklist.map((item) => <SpedChecklistRow key={item.id} item={item} />)}
            </div>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-3">Apuração preliminar (Lucro Real)</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Lucro líquido</p>
                    <p className="font-mono font-medium">R$ {data.apuracao_preview.lucro_liquido.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Base IRPJ</p>
                    <p className="font-mono font-medium">R$ {data.apuracao_preview.base_irpj.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">IRPJ (15% + adicional)</p>
                    <p className="font-mono font-medium">R$ {data.apuracao_preview.irpj.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">CSLL (9%)</p>
                    <p className="font-mono font-medium">R$ {data.apuracao_preview.csll.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {erros > 0 && (
              <Alert variant="error" title="Geração bloqueada">
                Corrija os {erros} erro(s) acima antes de gerar o arquivo.
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <div className="flex-1" />
              <Button onClick={handleGerar} disabled={!podeGerar || gerar.isPending}>
                {gerar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                Gerar arquivo SPED ECF
              </Button>
            </div>
          </div>
        )}

        {step === 3 && resultado && (
          <div className="space-y-4">
            <Alert variant="success" title="Arquivo gerado com sucesso">
              {resultado.file_name}
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

            <Alert variant="warning" title="Arquivo preliminar">
              Sempre valide no PVA-ECF da Receita Federal antes da transmissão oficial.
            </Alert>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => window.open(resultado.url, '_blank')} className="gap-2">
                <Download className="h-4 w-4" /> Baixar .txt
              </Button>
              <Button variant="outline" onClick={baixarZip} className="gap-2">
                <FileArchive className="h-4 w-4" /> Baixar .zip (com README)
              </Button>
            </div>

            {resultado.arquivo_id && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" /> Registrar transmissão à Receita Federal
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Após transmitir o arquivo no PVA-ECF, cole aqui o nº do recibo gerado para marcar como transmitido no histórico.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="recibo-ecf" className="text-xs">Nº do recibo de transmissão</Label>
                    <div className="flex gap-2">
                      <Input
                        id="recibo-ecf"
                        value={recibo}
                        onChange={e => setRecibo(e.target.value)}
                        placeholder="Ex.: 12345678901234567890"
                        className="font-mono text-xs"
                      />
                      <Button onClick={handleRegistrar} disabled={!recibo.trim() || transmitir.isPending} size="sm">
                        {transmitir.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Marcar como transmitido'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex">
              <div className="flex-1" />
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
