import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Shield, Save, RotateCcw } from 'lucide-react';
import type { AutoContingencyConfig } from '@/lib/sefaz-contingency';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface Props {
  config: AutoContingencyConfig;
  hasChanges: boolean;
  onConfigChange: (updates: Partial<AutoContingencyConfig>) => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function ContingenciaGlobalSettings({ config, hasChanges, onConfigChange, onSave, onDiscard }: Props) {
  return (
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
                onChange={(e) => onConfigChange({ checkIntervalSeconds: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Delay para desativar (minutos)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={config.autoDeactivateDelayMinutes}
                onChange={(e) => onConfigChange({ autoDeactivateDelayMinutes: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label className="text-sm">Notificar ao ativar</Label>
              <Switch
                checked={config.notifyOnActivation}
                onCheckedChange={(notifyOnActivation) => onConfigChange({ notifyOnActivation })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label className="text-sm">Desativar automaticamente</Label>
              <Switch
                checked={config.autoDeactivateWhenOnline}
                onCheckedChange={(autoDeactivateWhenOnline) => onConfigChange({ autoDeactivateWhenOnline })}
              />
            </div>
          </div>

          {hasChanges && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onDiscard} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Descartar
              </Button>
              <Button onClick={onSave} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
