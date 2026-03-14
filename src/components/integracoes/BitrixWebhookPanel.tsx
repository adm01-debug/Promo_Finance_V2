import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Webhook,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bitrix24-webhook`;

export const BitrixWebhookPanel = () => {
  const [showUrl, setShowUrl] = useState(false);

  // Fetch recent webhook events
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['bitrix-webhook-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bitrix_webhook_events')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    toast.success('URL copiada para a área de transferência');
  };

  const getEventTypeBadge = (eventType: string) => {
    if (eventType.includes('deal')) {
      return <Badge className="bg-primary/10 text-primary border-primary/20">Deal</Badge>;
    }
    if (eventType.includes('contact')) {
      return <Badge className="bg-success/10 text-success border-success/20">Contato</Badge>;
    }
    if (eventType.includes('company')) {
      return <Badge className="bg-accent text-accent-foreground border-accent">Empresa</Badge>;
    }
    if (eventType.includes('invoice')) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Fatura</Badge>;
    }
    if (eventType.includes('lead')) {
      return <Badge className="bg-secondary text-secondary-foreground border-secondary">Lead</Badge>;
    }
    return <Badge variant="secondary">{eventType}</Badge>;
  };

  const getActionFromEvent = (eventType: string): string => {
    if (eventType.includes('add')) return 'Criado';
    if (eventType.includes('update')) return 'Atualizado';
    if (eventType.includes('delete')) return 'Excluído';
    return 'Evento';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Webhooks Bitrix24
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Receba eventos em tempo real do Bitrix24 para sincronização automática
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Webhook URL Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração do Webhook</CardTitle>
          <CardDescription>
            Configure esta URL no Bitrix24 para receber eventos automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showUrl ? 'text' : 'password'}
                  value={WEBHOOK_URL}
                  readOnly
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowUrl(!showUrl)}
                >
                  {showUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Adicione esta URL nas configurações de webhooks do seu Bitrix24
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Como configurar:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Acesse seu Bitrix24 → Configurações → Integrações → Webhooks</li>
              <li>Clique em "Adicionar Webhook de Saída"</li>
              <li>Cole a URL acima no campo de destino</li>
              <li>Selecione os eventos que deseja receber (deals, contatos, empresas, etc.)</li>
              <li>Salve a configuração</li>
            </ol>
          </div>

          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-500">Importante</p>
              <p className="text-muted-foreground">
                O webhook não requer autenticação JWT para receber eventos do Bitrix24.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eventos Recentes</CardTitle>
          <CardDescription>
            Últimos 50 eventos recebidos do Bitrix24
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events && events.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recebido em</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {event.event_type}
                      </TableCell>
                      <TableCell>{getActionFromEvent(event.event_type)}</TableCell>
                      <TableCell>
                        {event.processed ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Processado
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1">
                            <Clock className="h-3 w-3" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(event.received_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Evento</DialogTitle>
                              <DialogDescription>
                                {event.event_type} - {format(new Date(event.received_at), "dd/MM/yyyy HH:mm:ss")}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[400px]">
                              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                                {JSON.stringify(event.payload, null, 2)}
                              </pre>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum evento recebido ainda</p>
              <p className="text-sm">Configure o webhook no Bitrix24 para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
