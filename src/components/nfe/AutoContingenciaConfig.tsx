import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  ContingencyRule,
  ContingencyMode,
  AutoContingencyConfig as AutoContingencyConfigType,
  getAutoContingencyConfig,
  saveAutoContingencyConfig,
  addContingencyRule,
  updateContingencyRule,
  deleteContingencyRule,
} from '@/lib/sefaz-contingency';
import { ContingenciaGlobalSettings } from './auto-contingencia/ContingenciaGlobalSettings';
import { ContingenciaRulesList } from './auto-contingencia/ContingenciaRulesList';
import { ContingenciaRuleDialog } from './auto-contingencia/ContingenciaRuleDialog';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

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
  name: '', type: 'failure_count', mode: 'offline', enabled: true, priority: 5, reason: '',
  config: { maxFailures: 3 },
};

export function AutoContingenciaConfig() {
  const [config, setConfig] = useState<AutoContingencyConfigType>(getAutoContingencyConfig());
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ContingencyRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(defaultFormData);
  const [hasChanges, setHasChanges] = useState(false);

  const refreshConfig = () => { setConfig(getAutoContingencyConfig()); setHasChanges(false); };

  const handleConfigChange = (updates: Partial<AutoContingencyConfigType>) => {
    setConfig({ ...config, ...updates }); setHasChanges(true);
  };

  const handleSaveConfig = () => {
    saveAutoContingencyConfig(config); setHasChanges(false);
    toast.success('Configurações salvas com sucesso');
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    updateContingencyRule(ruleId, { enabled }); refreshConfig();
    toast.success(enabled ? 'Regra ativada' : 'Regra desativada');
  };

  const handleOpenNewRule = () => {
    setEditingRule(null); setFormData(defaultFormData); setShowRuleDialog(true);
  };

  const handleOpenEditRule = (rule: ContingencyRule) => {
    setEditingRule(rule);
    setFormData({ name: rule.name, type: rule.type, mode: rule.mode, enabled: rule.enabled, priority: rule.priority, reason: rule.reason, config: { ...rule.config } });
    setShowRuleDialog(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteContingencyRule(ruleId); refreshConfig(); toast.success('Regra excluída');
  };

  const handleSaveRule = () => {
    if (!formData.name.trim()) { toast.error('Informe o nome da regra'); return; }
    if (!formData.reason.trim()) { toast.error('Informe o motivo da ativação'); return; }
    if (editingRule) { updateContingencyRule(editingRule.id, formData); toast.success('Regra atualizada com sucesso'); }
    else { addContingencyRule(formData); toast.success('Regra criada com sucesso'); }
    setShowRuleDialog(false); refreshConfig();
  };

  const handleTypeChange = (type: ContingencyRule['type']) => {
    let newConfig: ContingencyRule['config'] = {};
    switch (type) {
      case 'failure_count': newConfig = { maxFailures: 3 }; break;
      case 'latency': newConfig = { maxLatency: 5000 }; break;
      case 'schedule': newConfig = { scheduleStart: '00:00', scheduleEnd: '06:00', scheduleDays: [0] }; break;
      case 'time_window': newConfig = { downtimeMinutes: 10 }; break;
    }
    setFormData({ ...formData, type, config: newConfig });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Settings2 className="h-6 w-6 text-primary" /></div>
                <div>
                  <CardTitle>Contingência Automática</CardTitle>
                  <CardDescription>Configure regras para ativação automática do modo de contingência</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-enabled" className="text-sm">{config.enabled ? 'Ativo' : 'Inativo'}</Label>
                <Switch id="auto-enabled" checked={config.enabled} onCheckedChange={(enabled) => handleConfigChange({ enabled })} />
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <ContingenciaGlobalSettings config={config} hasChanges={hasChanges} onConfigChange={handleConfigChange} onSave={handleSaveConfig} onDiscard={refreshConfig} />

      <ContingenciaRulesList rules={config.rules} onToggleRule={handleToggleRule} onEditRule={handleOpenEditRule} onDeleteRule={handleDeleteRule} onNewRule={handleOpenNewRule} />

      <ContingenciaRuleDialog
        open={showRuleDialog}
        onOpenChange={setShowRuleDialog}
        isEditing={!!editingRule}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveRule}
        onTypeChange={handleTypeChange}
      />
    </motion.div>
  );
}
