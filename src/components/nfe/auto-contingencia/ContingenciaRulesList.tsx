import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit2, Zap, AlertTriangle, XCircle, Timer, Calendar, Clock } from 'lucide-react';
import { ContingencyRule, TIPO_EMISSAO } from '@/lib/sefaz-contingency';
import { formatDateTime } from '@/lib/formatters';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' }, { value: 1, label: 'Seg' }, { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' }, { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const ruleTypeConfig = {
  failure_count: { icon: XCircle, label: 'Falhas consecutivas', description: 'Ativa quando houver X falhas seguidas', color: 'text-destructive bg-destructive/10' },
  latency: { icon: Timer, label: 'Latência alta', description: 'Ativa quando a latência exceder X ms', color: 'text-warning bg-warning/10' },
  schedule: { icon: Calendar, label: 'Horário programado', description: 'Ativa em horários/dias específicos', color: 'text-primary bg-primary/10' },
  time_window: { icon: Clock, label: 'Indisponibilidade prolongada', description: 'Ativa após X minutos de indisponibilidade', color: 'text-secondary-foreground bg-secondary' },
};

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface Props {
  rules: ContingencyRule[];
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  onEditRule: (rule: ContingencyRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onNewRule: () => void;
}

export function ContingenciaRulesList({ rules, onToggleRule, onEditRule, onDeleteRule, onNewRule }: Props) {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              Regras de Ativação
            </CardTitle>
            <CardDescription>Regras ordenadas por prioridade (menor número = maior prioridade)</CardDescription>
          </div>
          <Button onClick={onNewRule} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Regra
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {rules
                .sort((a, b) => a.priority - b.priority)
                .map((rule) => {
                  const TypeIcon = ruleTypeConfig[rule.type].icon;
                  return (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`flex items-center justify-between p-4 rounded-lg border ${rule.enabled ? 'bg-card' : 'bg-muted/30 opacity-60'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${ruleTypeConfig[rule.type].color}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rule.name}</span>
                            <Badge variant="outline" className="text-xs">Prioridade {rule.priority}</Badge>
                            <Badge variant="secondary" className="text-xs">{TIPO_EMISSAO[rule.mode].label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{ruleTypeConfig[rule.type].description}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {rule.type === 'failure_count' && <span>Máx. falhas: {rule.config.maxFailures}</span>}
                            {rule.type === 'latency' && <span>Máx. latência: {rule.config.maxLatency}ms</span>}
                            {rule.type === 'schedule' && (
                              <span>
                                {rule.config.scheduleStart} - {rule.config.scheduleEnd}
                                {rule.config.scheduleDays && <> ({rule.config.scheduleDays.map(d => DAYS_OF_WEEK[d].label).join(', ')})</>}
                              </span>
                            )}
                            {rule.type === 'time_window' && <span>{rule.config.downtimeMinutes} minutos offline</span>}
                            {rule.lastTriggered && (
                              <span className="text-warning">Último disparo: {formatDateTime(rule.lastTriggered.toISOString())}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={rule.enabled} onCheckedChange={(enabled) => onToggleRule(rule.id, enabled)} />
                        <Button variant="ghost" size="icon" onClick={() => onEditRule(rule)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteRule(rule.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
            {rules.length === 0 && (
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
  );
}
