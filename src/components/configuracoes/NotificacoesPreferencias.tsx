import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Mail, AlertTriangle, CreditCard } from 'lucide-react';
import { NotificacoesConfig } from '@/components/configuracoes/NotificacoesConfig';
import { PushNotificationsBanner } from '@/components/settings/PushNotificationsBanner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export interface PreferenciasState {
  notificacoesEmail: boolean;
  notificacoesPush: boolean;
  alertasVencimento: number;
  alertasFluxoCaixa: boolean;
  temaEscuro: boolean;
  formatoData: string;
  formatoMoeda: string;
  fusoHorario: string;
  backupAutomatico: boolean;
  frequenciaBackup: string;
}

interface Props {
  preferencias: PreferenciasState;
  onPreferenciasChange: (updater: (p: PreferenciasState) => PreferenciasState) => void;
}

export function NotificacoesPreferencias({ preferencias, onPreferenciasChange }: Props) {
  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <NotificacoesConfig />

      <Card>
        <CardHeader>
          <CardTitle>Preferências de Notificação</CardTitle>
          <CardDescription>Configure como e quando deseja receber alertas do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Mail className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="font-medium">Notificações por E-mail</p>
                <p className="text-sm text-muted-foreground">Receba alertas importantes por e-mail</p>
              </div>
            </div>
            <Switch
              checked={preferencias.notificacoesEmail}
              onCheckedChange={(checked) => onPreferenciasChange(p => ({ ...p, notificacoesEmail: checked }))}
            />
          </motion.div>

          <Separator />

          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">Alertas de Vencimento</p>
                <p className="text-sm text-muted-foreground">Dias de antecedência para alertar</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pl-12">
              <Slider
                value={[preferencias.alertasVencimento]}
                onValueChange={([value]) => onPreferenciasChange(p => ({ ...p, alertasVencimento: value }))}
                max={7}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="font-medium w-16">{preferencias.alertasVencimento} dias</span>
            </div>
          </motion.div>

          <Separator />

          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <CreditCard className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium">Alertas de Fluxo de Caixa</p>
                <p className="text-sm text-muted-foreground">Alertar quando saldo projetado ficar negativo</p>
              </div>
            </div>
            <Switch
              checked={preferencias.alertasFluxoCaixa}
              onCheckedChange={(checked) => onPreferenciasChange(p => ({ ...p, alertasFluxoCaixa: checked }))}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
