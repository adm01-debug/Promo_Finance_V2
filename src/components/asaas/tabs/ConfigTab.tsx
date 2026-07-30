import type { useAsaas } from '@/hooks/useAsaas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon, DollarSign, Bell, Mail, Phone,
  History, FileText, Send, CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AsaasHook = ReturnType<typeof useAsaas>;

export interface ConfigTabProps {
  config: AsaasHook['config'];
  salvarConfig: AsaasHook['salvarConfig'];
  queueStats: AsaasHook['queueStats'];
}

export function ConfigTab({ config, salvarConfig, queueStats }: ConfigTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" /> Políticas de Retentativa
        </CardTitle>
        <CardDescription>Configure como o sistema deve lidar com falhas de comunicação com o Asaas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Limite de Tentativas</Label>
            <Input type="number" value={config?.retry_limit || 5}
              onChange={(e) => salvarConfig.mutate({ retry_limit: parseInt(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Número máximo de vezes que o sistema tentará sincronizar.</p>
          </div>
          <div className="space-y-2">
            <Label>Intervalo Inicial (minutos)</Label>
            <Input type="number" value={config?.retry_interval_minutes || 30}
              onChange={(e) => salvarConfig.mutate({ retry_interval_minutes: parseInt(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Tempo de espera antes da primeira retentativa.</p>
          </div>
          <div className="space-y-2">
            <Label>Multiplicador Backoff</Label>
            <Input type="number" step="0.5" value={config?.backoff_multiplier || 2.0}
              onChange={(e) => salvarConfig.mutate({ backoff_multiplier: parseFloat(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Fator de aumento do intervalo entre tentativas.</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Multas e Juros Padrão
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Multa Padrão (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={config?.default_fine_percent || 2.0}
                onChange={(e) => salvarConfig.mutate({ default_fine_percent: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Juros Mensais (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={config?.default_interest_percent || 1.0}
                onChange={(e) => salvarConfig.mutate({ default_interest_percent: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Bell className="h-4 w-4" /> Alertas de Falha Crítica
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Alertas por E-mail</Label>
                <p className="text-xs text-muted-foreground">Receba avisos quando a fila atingir o limite</p>
              </div>
              <Switch
                checked={config?.alert_email_enabled}
                onCheckedChange={(v) => salvarConfig.mutate({ alert_email_enabled: v })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Alertas por WhatsApp</Label>
                <p className="text-xs text-muted-foreground">Avisos via mensagens proativas</p>
              </div>
              <Switch
                checked={config?.alert_whatsapp_enabled}
                onCheckedChange={(v) => salvarConfig.mutate({ alert_whatsapp_enabled: v })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>E-mail para Alerta</Label>
              <Input
                placeholder="email@exemplo.com"
                value={config?.alert_email_address || ''}
                onChange={(e) => salvarConfig.mutate({ alert_email_address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp para Alerta</Label>
              <Input
                placeholder="5511999999999"
                value={config?.alert_whatsapp_number || ''}
                onChange={(e) => salvarConfig.mutate({ alert_whatsapp_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Limite para Alerta (Falhas/Hora)</Label>
              <Input
                type="number"
                value={config?.failure_threshold || 5}
                onChange={(e) => salvarConfig.mutate({ failure_threshold: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4" /> Integração Bitrix24
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Etapa Gatilho (Auto-Boleto)</Label>
              <Input
                placeholder="Ex: WON, C1:PREPARATION..."
                value={config?.bitrix_trigger_stage || 'WON'}
                onChange={(e) => salvarConfig.mutate({ bitrix_trigger_stage: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">ID da etapa no Bitrix24 que dispara a geração automática.</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Relatórios e Operações
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg bg-muted/20">
              <h4 className="text-xs font-bold mb-2">Relatório Diário</h4>
              <p className="text-[10px] text-muted-foreground mb-4">
                O sistema gera um resumo automático das últimas 24h e envia para o e-mail de alerta configurado.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8"
                onClick={async () => {
                  try {
                    const { error } = await supabase.functions.invoke('gerar-resumo-financeiro-diario');
                    if (error) throw error;
                    toast.success('Relatório gerado e enviado com sucesso');
                  } catch (e: unknown) {
                    toast.error('Erro ao gerar relatório: ' + (e instanceof Error ? e.message : String(e)));
                  }
                }}
              >
                <Send className="h-3 w-3 mr-2" /> Disparar Agora
              </Button>
            </div>

            <div className="p-4 border rounded-lg bg-muted/20">
              <h4 className="text-xs font-bold mb-2 text-success flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" /> Saúde da Integração
              </h4>
              <div className="space-y-2 mt-3">
                <div className="flex justify-between text-[10px]">
                  <span>Asaas API:</span>
                  <span className="font-bold text-success">ONLINE</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Webhooks:</span>
                  <span className="font-bold text-success">ATIVO</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Fila de Sincronização:</span>
                  <span className="font-bold text-warning">{queueStats.falhas > 0 ? 'ATENÇÃO' : 'NORMAL'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
