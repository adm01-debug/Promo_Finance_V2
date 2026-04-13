import { motion } from 'framer-motion';
import { Palette, Globe, Database, Zap, CreditCard, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };

interface Preferencias {
  temaEscuro: boolean; formatoData: string; fusoHorario: string;
  backupAutomatico: boolean; frequenciaBackup: string;
}

interface SistemaTabProps {
  preferencias: Preferencias;
  onPreferenciasChange: (p: Preferencias) => void;
  onSave: () => void;
}

export function SistemaTab({ preferencias, onPreferenciasChange, onSave }: SistemaTabProps) {
  const set = (key: keyof Preferencias, value: string | boolean) => onPreferenciasChange({ ...preferencias, [key]: value });

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Aparência</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="font-medium">Tema Escuro</p><p className="text-sm text-muted-foreground">Alternar entre claro e escuro</p></div>
              <Switch checked={preferencias.temaEscuro} onCheckedChange={(v) => set('temaEscuro', v)} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Regionalização</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label>Formato de Data</Label><Select value={preferencias.formatoData} onValueChange={(v) => set('formatoData', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem><SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem><SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Fuso Horário</Label><Select value={preferencias.fusoHorario} onValueChange={(v) => set('fusoHorario', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem><SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem><SelectItem value="America/Recife">Recife (GMT-3)</SelectItem></SelectContent></Select></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Backup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="font-medium">Backup Automático</p><p className="text-sm text-muted-foreground">Criar backups automaticamente</p></div><Switch checked={preferencias.backupAutomatico} onCheckedChange={(v) => set('backupAutomatico', v)} /></div>
            <div className="grid gap-2"><Label>Frequência</Label><Select value={preferencias.frequenciaBackup} onValueChange={(v) => set('frequenciaBackup', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="diario">Diário</SelectItem><SelectItem value="semanal">Semanal</SelectItem><SelectItem value="mensal">Mensal</SelectItem></SelectContent></Select></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Integrações</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-secondary/10"><Zap className="h-4 w-4 text-secondary" /></div><div><p className="font-medium text-sm">Bitrix24</p><p className="text-xs text-muted-foreground">Sincronização de deals</p></div></div><Badge variant="default" className="bg-success">Conectado</Badge></div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-accent/10"><CreditCard className="h-4 w-4 text-accent" /></div><div><p className="font-medium text-sm">Open Banking</p><p className="text-xs text-muted-foreground">Dados bancários</p></div></div><Badge variant="secondary">Pendente</Badge></div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end"><Button onClick={onSave} className="gap-2"><Save className="h-4 w-4" />Salvar Configurações</Button></div>
    </motion.div>
  );
}
