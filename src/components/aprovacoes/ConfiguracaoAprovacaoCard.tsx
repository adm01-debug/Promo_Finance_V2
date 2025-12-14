import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, DollarSign, Users, Save, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useConfiguracaoAprovacao, useUpdateConfiguracaoAprovacao } from '@/hooks/useAprovacoes';
import { formatCurrency } from '@/lib/formatters';

export const ConfiguracaoAprovacaoCard = () => {
  const { data: config, isLoading } = useConfiguracaoAprovacao();
  const updateMutation = useUpdateConfiguracaoAprovacao();

  const [valorMinimo, setValorMinimo] = useState('5000');
  const [aprovadores, setAprovadores] = useState('1');
  const [ativo, setAtivo] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setValorMinimo(config.valor_minimo_aprovacao.toString());
      setAprovadores(config.aprovadores_obrigatorios.toString());
      setAtivo(config.ativo);
    }
  }, [config]);

  useEffect(() => {
    if (!config) return;
    const changed = 
      parseFloat(valorMinimo) !== config.valor_minimo_aprovacao ||
      parseInt(aprovadores) !== config.aprovadores_obrigatorios ||
      ativo !== config.ativo;
    setHasChanges(changed);
  }, [valorMinimo, aprovadores, ativo, config]);

  const handleSave = () => {
    if (!config) return;
    updateMutation.mutate({
      id: config.id,
      valor_minimo_aprovacao: parseFloat(valorMinimo) || 0,
      aprovadores_obrigatorios: parseInt(aprovadores) || 1,
      ativo,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configurações de Aprovação
        </CardTitle>
        <CardDescription>
          Defina os parâmetros do workflow de aprovação de pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle Ativo */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${ativo ? 'bg-success/10' : 'bg-muted'}`}>
              <AlertTriangle className={`h-5 w-5 ${ativo ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">Workflow de Aprovação</p>
              <p className="text-sm text-muted-foreground">
                {ativo ? 'Pagamentos acima do limite requerem aprovação' : 'Desativado - todos os pagamentos são liberados'}
              </p>
            </div>
          </div>
          <Switch
            checked={ativo}
            onCheckedChange={setAtivo}
          />
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: ativo ? 1 : 0.5 }}
          className={!ativo ? 'pointer-events-none' : ''}
        >
          <div className="grid gap-6 md:grid-cols-2">
            {/* Valor Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="valorMinimo" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Valor Mínimo para Aprovação
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="valorMinimo"
                  type="number"
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(e.target.value)}
                  className="pl-10"
                  min="0"
                  step="100"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pagamentos a partir de {formatCurrency(parseFloat(valorMinimo) || 0)} precisarão de aprovação
              </p>
            </div>

            {/* Número de Aprovadores */}
            <div className="space-y-2">
              <Label htmlFor="aprovadores" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Aprovadores Obrigatórios
              </Label>
              <Input
                id="aprovadores"
                type="number"
                value={aprovadores}
                onChange={(e) => setAprovadores(e.target.value)}
                min="1"
                max="5"
              />
              <p className="text-xs text-muted-foreground">
                Quantos usuários precisam aprovar o pagamento
              </p>
            </div>
          </div>
        </motion.div>

        {/* Botão Salvar */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
