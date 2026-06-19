import { motion } from 'framer-motion';
import { 
  History, Clock, CheckCircle2, AlertTriangle, 
  Send, Eye, Download, Printer, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HistoricoCobranca {
  id: string;
  tipo_evento: string;
  descricao: string;
  created_at: string;
  metadados: any;
}

interface BoletoHistoricoProps {
  boletoId: string;
}

export function BoletoHistorico({ boletoId }: BoletoHistoricoProps) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ['boleto-historico', boletoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_cobrancas_boletos')
        .select('*')
        .eq('boleto_id', boletoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HistoricoCobranca[];
    },
    enabled: !!boletoId,
  });

  const getEventoIcon = (tipo: string) => {
    if (tipo.includes('status_pago')) return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (tipo.includes('status_vencido')) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (tipo.includes('status_cancelado')) return <Clock className="h-4 w-4 text-muted-foreground" />;
    if (tipo.includes('envio')) return <Send className="h-4 w-4 text-blue-500" />;
    if (tipo.includes('visualizacao')) return <Eye className="h-4 w-4 text-primary" />;
    return <History className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className="border-white/5 bg-card/[0.02] overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Histórico de Cobrança Neural
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-card/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-card/5 rounded w-3/4" />
                    <div className="h-3 bg-card/5 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : historico && historico.length > 0 ? (
            <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-card/5">
              {historico.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-10"
                >
                  <div className="absolute left-2.5 top-1 -translate-x-1/2 h-3 w-3 rounded-full bg-background border border-white/20 z-10" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {getEventoIcon(item.tipo_evento)}
                      <span className="text-sm font-bold text-foreground leading-none">{item.descricao}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </span>
                    {item.metadados && Object.keys(item.metadados).length > 0 && (
                      <div className="mt-2 p-2 rounded-lg bg-card/[0.03] border border-white/5 text-[10px] font-mono text-muted-foreground break-all">
                        {JSON.stringify(item.metadados, null, 2)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center opacity-40">
              <History className="h-8 w-8 mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhum evento registrado</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
