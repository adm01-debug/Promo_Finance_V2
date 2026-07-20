import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, DollarSign, Users, Save, Plus, Trash2, GripVertical, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useConfiguracaoAprovacao, useUpdateConfiguracaoAprovacao, useFluxosNiveis } from '@/hooks/useAprovacoes';
import { formatCurrency } from '@/lib/formatters';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export const ConfiguracaoAprovacaoCard = () => {
  const { data: config, isLoading: loadingConfig } = useConfiguracaoAprovacao();
  const { data: niveis, isLoading: loadingNiveis } = useFluxosNiveis();
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

  if (loadingConfig || loadingNiveis) {
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
    <Card className="border-border/50 shadow-lg bg-gradient-to-br from-card to-muted/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <Settings className="h-6 w-6 text-primary animate-spin-slow" />
              Workflow de Aprovação 10/10
            </CardTitle>
            <CardDescription>
              Inteligência de governança e alçadas de aprovação multi-nível
            </CardDescription>
          </div>
          <Badge variant={ativo ? "success" : "secondary"} className="h-6 px-3">
            {ativo ? "Sistema Ativo" : "Sistema Desativado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Toggle Ativo com Estilo Premium */}
        <div className={`flex items-center justify-between p-6 rounded-xl border transition-all duration-300 ${ativo ? 'bg-success/5 border-success/20 ring-1 ring-success/10' : 'bg-muted/50 border-border/50'}`}>
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-inner transition-colors duration-500 ${ativo ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
              <CheckCircle2 className={`h-6 w-6 ${ativo ? 'animate-bounce-slow' : ''}`} />
            </div>
            <div>
              <p className="font-bold text-lg">Status do Workflow</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {ativo 
                  ? 'Controle de alçadas ativado. Pagamentos acima do limite requerem aprovação formal.' 
                  : 'Workflow desativado. Todos os pagamentos serão liberados automaticamente.'}
              </p>
            </div>
          </div>
          <Switch
            checked={ativo}
            onCheckedChange={setAtivo}
            className="scale-125"
          />
        </div>

        <motion.div
          animate={{ opacity: ativo ? 1 : 0.4, scale: ativo ? 1 : 0.98 }}
          className={cn("space-y-8", !ativo && "pointer-events-none grayscale")}
        >
          <div className="grid gap-8 md:grid-cols-2">
            {/* Valor Mínimo */}
            <div className="space-y-3 p-4 rounded-lg bg-background/50 border border-border/30">
              <Label htmlFor="valorMinimo" className="flex items-center gap-2 text-sm font-semibold text-primary">
                <DollarSign className="h-4 w-4" />
                Alçada Mínima Global
              </Label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">R$</span>
                <Input
                  id="valorMinimo"
                  type="number"
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(e.target.value)}
                  className="pl-12 py-6 text-xl font-bold bg-transparent border-2 border-border/50 focus:border-primary/50 transition-all"
                  min="0"
                  step="100"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pagamentos acima de <span className="text-primary font-bold">{formatCurrency(parseFloat(valorMinimo) || 0)}</span> entrarão na fila de aprovação.
              </p>
            </div>

            {/* Número de Aprovadores */}
            <div className="space-y-3 p-4 rounded-lg bg-background/50 border border-border/30">
              <Label htmlFor="aprovadores" className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Users className="h-4 w-4" />
                Quorum de Aprovação (Etapa 1)
              </Label>
              <Input
                id="aprovadores"
                type="number"
                value={aprovadores}
                onChange={(e) => setAprovadores(e.target.value)}
                className="py-6 text-xl font-bold bg-transparent border-2 border-border/50 focus:border-primary/50 transition-all"
                min="1"
                max="5"
              />
              <p className="text-xs text-muted-foreground">
                Define quantos aprovadores independentes são necessários para liberar o pagamento no nível inicial.
              </p>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Workflow Multi-Nível */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  Workflow Multi-Etapa
                </h3>
                <p className="text-sm text-muted-foreground">Configure sequências de aprovação para governança enterprise</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 border-dashed">
                <Plus className="h-4 w-4" /> Adicionar Etapa
              </Button>
            </div>

            <div className="space-y-3">
              {(niveis && niveis.length > 0) ? niveis.map((nivel, idx) => (
                <div key={nivel.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all group">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-muted-foreground">E{idx + 1}</span>
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{nivel.nome}</span>
                      <Badge variant="outline" className="text-[10px] h-4">Min. {formatCurrency(nivel.valor_minimo)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{nivel.descricao || 'Sem descrição'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Aprovadores</p>
                      <p className="font-mono text-sm">{nivel.aprovadores_obrigatorios}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/20">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Apenas aprovação global configurada.</p>
                  <Button variant="link" size="sm" className="mt-2 text-primary font-bold">Configurar primeiro nível sequencial</Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Botão Salvar Premium */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-end pt-4"
            >
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending} 
                className="gap-2 px-8 py-6 h-auto text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
              >
                {updateMutation.isPending ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Sincronizar Governança
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
