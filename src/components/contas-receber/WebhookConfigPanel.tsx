
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, Copy, CheckCircle2, Terminal, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function WebhookConfigPanel() {
  const [webhookUrl] = useState(`https://iikqosstymnnxaujzadw.supabase.co/functions/v1/webhook-financeiro?id=project_alpha`);
  const [copied, setCopied] = useState(false);

  const mockLogs = [
    { id: '1', event: 'payment.received', status: 'success', time: '5min atrás', details: 'Pix R$ 250,00' },
    { id: '2', event: 'payment.received', status: 'success', time: '1h atrás', details: 'Boleto R$ 1.200,00' },
    { id: '3', event: 'payment.failed', status: 'error', time: '3h atrás', details: 'Erro: Token Inválido' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('URL do Webhook copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Webhook de Baixa Automática
          </CardTitle>
          <CardDescription className="text-xs">
            Utilize esta URL para integrar seu banco ou processador de pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="bg-background/50 border-white/10 text-xs font-mono" />
            <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
              {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Status: Listener Ativo (v2.0)
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
          <Terminal className="h-3.5 w-3.5" /> Recent Payloads / Logs
        </h4>
        <div className="space-y-2">
          {mockLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs transition-all hover:bg-white/10">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  log.status === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                )}>
                  {log.status === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-bold">{log.event}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{log.details}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" /> {log.time}
                </p>
                <Badge variant="outline" className={cn(
                  "text-[9px] mt-1 font-black",
                  log.status === 'success' ? 'bg-success/20 text-success border-none' : 'bg-destructive/20 text-destructive border-none'
                )}>
                  {log.status === 'success' ? 'COMPLETED' : 'FAILED'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
        Ver documentação completa da API
      </Button>
    </div>
  );
}
