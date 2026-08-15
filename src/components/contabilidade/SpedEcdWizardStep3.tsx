import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Ban, Check, CheckCircle2, Copy, Download, RefreshCw, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SpedGeracaoResult } from '@/hooks/useSpedContabil';
import { baixarSpedZip } from '@/lib/sped-zip';
import { ValidacoesPreSpedDialog } from './ValidacoesPreSpedDialog';
import { KpiCard } from './SpedEcdWizardBits';

interface Props {
  resultado: SpedGeracaoResult;
  downloadBloqueado: boolean;
  errosResultado: string[];
  avisosResultado: string[];
  anoCalendario: number;
  validacoesOpen: boolean;
  onValidacoesOpenChange: (v: boolean) => void;
  onVoltarRevalidar: () => void;
  onFechar: () => void;
}

export function SpedEcdWizardStep3({
  resultado,
  downloadBloqueado,
  errosResultado,
  avisosResultado,
  anoCalendario,
  validacoesOpen,
  onValidacoesOpenChange,
  onVoltarRevalidar,
  onFechar,
}: Props) {
  const [hashCopied, setHashCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

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
        tipo: 'ECD',
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha ao gerar ZIP: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  return (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {downloadBloqueado ? (
        <div className="rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 p-5 flex items-start gap-4 animate-scale-in">
          <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <Ban className="h-5 w-5 text-destructive animate-pulse" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold font-display tracking-tight">Download bloqueado</p>
            <p className="text-sm text-muted-foreground">
              O arquivo <span className="font-mono text-foreground">{resultado.file_name}</span> foi gerado, mas a validação retornou {errosResultado.length} erro(s). Os botões de download estão bloqueados até a correção.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-success/5 p-5 flex items-start gap-4 animate-scale-in">
          <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold font-display tracking-tight">Arquivo gerado com sucesso</p>
            <p className="text-sm text-muted-foreground font-mono">{resultado.file_name}</p>
          </div>
        </div>
      )}

      {errosResultado.length > 0 && (
        <Alert variant="error" title={`${errosResultado.length} erro(s) na geração`}>
          <ScrollArea className="max-h-48 rounded-md border border-border/60 bg-destructive/5 p-2 mt-2">
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
        <Alert variant="warning" title={`${avisosResultado.length} aviso(s)`}>
          <ScrollArea className="max-h-32 rounded-md border border-border/60 bg-warning/5 p-2 mt-2">
            <ul className="space-y-1 text-sm">
              {avisosResultado.map((a, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <Badge variant="outline" className="h-5 px-1.5 shrink-0 mt-0.5 border-warning/40 text-warning">{i + 1}</Badge>
                  <span className="text-foreground break-words">{a}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Linhas" value={resultado.total_linhas} />
        <KpiCard label="Lançamentos" value={resultado.total_lancamentos} />
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Hash SHA-256</p>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Integridade do arquivo</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-muted/40 border border-border/60 rounded-lg p-3 break-all select-all">
            {resultado.hash_sha256}
          </code>
          <TooltipProvider>
            <Tooltip open={hashCopied || undefined}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={hashCopied ? 'default' : 'outline'}
                  onClick={copyHash}
                  aria-label={hashCopied ? 'Hash copiado' : 'Copiar hash SHA-256'}
                  className={cn('transition-all duration-200 hover-scale', hashCopied && 'bg-success text-success-foreground hover:bg-success/90 border-success')}
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

      <Alert variant="info" title="Arquivo preliminar">
        <AlertDescription>
          Sempre valide no PVA-ECD da Receita Federal antes da transmissão oficial.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          onClick={() => onValidacoesOpenChange(true)}
          variant={downloadBloqueado ? 'outline' : 'premium'}
          className={cn(
            'gap-2 hover-scale',
            downloadBloqueado && 'border-destructive/40 text-destructive hover:bg-destructive/10',
          )}
        >
          {downloadBloqueado ? <ShieldAlert className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          Ver validações & baixar
        </Button>

        <div className="flex-1" />
        {downloadBloqueado && (
          <Button variant="outline" onClick={onVoltarRevalidar} className="gap-2 hover-scale">
            <RefreshCw className="h-4 w-4" /> Voltar e revalidar
          </Button>
        )}
        <Button variant="ghost" onClick={onFechar}>Fechar</Button>
      </div>

      <ValidacoesPreSpedDialog
        open={validacoesOpen}
        onOpenChange={onValidacoesOpenChange}
        arquivo={{
          tipo: 'ECD',
          ano_calendario: anoCalendario,
          hash_sha256: resultado.hash_sha256,
          status: downloadBloqueado ? 'rejeitado' : 'gerado',
          validacoes: { erros: errosResultado, avisos: avisosResultado },
          cnpj: resultado.empresa?.cnpj,
          razao_social: resultado.empresa?.razao_social,
          periodo_inicio: resultado.periodo?.inicio,
          periodo_fim: resultado.periodo?.fim,
          total_lancamentos: resultado.total_lancamentos,
          total_linhas: resultado.total_linhas,
        }}
        onDownloadTxt={() => window.open(resultado.url, '_blank')}
        onDownloadZip={() => baixarZip()}
      />
    </motion.div>
  );
}
