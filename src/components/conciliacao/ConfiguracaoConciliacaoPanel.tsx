import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, Save, CheckCircle2, AlertCircle, Bell, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface AlertaConfig {
  threshold: number;
  interval: 'daily' | 'weekly' | 'monthly';
  channel: 'email' | 'push' | 'whatsapp';
  active: boolean;
}

interface ConciliacaoConfig {
  tolerancia_centavos: number;
  aceite_automatico: boolean;
  periodo_tolerancia_dias: number;
  alertas_inadimplencia?: AlertaConfig;
  alertas_conciliacao?: AlertaConfig;
}

export function ConfiguracaoConciliacaoPanel({ contaId }: { contaId?: string }) {
  const [config, setConfig] = useState<ConciliacaoConfig>({
    tolerancia_centavos: 0.50,
    aceite_automatico: false,
    periodo_tolerancia_dias: 5,
    alertas_inadimplencia: { threshold: 10, interval: 'weekly', channel: 'email', active: false },
    alertas_conciliacao: { threshold: 5, interval: 'daily', channel: 'email', active: false }
  });
  const [selectedContaId, setSelectedContaId] = useState<string | undefined>(contaId);
  const queryClient = useQueryClient();

  const { data: contas } = useQuery({
    queryKey: ['contas-bancarias-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contas_bancarias').select('id, nome, banco, configuracoes_conciliacao').eq('ativo', true);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (selectedContaId && contas) {
      const conta = contas.find(c => c.id === selectedContaId);
      if (conta?.configuracoes_conciliacao) {
        setConfig(conta.configuracoes_conciliacao as unknown as ConciliacaoConfig);
      } else {
        setConfig({
          tolerancia_centavos: 0.50,
          aceite_automatico: false,
          periodo_tolerancia_dias: 5,
          alertas_inadimplencia: { threshold: 10, interval: 'weekly', channel: 'email', active: false },
          alertas_conciliacao: { threshold: 5, interval: 'daily', channel: 'email', active: false }
        });
      }
    }
  }, [selectedContaId, contas]);

  const updateConfig = useMutation({
    mutationFn: async () => {
      if (!selectedContaId) return;
      const { error } = await supabase
        .from('contas_bancarias')
        .update({ configuracoes_conciliacao: config as any })
        .eq('id', selectedContaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-bancarias-config'] });
      toast.success('Configurações salvas com sucesso');
    },
    onError: () => toast.error('Erro ao salvar configurações'),
  });

  return (
    <Card className="card-base">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-5 w-5 text-primary" />
          Configurações de Tolerância
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Conta Bancária</Label>
          <Select value={selectedContaId} onValueChange={setSelectedContaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {contas?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome} ({c.banco})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedContaId && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tolerância (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={config.tolerancia_centavos} 
                  onChange={e => setConfig({...config, tolerancia_centavos: parseFloat(e.target.value)})} 
                />
                <p className="text-[10px] text-muted-foreground">Diferenças até este valor serão compensadas.</p>
              </div>
              <div className="space-y-2">
                <Label>Janela de Dias</Label>
                <Input 
                  type="number" 
                  value={config.periodo_tolerancia_dias} 
                  onChange={e => setConfig({...config, periodo_tolerancia_dias: parseInt(e.target.value)})} 
                />
                <p className="text-[10px] text-muted-foreground">Tolerância para data de vencimento.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label>Aceite Automático</Label>
                <p className="text-xs text-muted-foreground">Conciliar automaticamente se dentro da tolerância.</p>
              </div>
              <Switch 
                checked={config.aceite_automatico} 
                onCheckedChange={checked => setConfig({...config, aceite_automatico: checked})} 
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Configuração de Alertas
              </h4>
              
              <div className="space-y-4">
                {/* Alerta Inadimplência */}
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider">Inadimplência Crítica</Label>
                      <Switch 
                        checked={config.alertas_inadimplencia?.active} 
                        onCheckedChange={v => setConfig({...config, alertas_inadimplencia: {...config.alertas_inadimplencia!, active: v}})} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Threshold (%)</Label>
                        <Input 
                          type="number" 
                          className="h-8 text-xs"
                          value={config.alertas_inadimplencia?.threshold} 
                          onChange={e => setConfig({...config, alertas_inadimplencia: {...config.alertas_inadimplencia!, threshold: parseFloat(e.target.value)}})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Intervalo</Label>
                        <Select 
                          value={config.alertas_inadimplencia?.interval} 
                          onValueChange={v => setConfig({...config, alertas_inadimplencia: {...config.alertas_inadimplencia!, interval: v as any}})}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diário</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alerta Conciliação */}
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider">Conciliação Pendente</Label>
                      <Switch 
                        checked={config.alertas_conciliacao?.active} 
                        onCheckedChange={v => setConfig({...config, alertas_conciliacao: {...config.alertas_conciliacao!, active: v}})} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Acima de (qtd)</Label>
                        <Input 
                          type="number" 
                          className="h-8 text-xs"
                          value={config.alertas_conciliacao?.threshold} 
                          onChange={e => setConfig({...config, alertas_conciliacao: {...config.alertas_conciliacao!, threshold: parseInt(e.target.value)}})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Canal</Label>
                        <Select 
                          value={config.alertas_conciliacao?.channel} 
                          onValueChange={v => setConfig({...config, alertas_conciliacao: {...config.alertas_conciliacao!, channel: v as any}})}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email"><div className="flex items-center gap-1"><Mail className="h-3 w-3"/> Email</div></SelectItem>
                            <SelectItem value="push"><div className="flex items-center gap-1"><Bell className="h-3 w-3"/> Push</div></SelectItem>
                            <SelectItem value="whatsapp"><div className="flex items-center gap-1"><MessageSquare className="h-3 w-3"/> WhatsApp</div></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={() => updateConfig.mutate()} disabled={updateConfig.isPending}>
              <Save className="h-4 w-4" /> Salvar Configurações
            </Button>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-xs text-primary/80">
                <strong>Validação:</strong> A regra de Juros/Desconto será aplicada automaticamente com base no sinal da diferença.
              </div>
            </div>
          </>
        )}

        {!selectedContaId && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">Selecione uma conta para configurar as regras de conciliação.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
