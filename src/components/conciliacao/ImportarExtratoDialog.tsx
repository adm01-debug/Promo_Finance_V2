import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Building2,
  Calendar,
  Hash,
  TrendingUp,
  TrendingDown,
  FileCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { parseExtratoBancario, ExtratoOFX, TransacaoOFX, ResultadoImportacao } from '@/lib/ofx-parser';

interface ImportarExtratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (extrato: ExtratoOFX) => void;
}

type Step = 'upload' | 'processing' | 'preview' | 'error';

export function ImportarExtratoDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportarExtratoDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [selectedTransacoes, setSelectedTransacoes] = useState<Set<string>>(new Set());

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

  const processFile = async (file: File) => {
    setStep('processing');
    setProgress(0);

    try {
      // Check for binary formats that we cannot parse client-side
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'xlsx' || ext === 'xls') {
        setResultado({
          sucesso: false,
          erro: 'Arquivos Excel (.xlsx/.xls) ainda não são suportados. Por favor, exporte o extrato do seu banco em formato OFX ou CSV.',
          avisos: ['Dica: A maioria dos bancos oferece a opção de exportar extratos em OFX no internet banking.'],
        });
        setStep('error');
        return;
      }

      // Simulate progress while reading file
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 70));
      }, 100);

      const content = await file.text();
      
      clearInterval(progressInterval);
      setProgress(80);

      // Parse the file
      const result = parseExtratoBancario(content, file.name);
      
      setProgress(100);

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 300));

      setResultado(result);

      if (result.sucesso && result.extrato) {
        // Select all transactions by default
        setSelectedTransacoes(new Set(result.extrato.transacoes.map(t => t.id)));
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
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    processFile(files[0]);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const toggleTransacao = (id: string) => {
    setSelectedTransacoes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (!resultado?.extrato) return;
    
    if (selectedTransacoes.size === resultado.extrato.transacoes.length) {
      setSelectedTransacoes(new Set());
    } else {
      setSelectedTransacoes(new Set(resultado.extrato.transacoes.map(t => t.id)));
    }
  };

  const handleConfirmImport = () => {
    if (!resultado?.extrato) return;

    const extratoFiltrado: ExtratoOFX = {
      ...resultado.extrato,
      transacoes: resultado.extrato.transacoes.filter(t => selectedTransacoes.has(t.id)),
    };

    onImportSuccess(extratoFiltrado);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "transition-all duration-300",
        step === 'preview' ? "sm:max-w-3xl" : "sm:max-w-md"
      )}>
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
          {/* Upload Step */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-4"
            >
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                  dragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('ofx-file-upload')?.click()}
              >
                <input
                  id="ofx-file-upload"
                  type="file"
                  accept=".ofx,.ofc,.csv,.txt,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all",
                  dragActive ? "bg-primary text-primary-foreground scale-110" : "bg-primary/10 text-primary"
                )}>
                  <Upload className="h-8 w-8" />
                </div>
                <p className="font-medium text-foreground">
                  {dragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo aqui'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="text-xs">.OFX</Badge>
                  <Badge variant="outline" className="text-xs">.OFC</Badge>
                  <Badge variant="outline" className="text-xs">.CSV</Badge>
                  <Badge variant="outline" className="text-xs">.TXT</Badge>
                  <Badge variant="outline" className="text-xs opacity-50">.XLSX (em breve)</Badge>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-accent/30 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Formatos suportados:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>OFX/OFC</strong> - Formato padrão de bancos brasileiros</li>
                  <li>• <strong>CSV/TXT</strong> - Colunas: Data, Descrição, Valor, Tipo</li>
                  <li>• <strong>XLSX/XLS</strong> - Em breve</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
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
                  <p className="font-medium">Processando extrato...</p>
                  <p className="text-sm text-muted-foreground mt-1">{progress}% concluído</p>
                </div>
                <Progress value={progress} className="h-2 w-full max-w-xs" />
                <p className="text-xs text-muted-foreground text-center">
                  Analisando transações e validando formato...
                </p>
              </div>
            </motion.div>
          )}

          {/* Preview Step */}
          {step === 'preview' && resultado?.extrato && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* File Info */}
              <Card className="bg-accent/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{resultado.extrato.nomeArquivo}</p>
                      <p className="text-xs text-muted-foreground">
                        Formato: {resultado.extrato.formato} • {resultado.extrato.transacoes.length} transações
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {resultado.extrato.formato}
                    </Badge>
                  </div>
                  
                  {resultado.extrato.conta.banco && (
                    <Separator className="my-3" />
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {resultado.extrato.conta.banco && (
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Banco
                        </span>
                        <p className="font-medium mt-0.5">{resultado.extrato.conta.banco}</p>
                      </div>
                    )}
                    {resultado.extrato.conta.conta && (
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Conta
                        </span>
                        <p className="font-medium mt-0.5">{resultado.extrato.conta.conta}</p>
                      </div>
                    )}
                    {resultado.extrato.conta.dataInicio && (
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Período
                        </span>
                        <p className="font-medium mt-0.5">
                          {formatDate(resultado.extrato.conta.dataInicio)} - {formatDate(resultado.extrato.conta.dataFim!)}
                        </p>
                      </div>
                    )}
                    {resultado.extrato.conta.saldoFinal !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Saldo Final</span>
                        <p className="font-medium mt-0.5">{formatCurrency(resultado.extrato.conta.saldoFinal)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Warnings */}
              {resultado.avisos.length > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning">Avisos</p>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {resultado.avisos.map((aviso, i) => (
                          <li key={i}>• {aviso}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    Transações ({selectedTransacoes.size} de {resultado.extrato.transacoes.length} selecionadas)
                  </p>
                  <Button variant="ghost" size="sm" onClick={toggleAll}>
                    {selectedTransacoes.size === resultado.extrato.transacoes.length 
                      ? 'Desmarcar todas' 
                      : 'Selecionar todas'}
                  </Button>
                </div>
                
                <ScrollArea className="h-[300px] rounded-lg border">
                  <div className="divide-y">
                    {resultado.extrato.transacoes.map((transacao) => (
                      <TransacaoPreviewItem
                        key={transacao.id}
                        transacao={transacao}
                        selected={selectedTransacoes.has(transacao.id)}
                        onToggle={() => toggleTransacao(transacao.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-success">
                    <TrendingUp className="h-4 w-4" />
                    <span>
                      {formatCurrency(
                        resultado.extrato.transacoes
                          .filter(t => selectedTransacoes.has(t.id) && t.tipo === 'credito')
                          .reduce((sum, t) => sum + t.valor, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-destructive">
                    <TrendingDown className="h-4 w-4" />
                    <span>
                      {formatCurrency(
                        Math.abs(
                          resultado.extrato.transacoes
                            .filter(t => selectedTransacoes.has(t.id) && t.tipo === 'debito')
                            .reduce((sum, t) => sum + t.valor, 0)
                        )
                      )}
                    </span>
                  </div>
                </div>
                <div className="font-medium">
                  Líquido: {formatCurrency(
                    resultado.extrato.transacoes
                      .filter(t => selectedTransacoes.has(t.id))
                      .reduce((sum, t) => sum + t.valor, 0)
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Step */}
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

// Transaction preview item component
interface TransacaoPreviewItemProps {
  transacao: TransacaoOFX;
  selected: boolean;
  onToggle: () => void;
}

function TransacaoPreviewItem({ transacao, selected, onToggle }: TransacaoPreviewItemProps) {
  const isCredito = transacao.tipo === 'credito';
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-accent/30",
        selected ? "bg-accent/20" : ""
      )}
      onClick={onToggle}
    >
      <div className={cn(
        "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
        selected 
          ? "bg-primary border-primary text-primary-foreground" 
          : "border-muted-foreground/30"
      )}>
        {selected && <CheckCircle2 className="h-3 w-3" />}
      </div>
      
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
        isCredito ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      )}>
        {isCredito ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transacao.descricao}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(transacao.data)}
          {transacao.numeroReferencia && ` • Ref: ${transacao.numeroReferencia}`}
        </p>
      </div>
      
      <span className={cn(
        "font-semibold text-sm tabular-nums",
        isCredito ? "text-success" : "text-destructive"
      )}>
        {isCredito ? '+' : ''}{formatCurrency(transacao.valor)}
      </span>
    </div>
  );
}
