import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { QrCode, Copy, ExternalLink, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { useEmpresas } from '@/hooks/useFinancialData';
import { PixQrCodeDialog } from '@/components/asaas/PixQrCodeDialog';
import { toast } from 'sonner';

export function PixRecebimento() {
  const { data: empresas = [] } = useEmpresas();
  const empresaId = empresas?.[0]?.id;
  const { payments, loadingPayments } = useAsaas(empresaId);
  
  const [qrDialog, setQrDialog] = useState<{ asaasId: string; pixCola?: string | null; pixQr?: string | null } | null>(null);

  const pixPayments = (payments || []).filter(p => p.tipo === 'pix');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  if (loadingPayments) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-black">QR Code Estático</p>
                <p className="text-sm font-medium mt-0.5">Disponível via Asaas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-500/5 border-blue-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Copy className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-black">Copia e Cola</p>
                <p className="text-sm font-medium mt-0.5">Gerado automaticamente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-black">Split Real-time</p>
                <p className="text-sm font-medium mt-0.5">Divisão automática IBS/CBS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/10">
        <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Cobranças PIX Recentes
          </CardTitle>
          <CardDescription>Acompanhe o status dos seus recebimentos via PIX</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pixPayments.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground/20" />
              <p className="text-muted-foreground font-medium">Nenhuma cobrança PIX emitida recentemente.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {pixPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? "bg-success/10" : "bg-primary/10"
                    )}>
                      {payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : (
                        <QrCode className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{payment.sacado_nome || 'Consumidor Final'}</span>
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase font-black tracking-widest",
                          payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? "border-success/50 text-success bg-success/5" : "border-primary/50 text-primary bg-primary/5"
                        )}>
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vencimento: {formatDate(payment.data_vencimento)} • Ref: {payment.asaas_id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-black tabular-nums text-success">{formatCurrency(payment.valor)}</p>
                      {payment.valor_liquido && payment.valor_liquido < payment.valor && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                          Líquido: {formatCurrency(payment.valor_liquido)} (Split Retido)
                        </p>
                      )}
                      {!payment.valor_liquido && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Valor Nominal</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                        onClick={() => setQrDialog({ 
                          asaasId: payment.asaas_id, 
                          pixCola: payment.pix_copia_cola, 
                          pixQr: payment.pix_qrcode 
                        })}
                      >
                        <QrCode className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                        onClick={() => payment.pix_copia_cola && copyToClipboard(payment.pix_copia_cola)}
                        disabled={!payment.pix_copia_cola}
                      >
                        <Copy className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {qrDialog && (
        <PixQrCodeDialog
          open={!!qrDialog}
          onOpenChange={(open) => !open && setQrDialog(null)}
          asaasId={qrDialog.asaasId}
          pixCopiaCola={qrDialog.pixCola}
          pixQrcode={qrDialog.pixQr}
          empresaId={empresaId}
        />
      )}
    </div>
  );
}