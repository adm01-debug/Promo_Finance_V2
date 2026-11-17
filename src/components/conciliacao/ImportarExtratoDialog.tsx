import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { parseExtratoBancario, ResultadoImportacao } from '@/lib/ofx-parser';
import { ExtratoPreviewStep } from './ExtratoPreviewStep';
import { toast } from 'sonner';
import { validarMagicBytes } from '@/lib/magic-bytes';
import type { ImportarExtratoDialogProps, Step } from './ImportarExtratoDialog.types';
import { ImportarExtratoDialogArquivoLocal } from './ImportarExtratoDialogArquivoLocal';

export function ImportarExtratoDialog({
  open,
  onOpenChange,
  onImportSuccess,
  contaBancariaId,
}: ImportarExtratoDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [selectedTransacoes, setSelectedTransacoes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('arquivo');

  const resetState = () => {
    setStep('upload');
    setProgress(0);
    setResultado(null);
    setSelectedTransacoes(new Set());
  };
  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleOpenFinanceConnect = async () => {
    // Este caminho (Conciliação -> Importar Extrato -> Open Finance) fingia uma
    // conexão de 3s e inventava três transações ('SYNC: RECEBIMENTO PIX CLIENTE
    // A', 'SYNC: PAGAMENTO FORNECEDOR B', 'SYNC: TARIFA BANCARIA') mais um saldo
    // final de R$ 15.420,50, já pré-selecionadas, anunciando "Transações
    // sincronizadas com sucesso". Confirmar levava tudo isso para
    // transacoes_bancarias via handleImportSuccess — extrato fabricado dentro da
    // conciliação, pela tela, sem nem chamar a edge function (achado do Devin na
    // PR #425). Não há provedor de Open Finance homologado: o botão fica
    // desabilitado e isto aqui é a defesa de quem chamar de outro jeito.
    toast.error('Open Finance não homologado', {
      description:
        'Nenhuma instituição está conectada de verdade. Importe o extrato pelo arquivo OFX, OFC ou CSV do banco.',
    });
  };

  const processFile = useCallback(
    async (file: File) => {
      setStep('processing');
      setProgress(0);
      try {
        const erroConteudo = await validarMagicBytes(file, [
          '.ofx',
          '.ofc',
          '.csv',
          '.txt',
          '.xlsx',
          '.xls',
        ]);
        if (erroConteudo) throw new Error(erroConteudo);
        const ext = file.name.toLowerCase().split('.').pop();
        if (ext === 'xlsx' || ext === 'xls') {
          const buffer = await file.arrayBuffer();
          const { parseExcel } = await import('@/lib/ofx-parser');
          const result = parseExcel(buffer, file.name);
          setProgress(100);
          setResultado(result);
          if (result.sucesso && result.extrato) {
            setSelectedTransacoes(new Set(result.extrato.transacoes.map((t) => t.id)));
            setStep('preview');
          } else {
            setStep('error');
          }
          return;
        }
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 15, 70));
        }, 100);
        const content = await file.text();
        clearInterval(progressInterval);
        setProgress(80);

        let mapeamento: Record<string, string> | undefined = undefined;
        if (contaBancariaId) {
          const { data: conta } = await supabase
            .from('contas_bancarias')
            .select('configuracoes_conciliacao')
            .eq('id', contaBancariaId)
            .maybeSingle();
          const cfg = conta?.configuracoes_conciliacao as {
            mapeamento_extrato?: Record<string, string>;
          } | null;
          if (cfg?.mapeamento_extrato) {
            mapeamento = cfg.mapeamento_extrato;
          }
        }

        const result = parseExtratoBancario(content, file.name, mapeamento);
        setProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 300));
        setResultado(result);
        if (result.sucesso && result.extrato) {
          setSelectedTransacoes(new Set(result.extrato.transacoes.map((t) => t.id)));
          setStep('preview');
        } else {
          setStep('error');
        }
      } catch (error: unknown) {
        setResultado({
          sucesso: false,
          erro: `Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          avisos: [],
        });
        setStep('error');
      }
    },
    [contaBancariaId]
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      processFile(files[0]);
    },
    [processFile]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const toggleTransacao = (id: string) => {
    setSelectedTransacoes((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (!resultado?.extrato) return;
    setSelectedTransacoes((prev) =>
      prev.size === resultado.extrato!.transacoes.length
        ? new Set()
        : new Set(resultado.extrato!.transacoes.map((t) => t.id))
    );
  };

  const handleConfirmImport = () => {
    if (!resultado?.extrato) return;
    onImportSuccess({
      ...resultado.extrato,
      transacoes: resultado.extrato.transacoes.filter((t) => selectedTransacoes.has(t.id)),
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'transition-all duration-300',
          step === 'preview' ? 'sm:max-w-3xl' : 'sm:max-w-md'
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Importar Extrato Bancário
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Faça upload do arquivo OFX, OFC ou CSV do seu banco'}
            {step === 'processing' && 'Processando arquivo...'}
            {step === 'preview' && 'Revise as transações antes de importar'}
            {step === 'error' && 'Ocorreu um erro ao processar o arquivo'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <ImportarExtratoDialogArquivoLocal
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              dragActive={dragActive}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              handleFileSelect={handleFileSelect}
              handleOpenFinanceConnect={handleOpenFinanceConnect}
            />
          )}

          {(step === 'processing' || step === 'open-finance-loading') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-8"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-medium">
                    {step === 'processing' ? 'Processando extrato...' : 'Conectando ao banco...'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{progress}% concluído</p>
                </div>
                <Progress value={progress} className="h-2 w-full max-w-xs" />
                <p className="text-xs text-muted-foreground text-center">
                  {step === 'processing'
                    ? 'Analisando transações e validando formato...'
                    : 'Autenticando via Open Finance seguro...'}
                </p>
              </div>
            </motion.div>
          )}

          {step === 'preview' && resultado?.extrato && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ExtratoPreviewStep
                extrato={resultado.extrato}
                avisos={resultado.avisos}
                selectedTransacoes={selectedTransacoes}
                onToggleTransacao={toggleTransacao}
                onToggleAll={toggleAll}
              />
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-8"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-destructive">Erro ao processar arquivo</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {resultado?.erro || 'Erro desconhecido'}
                  </p>
                </div>
                {resultado?.avisos && resultado.avisos.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {resultado.avisos.map((aviso, i) => (
                      <p key={i}>• {aviso}</p>
                    ))}
                  </div>
                )}
                <Button variant="outline" onClick={resetState} className="mt-2">
                  Tentar novamente
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 'preview' && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={selectedTransacoes.size === 0}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Importar {selectedTransacoes.size} transações
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
