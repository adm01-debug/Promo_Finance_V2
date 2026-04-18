import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarClock, Mail, Plus, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRelatoriosTributariosAgendados } from '@/hooks/useRelatoriosTributariosAgendados';

interface Props {
  empresaId?: string;
}

export function RelatoriosAgendadosCard({ empresaId }: Props) {
  const { agendamentos, isLoading, create, isCreating, toggle, remove } =
    useRelatoriosTributariosAgendados(empresaId);
  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [frequencia, setFrequencia] = useState<'mensal' | 'trimestral' | 'anual'>('mensal');
  const [diaEnvio, setDiaEnvio] = useState(1);
  const [destinatarios, setDestinatarios] = useState('');

  const handleSubmit = () => {
    if (!empresaId) return;
    const lista = destinatarios
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
    if (!lista.length) return;
    create(
      { empresa_id: empresaId, ano, frequencia, dia_envio: diaEnvio, destinatarios: lista },
      { onSuccess: () => { setOpen(false); setDestinatarios(''); } }
    );
  };

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-primary" />
          Relatórios agendados
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!empresaId} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar envio automático</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ano de referência</Label>
                  <Input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Frequência</Label>
                  <Select value={frequencia} onValueChange={(v) => setFrequencia(v as typeof frequencia)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Dia do envio (1–28)</Label>
                <Input type="number" min={1} max={28} value={diaEnvio} onChange={(e) => setDiaEnvio(Number(e.target.value))} />
              </div>
              <div>
                <Label>Destinatários (vírgula ou linha)</Label>
                <Input
                  placeholder="contador@empresa.com, financeiro@empresa.com"
                  value={destinatarios}
                  onChange={(e) => setDestinatarios(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isCreating || !destinatarios.trim()}>
                Criar agendamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {!empresaId ? (
          <p className="text-xs text-muted-foreground">Selecione uma empresa para ver agendamentos.</p>
        ) : isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : agendamentos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum agendamento. Crie o primeiro acima.</p>
        ) : (
          agendamentos.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Badge variant="secondary" className="text-[10px]">{a.frequencia}</Badge>
                  <span>Ano {a.ano} · dia {a.dia_envio}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  {a.destinatarios.slice(0, 2).join(', ')}
                  {a.destinatarios.length > 2 && ` +${a.destinatarios.length - 2}`}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Próximo: {format(parseISO(a.proximo_envio_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={a.ativo} onCheckedChange={(v) => toggle({ id: a.id, ativo: v })} />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
