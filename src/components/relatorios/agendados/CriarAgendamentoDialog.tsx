import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateRelatorioInput } from '@/hooks/useRelatoriosAgendados';

const tiposRelatorio = [
  { value: 'fluxo_caixa', label: 'Fluxo de Caixa' },
  { value: 'contas_pagar', label: 'Contas a Pagar' },
  { value: 'contas_receber', label: 'Contas a Receber' },
  { value: 'dre', label: 'DRE - Demonstrativo de Resultados' },
  { value: 'balanco', label: 'Balanço Patrimonial' },
  { value: 'inadimplencia', label: 'Análise de Inadimplência' },
];

const frequencias = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
];

const diasSemana = [
  { value: 0, label: 'Domingo' }, { value: 1, label: 'Segunda-feira' }, { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' }, { value: 4, label: 'Quinta-feira' }, { value: 5, label: 'Sexta-feira' }, { value: 6, label: 'Sábado' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateRelatorioInput;
  setFormData: (data: CreateRelatorioInput) => void;
  onCreate: () => void;
  isCreating: boolean;
  empresas: Array<{ id: string; nome_fantasia?: string | null; razao_social: string }>;
}

export function CriarAgendamentoDialog({ open, onOpenChange, formData, setFormData, onCreate, isCreating, empresas }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Novo Relatório Agendado</DialogTitle><DialogDescription>Configure a geração automática de relatórios</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Nome do Agendamento</Label><Input placeholder="Ex: Relatório Semanal de Fluxo" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Tipo de Relatório</Label>
            <Select value={formData.tipo_relatorio} onValueChange={(v) => setFormData({ ...formData, tipo_relatorio: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>{tiposRelatorio.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={formData.frequencia} onValueChange={(v) => setFormData({ ...formData, frequencia: v, dia_semana: null, dia_mes: null })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{frequencias.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Horário</Label><Input type="time" value={formData.hora_execucao} onChange={(e) => setFormData({ ...formData, hora_execucao: e.target.value })} /></div>
          </div>
          {formData.frequencia === 'semanal' && (
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select value={formData.dia_semana?.toString() || ''} onValueChange={(v) => setFormData({ ...formData, dia_semana: parseInt(v) })}>
                <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                <SelectContent>{diasSemana.map(d => <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {formData.frequencia === 'mensal' && (
            <div className="space-y-2">
              <Label>Dia do Mês</Label>
              <Select value={formData.dia_mes?.toString() || ''} onValueChange={(v) => setFormData({ ...formData, dia_mes: parseInt(v) })}>
                <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                <SelectContent>{Array.from({ length: 28 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>Dia {d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Empresa (opcional)</Label>
            <Select value={formData.empresa_id || 'all'} onValueChange={(v) => setFormData({ ...formData, empresa_id: v === 'all' ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Todas as empresas" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as empresas</SelectItem>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onCreate} disabled={!formData.nome || !formData.tipo_relatorio || isCreating}>{isCreating ? 'Salvando...' : 'Salvar Agendamento'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
