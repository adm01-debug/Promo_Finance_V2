import { motion } from 'framer-motion';
import { Play, Trash2, FileText, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RelatorioAgendado {
  id: string;
  nome: string;
  tipo_relatorio: string;
  frequencia: string;
  hora_execucao: string;
  ativo: boolean;
  proximo_envio: string | null;
  ultimo_envio: string | null;
}

interface Props {
  relatorio: RelatorioAgendado;
  index: number;
  executingId: string | null;
  getTipoLabel: (t: string) => string;
  getFrequenciaLabel: (f: string) => string;
  onExecute: (id: string, nome: string) => void;
  onToggle: (id: string, ativo: boolean) => void;
  onDelete: (id: string) => void;
}

export function AgendamentoCard({ relatorio, index, executingId, getTipoLabel, getFrequenciaLabel, onExecute, onToggle, onDelete }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }}>
      <Card className={!relatorio.ativo ? 'opacity-60' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${relatorio.ativo ? 'bg-primary/10' : 'bg-muted'}`}>
                <FileText className={`h-5 w-5 ${relatorio.ativo ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h4 className="font-medium">{relatorio.nome}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{getTipoLabel(relatorio.tipo_relatorio)}</Badge>
                  <Badge variant="secondary" className="text-xs">{getFrequenciaLabel(relatorio.frequencia)}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{relatorio.hora_execucao.slice(0, 5)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right text-sm">
                {relatorio.proximo_envio && <div className="text-muted-foreground">Próximo: {formatDistanceToNow(new Date(relatorio.proximo_envio), { addSuffix: true, locale: ptBR })}</div>}
                {relatorio.ultimo_envio && <div className="text-xs text-muted-foreground/70">Último: {format(new Date(relatorio.ultimo_envio), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={executingId === relatorio.id} onClick={() => onExecute(relatorio.id, relatorio.nome)} className="gap-1.5">
                  {executingId === relatorio.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Executar
                </Button>
                <Switch checked={relatorio.ativo} onCheckedChange={(ativo) => onToggle(relatorio.id, ativo)} />
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(relatorio.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
