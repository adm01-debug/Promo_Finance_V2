import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface ConciliacaoConfig {
  tolerancia_centavos: number;
  aceite_automatico: boolean;
  periodo_tolerancia_dias: number;
}

export function ConfiguracaoConciliacaoPanel({ contaId }: { contaId?: string }) {
  const [config, setConfig] = useState<ConciliacaoConfig>({
    tolerancia_centavos: 0.50,
    aceite_automatico: false,
    periodo_tolerancia_dias: 5,
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
