// ============================================
// DIALOG: QR Code Pix Viewer
// ============================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, QrCode } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asaasId: string;
  pixCopiaCola?: string | null;
  pixQrcode?: string | null;
  empresaId?: string;
}

export function PixQrCodeDialog({ open, onOpenChange, asaasId, pixCopiaCola, pixQrcode, empresaId }: Props) {
  const { buscarPixQrCode } = useAsaas(empresaId);
  const [qrData, setQrData] = useState<{ encodedImage?: string; payload?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !pixQrcode && !qrData) {
      setLoading(true);
      buscarPixQrCode.mutateAsync(asaasId)
        .then(data => setQrData(data))
        .catch(() => toast.error('Erro ao buscar QR Code'))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asaasId]);

  const imageData = pixQrcode || qrData?.encodedImage;
  const copiaCola = pixCopiaCola || qrData?.payload;

  const copyToClipboard = () => {
    if (copiaCola) {
      navigator.clipboard.writeText(copiaCola);
      toast.success('Pix Copia e Cola copiado!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setQrData(null); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> QR Code Pix
          </DialogTitle>
          <DialogDescription>Escaneie ou copie o código para pagar</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {loading ? (
            <Skeleton className="h-48 w-48 rounded-lg" />
          ) : imageData ? (
            <img
              src={`data:image/png;base64,${imageData}`}
              alt="QR Code Pix"
              className="h-48 w-48 rounded-lg border border-border"
            />
          ) : (
            <div className="h-48 w-48 rounded-lg border border-border flex items-center justify-center text-muted-foreground text-sm">
              QR Code indisponível
            </div>
          )}

          {copiaCola && (
            <div className="w-full space-y-2">
              <p className="text-xs text-muted-foreground text-center">Pix Copia e Cola</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap">
                  {copiaCola}
                </code>
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
