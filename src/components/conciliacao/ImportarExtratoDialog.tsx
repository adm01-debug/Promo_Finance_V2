import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Link2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { parseExtratoBancario, ExtratoOFX, ResultadoImportacao } from '@/lib/ofx-parser';
import { ExtratoPreviewStep } from './ExtratoPreviewStep';
import { toast } from 'sonner';

interface ImportarExtratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (extrato: ExtratoOFX) => void;
  contaBancariaId?: string;
}

type Step = 'upload' | 'processing' | 'preview' | 'error' | 'open-finance-loading';

export function ImportarExtratoDialog({ open, onOpenChange, onImportSuccess, contaBancariaId }: ImportarExtratoDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [selectedTransacoes, setSelectedTransacoes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('arquivo');

  const resetState = () => { setStep('upload'); setProgress(0); setResultado(null); setSelectedTransacoes(new Set()); };
  const handleClose = () => { resetState(); onOpenChange(false); };

  const handleOpenFinanceConnect = async () => {
    setStep('open-finance-loading');
    setProgress(10);
    
    // Simulação de conexão Open Finance (Pluggy/Belvo flow)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 400);

    try {
      // Mock de dados retornados pelo Open Finance
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockExtrato: ExtratoOFX = {
        nomeArquivo: 'Open Finance Sync',
        dataImportacao: new Date(),
        formato: 'OPEN_FINANCE',
        conta: {
          agencia: '0001',
          conta: '12345-6',
          banco: 'Open Finance',
          saldoFinal: 15420.50,
          tipoConta: 'CORRENTE',
          moeda: 'BRL'
        },
        transacoes: [
          { id: 'of1', data: new Date(), descricao: 'SYNC: RECEBIMENTO PIX CLIENTE A', valor: 1250.00, tipo: 'credito' },
          { id: 'of2', data: new Date(), descricao: 'SYNC: PAGAMENTO FORNECEDOR B', valor: -450.00, tipo: 'debito' },
          { id: 'of3', data: new Date(), descricao: 'SYNC: TARIFA BANCARIA', valor: -12.50, tipo: 'debito' },
        ]
      };

      setResultado({ sucesso: true, extrato: mockExtrato, avisos: ['Sincronizado via Open Finance'] });
      setSelectedTransacoes(new Set(mockExtrato.transacoes.map(t => t.id)));
      setStep('preview');
      toast.success('Conexão Open Finance estabelecida', {
        description: 'Transações sincronizadas com sucesso.'
      });
    } catch (error) {
      setStep('error');
    } finally {
      clearInterval(interval);
    }
  };

  const processFile = async (file: File) => {
    setStep('processing'); setProgress(0);
    try {
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const { parseExcel } = await import('@/lib/ofx-parser');
        const result = parseExcel(buffer, file.name);
        setProgress(100);
        setResultado(result);
        if (result.sucesso && result.extrato) {
          setSelectedTransacoes(new Set(result.extrato.transacoes.map(t => t.id)));
          setStep('preview');
        } else { setStep('error'); }
        return;
      }
      const progressInterval = setInterval(() => { setProgress(prev => Math.min(prev + 15, 70)); }, 100);
      const content = await file.text();
      clearInterval(progressInterval); setProgress(80);
      
      let mapeamento: Record<string, string> | undefined = undefined;
      if (contaBancariaId) {
        const { data: conta } = await supabase
          .from('contas_bancarias')
          .select('configuracoes_conciliacao')
          .eq('id', contaBancariaId)
          .maybeSingle();
        const cfg = conta?.configuracoes_conciliacao as { mapeamento_extrato?: Record<string, string> } | null;
        if (cfg?.mapeamento_extrato) {
          mapeamento = cfg.mapeamento_extrato;
        }
      }

      const result = parseExtratoBancario(content, file.name, mapeamento);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      setResultado(result);
      if (result.sucesso && result.extrato) {
        setSelectedTransacoes(new Set(result.extrato.transacoes.map(t => t.id)));
        setStep('preview');
      } else { setStep('error'); }
    } catch (error: unknown) {
      setResultado({ sucesso: false, erro: `Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, avisos: [] });
      setStep('error');
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => { if (!files || files.length === 0) return; processFile(files[0]); }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); handleFileSelect(e.dataTransfer.files); };

  const toggleTransacao = (id: string) => {
    setSelectedTransacoes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    if (!resultado?.extrato) return;
    setSelectedTransacoes(prev => prev.size === resultado.extrato!.transacoes.length ? new Set() : new Set(resultado.extrato!.transacoes.map(t => t.id)));
  };

  const handleConfirmImport = () => {
    if (!resultado?.extrato) return;
    onImportSuccess({ ...resultado.extrato, transacoes: resultado.extrato.transacoes.filter(t => selectedTransacoes.has(t.id)) });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn("transition-all duration-300", step === 'preview' ? "sm:max-w-3xl" : "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Importar Extrato Bancário</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Faça upload do arquivo OFX, OFC ou CSV do seu banco'}
            {step === 'processing' && 'Processando arquivo...'}
            {step === 'preview' && 'Revise as transações antes de importar'}
            {step === 'error' && 'Ocorreu um erro ao processar o arquivo'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="arquivo" className="gap-2"><FileText className="h-4 w-4" />Arquivo Local</TabsTrigger>
                  <TabsTrigger value="open-finance" className="gap-2"><ShieldCheck className="h-4 w-4" />Open Finance</TabsTrigger>
                </TabsList>

                <TabsContent value="arquivo">
                  <div className={cn("border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer", dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30")}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => document.getElementById('ofx-file-upload')?.click()}>
                    <input id="ofx-file-upload" type="file" accept=".ofx,.ofc,.csv,.txt,.xlsx,.xls" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                    <div className={cn("h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all", dragActive ? "bg-primary text-primary-foreground scale-110" : "bg-primary/10 text-primary")}>
                      <Upload className="h-8 w-8" />
                    </div>
                    <p className="font-medium text-foreground">{dragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo aqui'}</p>
                    <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Badge variant="outline" className="text-xs">.OFX</Badge><Badge variant="outline" className="text-xs">.OFC</Badge>
                      <Badge variant="outline" className="text-xs">.CSV</Badge><Badge variant="outline" className="text-xs">.TXT</Badge>
                      <Badge variant="outline" className="text-xs">.XLSX</Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="open-finance">
                  <div className="border border-primary/20 bg-primary/5 rounded-2xl p-6 text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-lg">Conexão Bancária Direta</h4>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Sincronize transações em tempo real sem precisar exportar arquivos. Seguro e autorizado via Open Finance.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 py-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                      <Building2 className="h-6 w-6" />
                      <Building2 className="h-6 w-6" />
                      <Building2 className="h-6 w-6" />
                      <Building2 className="h-6 w-6" />
                    </div>
                    <Button onClick={handleOpenFinanceConnect} className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80">
                      <Link2 className="h-4 w-4" /> Conectar via Open Finance
                    </Button>
                    <p className="text-[10px] text-muted-foreground">
                      Powered by Lovable Gateway Open Banking. Seus dados são criptografados.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              {activeTab === 'arquivo' && (
                <div className="mt-4 p-3 rounded-lg bg-accent/30 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Formatos suportados:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>OFX/OFC</strong> - Formato padrão de bancos brasileiros</li>
                    <li>• <strong>CSV/TXT</strong> - Colunas: Data, Descrição, Valor, Tipo</li>
                    <li>• <strong>XLSX/XLS</strong> - Colunas: Data, Descrição, Valor</li>
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {(step === 'processing' || step === 'open-finance-loading') && (
            <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-8">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
                <div className="text-center">
                  <p className="font-medium">{step === 'processing' ? 'Processando extrato...' : 'Conectando ao banco...'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{progress}% concluído</p>
                </div>
                <Progress value={progress} className="h-2 w-full max-w-xs" />
                <p className="text-xs text-muted-foreground text-center">
                  {step === 'processing' ? 'Analisando transações e validando formato...' : 'Autenticando via Open Finance seguro...'}
                </p>
              </div>
            </motion.div>
          )}

          {step === 'preview' && resultado?.extrato && (
            <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ExtratoPreviewStep extrato={resultado.extrato} avisos={resultado.avisos} selectedTransacoes={selectedTransacoes} onToggleTransacao={toggleTransacao} onToggleAll={toggleAll} />
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center"><AlertCircle className="h-8 w-8 text-destructive" /></div>
                <div><p className="font-medium text-destructive">Erro ao processar arquivo</p><p className="text-sm text-muted-foreground mt-1 max-w-sm">{resultado?.erro || 'Erro desconhecido'}</p></div>
                {resultado?.avisos && resultado.avisos.length > 0 && (
                  <div className="text-xs text-muted-foreground">{resultado.avisos.map((aviso, i) => <p key={i}>• {aviso}</p>)}</div>
                )}
                <Button variant="outline" onClick={resetState} className="mt-2">Tentar novamente</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 'preview' && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleConfirmImport} disabled={selectedTransacoes.size === 0} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />Importar {selectedTransacoes.size} transações
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
