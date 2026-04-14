import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContingencyRule, ContingencyMode, TIPO_EMISSAO } from '@/lib/sefaz-contingency';
import { XCircle, Timer, Calendar, Clock } from 'lucide-react';

const ruleTypeConfig = {
  failure_count: { icon: XCircle, label: 'Falhas consecutivas', description: 'Ativa quando houver X falhas seguidas', color: 'text-destructive bg-destructive/10' },
  latency: { icon: Timer, label: 'Latência alta', description: 'Ativa quando a latência exceder X ms', color: 'text-warning bg-warning/10' },
  schedule: { icon: Calendar, label: 'Horário programado', description: 'Ativa em horários/dias específicos', color: 'text-primary bg-primary/10' },
  time_window: { icon: Clock, label: 'Indisponibilidade prolongada', description: 'Ativa após X minutos de indisponibilidade', color: 'text-secondary-foreground bg-secondary' },
};

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' }, { value: 1, label: 'Seg' }, { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' }, { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' }, { value: 6, label: 'Sáb' },
];

export interface RuleFormData {
  name: string;
  type: ContingencyRule['type'];
  mode: ContingencyMode;
  enabled: boolean;
  priority: number;
  reason: string;
  config: ContingencyRule['config'];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: RuleFormData;
  setFormData: (data: RuleFormData) => void;
  isEditing: boolean;
  onSave: () => void;
  onTypeChange: (type: ContingencyRule['type']) => void;
}

export function ContingenciaRuleDialog({ open, onOpenChange, formData, setFormData, isEditing, onSave, onTypeChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Regra' : 'Nova Regra de Contingência'}</DialogTitle>
          <DialogDescription>Configure os parâmetros para ativação automática</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da regra</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Falhas consecutivas (5x)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de regra</Label>
              <Select value={formData.type} onValueChange={(v) => onTypeChange(v as ContingencyRule['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ruleTypeConfig).map(([type, cfg]) => (
                    <SelectItem key={type} value={type}><div className="flex items-center gap-2"><cfg.icon className="h-4 w-4" />{cfg.label}</div></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modo de contingência</Label>
              <Select value={formData.mode} onValueChange={(v) => setFormData({ ...formData, mode: v as ContingencyMode })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_EMISSAO).filter(([k]) => k !== 'normal').map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Input type="number" min="1" max="10" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })} />
            </div>
            <div className="space-y-2">
              <Label>Motivo da ativação</Label>
              <Input value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Motivo..." />
            </div>
          </div>

          {/* Config by type */}
          {formData.type === 'failure_count' && (
            <div className="space-y-2"><Label>Máximo de falhas consecutivas</Label><Input type="number" min="1" max="20" value={formData.config.maxFailures || 3} onChange={(e) => setFormData({ ...formData, config: { ...formData.config, maxFailures: parseInt(e.target.value) || 3 } })} /></div>
          )}
          {formData.type === 'latency' && (
            <div className="space-y-2"><Label>Latência máxima (ms)</Label><Input type="number" min="1000" max="30000" step="500" value={formData.config.maxLatency || 5000} onChange={(e) => setFormData({ ...formData, config: { ...formData.config, maxLatency: parseInt(e.target.value) || 5000 } })} /></div>
          )}
          {formData.type === 'schedule' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Início</Label><Input type="time" value={formData.config.scheduleStart || '00:00'} onChange={(e) => setFormData({ ...formData, config: { ...formData.config, scheduleStart: e.target.value } })} /></div>
                <div className="space-y-2"><Label>Fim</Label><Input type="time" value={formData.config.scheduleEnd || '06:00'} onChange={(e) => setFormData({ ...formData, config: { ...formData.config, scheduleEnd: e.target.value } })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center gap-1.5">
                      <Checkbox checked={(formData.config.scheduleDays || []).includes(day.value)} onChange={() => {
                        const checked = !(formData.config.scheduleDays || []).includes(day.value);
                        const days = formData.config.scheduleDays || [];
                        setFormData({ ...formData, config: { ...formData.config, scheduleDays: checked ? [...days, day.value] : days.filter(d => d !== day.value) } });
                      }} />
                      <span className="text-sm">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {formData.type === 'time_window' && (
            <div className="space-y-2"><Label>Tempo de indisponibilidade (minutos)</Label><Input type="number" min="1" max="60" value={formData.config.downtimeMinutes || 10} onChange={(e) => setFormData({ ...formData, config: { ...formData.config, downtimeMinutes: parseInt(e.target.value) || 10 } })} /></div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>{isEditing ? 'Salvar Alterações' : 'Criar Regra'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
