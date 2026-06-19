
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, Copy, CheckCircle2, Terminal, AlertCircle, Clock, Search, ChevronRight, Braces } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WebhookConfigPanel() {
  const [webhookUrl] = useState(`https://iikqosstymnnxaujzadw.supabase.co/functions/v1/webhook-financeiro?id=project_alpha`);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('webhooks_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error('Erro ao buscar logs de webhook:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();

    // Inscrição em tempo real para novos logs
    const channel = supabase
      .channel('webhook-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'webhooks_log' }, (payload) => {
        setLogs(prev => [payload.new, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5" /> Recent Payloads / Logs
          </h4>
          {isLoading && <div className="h-3 w-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />}
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {logs.length === 0 && !isLoading ? (
            <div className="p-8 text-center bg-card/5 rounded-xl border border-white/5">
              <Braces className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Nenhum evento capturado</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="group space-y-2">
                <div 
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  className={cn(
                    "p-3 rounded-xl bg-card/5 border border-white/5 flex items-center justify-between text-xs transition-all hover:bg-card/10 cursor-pointer",
                    expandedLogId === log.id && "bg-card/10 border-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                      log.status === 'success' || log.processado ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    )}>
                      {log.status === 'success' || log.processado ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-bold flex items-center gap-2">
                        {log.evento || log.event_type || 'Unknown Event'}
                        <ChevronRight className={cn("h-3 w-3 opacity-0 group-hover:opacity-40 transition-all", expandedLogId === log.id && "rotate-90 opacity-100")} />
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">
                        {log.erro_mensagem || `Origem: ${log.origem || log.provider || 'API'}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                    <Badge variant="outline" className={cn(
                      "text-[9px] mt-1 font-black",
                      log.status === 'success' || log.processado ? 'bg-success/20 text-success border-none' : 'bg-destructive/20 text-destructive border-none'
                    )}>
                      {log.status === 'success' || log.processado ? 'COMPLETED' : 'FAILED'}
                    </Badge>
                  </div>
                </div>

                {expandedLogId === log.id && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] overflow-x-auto"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-primary font-bold uppercase tracking-tighter">Payload RAW</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-[9px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
                          toast.success('JSON copiado!');
                        }}
                      >
                        COPY JSON
                      </Button>
                    </div>
                    <pre className="text-muted-foreground leading-tight">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                    {log.erro_detalhe && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <span className="text-destructive font-bold uppercase tracking-tighter block mb-1">Stack Trace / Error Detail</span>
                        <p className="text-red-400/70 whitespace-pre-wrap">{log.erro_detalhe}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
        Ver documentação completa da API
      </Button>
    </div>
  );
}
