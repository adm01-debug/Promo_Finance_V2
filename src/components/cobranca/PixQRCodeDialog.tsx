import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Copy, Check, Loader2, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePixCobranca } from '@/hooks/usePixQRCode';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ContaReceber {
  id: string;
  valor: number;
  cliente_nome: string;
  descricao: string;
  chave_pix?: string | null;
}

interface PixQRCodeDialogProps {
  conta: ContaReceber;
  trigger?: React.ReactNode;
  chavePadrao?: string;
}

export function PixQRCodeDialog({ conta, trigger, chavePadrao }: PixQRCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { 
    payload, 
    qrCodeUrl, 
    isLoading, 
    error, 
    chavePix, 
    setChavePix,
    copiarCodigoCompleto 
  } = usePixCobranca({
    ...conta,
    chave_pix: conta.chave_pix || chavePadrao,
  });

  const handleCopiar = async () => {
    const success = await copiarCodigoCompleto();
    if (success) {
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Erro ao copiar código');
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `pix-${conta.id.substring(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code baixado!');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            Gerar PIX
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            PIX QR Code
          </DialogTitle>
          <DialogDescription>
            Cobrança para {conta.cliente_nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valor da cobrança */}
          <div className="text-center py-2">
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(conta.valor)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {conta.descricao}
            </p>
          </div>

          {/* Campo de chave PIX */}
          <div className="space-y-2">
            <Label htmlFor="chavePix">Chave PIX (recebedor)</Label>
            <Input
              id="chavePix"
              placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
            />
          </div>

          {/* QR Code */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[300px] bg-muted/30 rounded-lg"
              >
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Gerando QR Code...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[300px] bg-destructive/10 rounded-lg"
              >
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setChavePix(chavePix)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </motion.div>
            ) : qrCodeUrl ? (
              <motion.div
                key="qrcode"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-[250px] h-[250px]"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[300px] bg-muted/30 rounded-lg"
              >
                <QrCode className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">
                  Informe a chave PIX para gerar o QR Code
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Código Copia e Cola */}
          {payload && (
            <div className="space-y-2">
              <Label>Código Copia e Cola</Label>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted/30 rounded-md p-2 text-xs font-mono overflow-hidden">
                  <p className="truncate">{payload}</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleCopiar}
                        className={cn(copied && 'bg-success/10 border-success/20')}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copiar código</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={handleCopiar}
              disabled={!payload}
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copiar Código
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={!qrCodeUrl}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente compacto para uso em tabelas
interface PixQRCodeButtonProps {
  conta: ContaReceber;
  chavePadrao?: string;
  size?: 'sm' | 'icon';
}

export function PixQRCodeButton({ conta, chavePadrao, size = 'icon' }: PixQRCodeButtonProps) {
  return (
    <PixQRCodeDialog
      conta={conta}
      chavePadrao={chavePadrao}
      trigger={
        <Button variant="ghost" size={size} className="h-8 w-8">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <QrCode className="h-4 w-4 text-primary" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Gerar PIX QR Code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Button>
      }
    />
  );
}
