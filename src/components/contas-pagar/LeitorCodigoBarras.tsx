import { useState, useRef, useCallback } from 'react';
import { 
  Camera, 
  X, 
  Scan, 
  Check, 
  AlertCircle, 
  Loader2,
  Keyboard,
  Building2,
  Calendar,
  DollarSign,
  Copy,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { parseBoleto, DadosBoleto, formatarLinhaDigitavel, validarCodigoBarras } from '@/lib/barcode-parser';
import { formatCurrency } from '@/lib/formatters';

interface LeitorCodigoBarrasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoletoDetected: (dados: DadosBoleto) => void;
}

export function LeitorCodigoBarras({ open, onOpenChange, onBoletoDetected }: LeitorCodigoBarrasProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'camera'>('manual');
  const [codigoInput, setCodigoInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dadosBoleto, setDadosBoleto] = useState<DadosBoleto | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleInputChange = (value: string) => {
    // Remove espaços e formata conforme digita
    const limpo = value.replace(/\s/g, '');
    setCodigoInput(limpo);
    
    // Auto-processar quando atingir tamanho válido
    if (validarCodigoBarras(limpo)) {
      processarCodigo(limpo);
    } else {
      setDadosBoleto(null);
    }
  };

  const processarCodigo = useCallback((codigo: string) => {
    setIsProcessing(true);
    
    try {
      const dados = parseBoleto(codigo);
      setDadosBoleto(dados);
      
      if (dados.valido) {
        toast.success('Código de barras processado com sucesso!');
      } else {
        toast.error(`Erros encontrados: ${dados.erros.join(', ')}`);
      }
    } catch (error) {
      console.error('Erro ao processar código:', error);
      toast.error('Não foi possível processar o código de barras');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleConfirmar = () => {
    if (dadosBoleto && dadosBoleto.valido) {
      onBoletoDetected(dadosBoleto);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCodigoInput('');
    setDadosBoleto(null);
    onOpenChange(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      toast.info('Aponte a câmera para o código de barras do boleto');
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast.error('Não foi possível acessar a câmera. Use a entrada manual.');
      setActiveTab('manual');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'manual' | 'camera');
    if (tab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleInputChange(text);
    } catch {
      toast.error('Não foi possível colar da área de transferência');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Leitura de Código de Barras
          </DialogTitle>
          <DialogDescription>
            Digite ou escaneie o código de barras do boleto para preencher automaticamente
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <Keyboard className="h-4 w-4" />
              Digitar Código
            </TabsTrigger>
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="h-4 w-4" />
              Usar Câmera
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código de Barras ou Linha Digitável</Label>
              <div className="flex gap-2">
                <Input
                  id="codigo"
                  placeholder="Digite os 44 ou 47 dígitos do boleto..."
                  value={codigoInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handlePaste} title="Colar">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cole ou digite os números sem espaços. O sistema detecta automaticamente.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!cameraStream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
              <div className="absolute inset-0 border-2 border-primary/50 m-8 rounded pointer-events-none" />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Dica</AlertTitle>
              <AlertDescription>
                Posicione o código de barras dentro da área destacada. 
                Se a leitura automática falhar, use a entrada manual.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Resultado do processamento */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-4"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Processando código...</span>
            </motion.div>
          )}

          {dadosBoleto && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className={dadosBoleto.valido ? 'border-green-500' : 'border-destructive'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {dadosBoleto.valido ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      Dados do Boleto
                    </CardTitle>
                    <Badge variant={dadosBoleto.valido ? 'default' : 'destructive'}>
                      {dadosBoleto.valido ? 'Válido' : 'Inválido'}
                    </Badge>
                  </div>
                  {dadosBoleto.erros.length > 0 && (
                    <CardDescription className="text-destructive">
                      {dadosBoleto.erros.join(', ')}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Banco</p>
                        <p className="font-medium">{dadosBoleto.banco}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="font-medium text-lg">{formatCurrency(dadosBoleto.valor)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Vencimento</p>
                        <p className="font-medium">
                          {dadosBoleto.dataVencimento 
                            ? format(dadosBoleto.dataVencimento, "dd/MM/yyyy", { locale: ptBR })
                            : 'Não informado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{dadosBoleto.tipo === 'bancario' ? 'Boleto Bancário' : 'Convênio'}</Badge>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Linha Digitável</p>
                        <p className="font-mono text-xs break-all">
                          {formatarLinhaDigitavel(dadosBoleto.linhaDigitavel)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(dadosBoleto.linhaDigitavel)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar} 
            disabled={!dadosBoleto?.valido}
          >
            <Check className="mr-2 h-4 w-4" />
            Usar Dados do Boleto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
