import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Zap,
  Timer,
  Calendar,
  Settings2,
  Shield,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ContingencyRule,
  ContingencyMode,
  AutoContingencyConfig,
  TIPO_EMISSAO,
  getAutoContingencyConfig,
  saveAutoContingencyConfig,
  addContingencyRule,
  updateContingencyRule,
  deleteContingencyRule,
} from '@/lib/sefaz-contingency';
import { formatDateTime } from '@/lib/formatters';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ruleTypeConfig = {
  failure_count: { 
    icon: XCircle, 
    label: 'Falhas consecutivas', 
    description: 'Ativa quando houver X falhas seguidas',
    color: 'text-destructive bg-destructive/10'
  },
  latency: { 
    icon: Timer, 
    label: 'Latência alta', 
    description: 'Ativa quando a latência exceder X ms',
    color: 'text-warning bg-warning/10'
  },
  schedule: { 
    icon: Calendar, 
    label: 'Horário programado', 
    description: 'Ativa em horários/dias específicos',
    color: 'text-primary bg-primary/10'
  },
  time_window: { 
    icon: Clock, 
    label: 'Indisponibilidade prolongada', 
    description: 'Ativa após X minutos de indisponibilidade',
    color: 'text-secondary-foreground bg-secondary'
  },
};

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

interface RuleFormData {
  name: string;
  type: ContingencyRule['type'];
  mode: ContingencyMode;
  enabled: boolean;
  priority: number;
  reason: string;
  config: ContingencyRule['config'];
}

const defaultFormData: RuleFormData = {
  name: '',
  type: 'failure_count',
  mode: 'offline',
  enabled: true,
  priority: 5,
  reason: '',
  config: { maxFailures: 3 },
};

