import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileX, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ShieldCheck,
  Wifi,
  Send,
  Server,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { processarSefaz, SefazResponse } from '@/lib/sefaz-simulator';
import { registrarEvento } from '@/lib/sefaz-event-logger';
import { useEmpresas } from '@/hooks/useFinancialData';

interface InutilizacaoFormData {
  empresa: string;
  serie: string;
  numeroInicial: string;
  numeroFinal: string;
  justificativa: string;
  ano: string;
}

export function InutilizacaoNFe() {
  const { data: empresas = [] } = useEmpresas();
  
  const [formData, setFormData] = useState<InutilizacaoFormData>({
    empresa: '',
    serie: '1',
    numeroInicial: '',
    numeroFinal: '',
    justificativa: '',
    ano: new Date().getFullYear().toString()
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [sefazResponse, setSefazResponse] = useState<SefazResponse | null>(null);

  const steps = [
    { id: 'validating', label: 'Validando dados', icon: ShieldCheck },
    { id: 'connecting', label: 'Conectando à SEFAZ', icon: Wifi },
    { id: 'sending', label: 'Enviando solicitação', icon: Send },
    { id: 'processing', label: 'Processando resposta', icon: Server },
    { id: 'done', label: 'Finalizado', icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = currentStep ? ((currentIndex + 1) / steps.length) * 100 : 0;

  const quantidadeNumeros = formData.numeroInicial && formData.numeroFinal 
    ? Math.max(0, parseInt(formData.numeroFinal) - parseInt(formData.numeroInicial) + 1)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.empresa) {
      toast.error('Selecione uma empresa');
      return;
    }

    if (!formData.numeroInicial || !formData.numeroFinal) {
      toast.error('Informe a faixa de numeração');
      return;
    }

    const numInicio = parseInt(formData.numeroInicial);
    const numFim = parseInt(formData.numeroFinal);

    if (numInicio > numFim) {
      toast.error('O número inicial deve ser menor ou igual ao número final');
      return;
    }

    if (numFim - numInicio > 999) {
      toast.error('A faixa máxima permitida é de 1000 números');
      return;
    }

    if (formData.justificativa.length < 15) {
      toast.error('A justificativa deve ter no mínimo 15 caracteres');
      return;
    }

    setIsProcessing(true);
    setSefazResponse(null);

    const empresa = empresas.find(c => c.id === formData.empresa);
    const tempoInicio = Date.now();

    // Simula os passos de processamento
    for (const step of steps.slice(0, -1)) {
      setCurrentStep(step.id);
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
    }

    // Processa com o simulador
    const response = await processarSefaz({
      tipo: 'inutilizacao',
      justificativa: formData.justificativa,
      inutilizacao: {
        cnpj: empresa?.cnpj || '',
        serie: formData.serie,
        numeroInicial: numInicio,
        numeroFinal: numFim,
        justificativa: formData.justificativa,
        ano: formData.ano
      }
    });

    const tempoTotal = Date.now() - tempoInicio;
    // Registra evento no histórico
    registrarEvento({
      tipo: 'INUTILIZACAO',
      numeroNfe: `${formData.numeroInicial.padStart(9, '0')} - ${formData.numeroFinal.padStart(9, '0')}`,
      cStat: response.cStat,
      xMotivo: response.xMotivo,
      protocolo: response.protocolo,
      ambiente: 'homologacao',
      tempoResposta: tempoTotal,
      detalhes: response.success 
        ? `Inutilização da faixa ${formData.numeroInicial} a ${formData.numeroFinal} (Série ${formData.serie}) - ${formData.justificativa}`
        : `Falha na inutilização: ${response.errors?.join(', ') || response.xMotivo}`
    });

    setCurrentStep('done');
    setSefazResponse(response);
    setIsProcessing(false);

    if (response.success) {
      toast.success(`Numeração inutilizada! Protocolo: ${response.protocolo}`);
      // Limpa o formulário após sucesso
      setFormData({
        empresa: formData.empresa,
        serie: '1',
        numeroInicial: '',
        numeroFinal: '',
        justificativa: '',
        ano: new Date().getFullYear().toString()
      });
    } else {
      toast.error(response.xMotivo || 'Erro ao inutilizar numeração');
    }
  };

  const handleReset = () => {
    setSefazResponse(null);
    setCurrentStep('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileX className="h-5 w-5" />
            Inutilização de Numeração
          </CardTitle>
          <CardDescription>
            Inutilize uma faixa de numeração de NF-e não utilizada junto à SEFAZ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa Emitente *</Label>
                <Select
                  value={formData.empresa}
                  onValueChange={(value) => setFormData({ ...formData, empresa: value })}
                  disabled={isProcessing}
                >
                  <SelectTrigger id="empresa">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nome_fantasia || emp.razao_social} - {emp.cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serie">Série</Label>
                  <Input
                    id="serie"
                    value={formData.serie}
                    onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                    disabled={isProcessing}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroInicial">Número Inicial *</Label>
                <Input
                  id="numeroInicial"
                  type="number"
                  placeholder="Ex: 1"
                  value={formData.numeroInicial}
                  onChange={(e) => setFormData({ ...formData, numeroInicial: e.target.value })}
                  disabled={isProcessing}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroFinal">Número Final *</Label>
                <Input
                  id="numeroFinal"
                  type="number"
                  placeholder="Ex: 10"
                  value={formData.numeroFinal}
                  onChange={(e) => setFormData({ ...formData, numeroFinal: e.target.value })}
                  disabled={isProcessing}
                  min={1}
                />
              </div>
              <div className="flex items-end">
                <div className="bg-muted/50 rounded-lg p-3 w-full text-center">
                  <div className="text-xs text-muted-foreground">Quantidade</div>
                  <div className="text-lg font-bold flex items-center justify-center gap-1">
                    <Hash className="h-4 w-4" />
                    {quantidadeNumeros} número(s)
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa * (mínimo 15 caracteres)</Label>
              <Textarea
                id="justificativa"
                placeholder="Informe o motivo da inutilização (ex: Numeração pulada por falha no sistema)"
                value={formData.justificativa}
                onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                disabled={isProcessing}
                rows={3}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">
                {formData.justificativa.length}/15 caracteres mínimos
              </div>
            </div>

            {/* Painel de Status */}
            {(isProcessing || sefazResponse) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-muted/50 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center gap-2">
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : sefazResponse?.success ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {isProcessing ? 'Comunicando com SEFAZ...' : 
                     sefazResponse?.success ? 'Numeração Inutilizada!' : 'Erro na Inutilização'}
                  </span>
                </div>

                {isProcessing && (
                  <>
                    <Progress value={progress} className="h-2" />
                    <div className="grid grid-cols-5 gap-2">
                      {steps.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isActive = idx === currentIndex;
                        const isDone = idx < currentIndex;
                        return (
                          <div 
                            key={step.id}
                            className={`text-center transition-colors ${
                              isActive ? 'text-primary' : isDone ? 'text-success' : 'text-muted-foreground'
                            }`}
                          >
                            <StepIcon className={`h-4 w-4 mx-auto mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                            <span className="text-xs">{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {sefazResponse && (
                  <div className={`rounded-lg p-3 ${sefazResponse.success ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={sefazResponse.success ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
                        cStat: {sefazResponse.cStat}
                      </Badge>
                      <span className="text-sm font-medium">{sefazResponse.xMotivo}</span>
                    </div>
                    {sefazResponse.protocolo && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Protocolo:</span>
                        <code className="font-mono text-xs bg-background px-2 py-1 rounded">{sefazResponse.protocolo}</code>
                      </div>
                    )}
                    {sefazResponse.errors && sefazResponse.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {sefazResponse.errors.map((err, idx) => (
                          <p key={idx} className="text-sm text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {err}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isProcessing || !formData.empresa || !formData.numeroInicial || !formData.numeroFinal || formData.justificativa.length < 15}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FileX className="h-4 w-4" />
                    Inutilizar Numeração
                  </>
                )}
              </Button>
              {sefazResponse && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Nova Inutilização
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-warning">Informações Importantes</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>A inutilização é <strong>irreversível</strong> e deve ser usada apenas para números que não serão utilizados.</li>
                <li>Utilize quando houver quebra de sequência na numeração das NF-e.</li>
                <li>A faixa máxima permitida é de 1000 números por solicitação.</li>
                <li>A justificativa deve conter no mínimo 15 caracteres.</li>
                <li>Esta operação será registrada permanentemente na SEFAZ.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