export function AutoContingenciaConfig() {
  const [config, setConfig] = useState<AutoContingencyConfig>(getAutoContingencyConfig());
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ContingencyRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(defaultFormData);
  const [hasChanges, setHasChanges] = useState(false);

  const refreshConfig = () => {
    setConfig(getAutoContingencyConfig());
    setHasChanges(false);
  };

  const handleConfigChange = (updates: Partial<AutoContingencyConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSaveConfig = () => {
    saveAutoContingencyConfig(config);
    setHasChanges(false);
    toast.success('Configurações salvas com sucesso');
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    updateContingencyRule(ruleId, { enabled });
    refreshConfig();
    toast.success(enabled ? 'Regra ativada' : 'Regra desativada');
  };

  const handleOpenNewRule = () => {
    setEditingRule(null);
    setFormData(defaultFormData);
    setShowRuleDialog(true);
  };

  const handleOpenEditRule = (rule: ContingencyRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      mode: rule.mode,
      enabled: rule.enabled,
      priority: rule.priority,
      reason: rule.reason,
      config: { ...rule.config },
    });
    setShowRuleDialog(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteContingencyRule(ruleId);
    refreshConfig();
    toast.success('Regra excluída');
  };

  const handleSaveRule = () => {
    if (!formData.name.trim()) {
      toast.error('Informe o nome da regra');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Informe o motivo da ativação');
      return;
    }

    if (editingRule) {
      updateContingencyRule(editingRule.id, formData);
      toast.success('Regra atualizada com sucesso');
    } else {
      addContingencyRule(formData);
      toast.success('Regra criada com sucesso');
    }

    setShowRuleDialog(false);
    refreshConfig();
  };

  const handleTypeChange = (type: ContingencyRule['type']) => {
    let newConfig: ContingencyRule['config'] = {};
    
    switch (type) {
      case 'failure_count':
        newConfig = { maxFailures: 3 };
        break;
      case 'latency':
        newConfig = { maxLatency: 5000 };
        break;
      case 'schedule':
        newConfig = { scheduleStart: '00:00', scheduleEnd: '06:00', scheduleDays: [0] };
        break;
      case 'time_window':
        newConfig = { downtimeMinutes: 10 };
        break;
    }

    setFormData({ ...formData, type, config: newConfig });
  };

  const RuleIcon = (type: ContingencyRule['type']) => ruleTypeConfig[type].icon;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Contingência Automática</CardTitle>
                  <CardDescription>
                    Configure regras para ativação automática do modo de contingência
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="auto-enabled" className="text-sm">
                    {config.enabled ? 'Ativo' : 'Inativo'}
                  </Label>
                  <Switch
                    id="auto-enabled"
                    checked={config.enabled}
                    onCheckedChange={(enabled) => handleConfigChange({ enabled })}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Global Settings */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Intervalo de verificação (segundos)</Label>
                <Input
                  type="number"
                  min="10"
                  max="300"
                  value={config.checkIntervalSeconds}
                  onChange={(e) => handleConfigChange({ checkIntervalSeconds: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Delay para desativar (minutos)</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={config.autoDeactivateDelayMinutes}
                  onChange={(e) => handleConfigChange({ autoDeactivateDelayMinutes: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label className="text-sm">Notificar ao ativar</Label>
                <Switch
                  checked={config.notifyOnActivation}
                  onCheckedChange={(notifyOnActivation) => handleConfigChange({ notifyOnActivation })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label className="text-sm">Desativar automaticamente</Label>
                <Switch
                  checked={config.autoDeactivateWhenOnline}
                  onCheckedChange={(autoDeactivateWhenOnline) => handleConfigChange({ autoDeactivateWhenOnline })}
                />
              </div>
            </div>

            {hasChanges && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={refreshConfig} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Descartar
                </Button>
                <Button onClick={handleSaveConfig} className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Rules List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Regras de Ativação
              </CardTitle>
              <CardDescription>
                Regras ordenadas por prioridade (menor número = maior prioridade)
              </CardDescription>
            </div>
            <Button onClick={handleOpenNewRule} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Regra
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {config.rules
                  .sort((a, b) => a.priority - b.priority)
                  .map((rule) => {
                    const TypeIcon = ruleTypeConfig[rule.type].icon;
                    return (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          rule.enabled ? 'bg-card' : 'bg-muted/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${ruleTypeConfig[rule.type].color}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rule.name}</span>
                              <Badge variant="outline" className="text-xs">
                                Prioridade {rule.priority}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {TIPO_EMISSAO[rule.mode].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {ruleTypeConfig[rule.type].description}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              {rule.type === 'failure_count' && (
                                <span>Máx. falhas: {rule.config.maxFailures}</span>
                              )}
                              {rule.type === 'latency' && (
                                <span>Máx. latência: {rule.config.maxLatency}ms</span>
                              )}
                              {rule.type === 'schedule' && (
                                <span>
                                  {rule.config.scheduleStart} - {rule.config.scheduleEnd}
                                  {rule.config.scheduleDays && (
                                    <> ({rule.config.scheduleDays.map(d => DAYS_OF_WEEK[d].label).join(', ')})</>
                                  )}
                                </span>
                              )}
                              {rule.type === 'time_window' && (
                                <span>{rule.config.downtimeMinutes} minutos offline</span>
                              )}
                              {rule.lastTriggered && (
                                <span className="text-warning">
                                  Último disparo: {formatDateTime(rule.lastTriggered.toISOString())}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(enabled) => handleToggleRule(rule.id, enabled)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEditRule(rule)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>

              {config.rules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma regra configurada</p>
                  <p className="text-sm">Adicione regras para ativar a contingência automaticamente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Editar Regra' : 'Nova Regra de Contingência'}
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros para ativação automática
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da regra</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Falhas consecutivas (5x)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de regra</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleTypeChange(value as ContingencyRule['type'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ruleTypeConfig).map(([type, cfg]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <cfg.icon className="h-4 w-4" />
                          {cfg.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Modo de contingência</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value) => setFormData({ ...formData, mode: value as ContingencyMode })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_EMISSAO)
                      .filter(([key]) => key !== 'normal')
                      .map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label} - {value.description}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Type-specific config */}
            {formData.type === 'failure_count' && (
              <div className="space-y-2">
                <Label>Número máximo de falhas consecutivas</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.config.maxFailures || 3}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, maxFailures: parseInt(e.target.value) || 3 }
                  })}
                />
              </div>
            )}

            {formData.type === 'latency' && (
              <div className="space-y-2">
                <Label>Latência máxima (milissegundos)</Label>
                <Input
                  type="number"
                  min="1000"
                  max="30000"
                  step="500"
                  value={formData.config.maxLatency || 5000}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, maxLatency: parseInt(e.target.value) || 5000 }
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Valor atual: {(formData.config.maxLatency || 5000) / 1000}s
                </p>
              </div>
            )}

            {formData.type === 'schedule' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário inicial</Label>
                    <Input
                      type="time"
                      value={formData.config.scheduleStart || '00:00'}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, scheduleStart: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário final</Label>
                    <Input
                      type="time"
                      value={formData.config.scheduleEnd || '06:00'}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, scheduleEnd: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dias da semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={formData.config.scheduleDays?.includes(day.value)}
                          onChange={(e) => {
                            const checked = (e.target as HTMLInputElement).checked;
                            const days = formData.config.scheduleDays || [];
                            const newDays = checked
                              ? [...days, day.value]
                              : days.filter(d => d !== day.value);
                            setFormData({
                              ...formData,
                              config: { ...formData.config, scheduleDays: newDays }
                            });
                          }}
                        />
                        <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'time_window' && (
              <div className="space-y-2">
                <Label>Tempo de indisponibilidade (minutos)</Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.config.downtimeMinutes || 10}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, downtimeMinutes: parseInt(e.target.value) || 10 }
                  })}
                />
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
                />
                <p className="text-xs text-muted-foreground">
                  Menor número = maior prioridade
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Switch
                  id="rule-enabled"
                  checked={formData.enabled}
                  onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
                />
                <Label htmlFor="rule-enabled">Regra ativa</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motivo (será exibido ao ativar)</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Ex: Ativação automática: falhas consecutivas de comunicação"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRule} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {editingRule ? 'Atualizar' : 'Criar'} Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
