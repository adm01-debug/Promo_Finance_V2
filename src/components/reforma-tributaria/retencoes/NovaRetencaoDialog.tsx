import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import type { TipoRetencao } from '@/hooks/useRetencoesFonte';

const TIPO_LABELS: Record<TipoRetencao, string> = {
  irrf: 'IRRF', csrf: 'CSRF', pis_cofins_csll: 'PIS/COFINS/CSLL',
  inss: 'INSS', iss: 'ISS', cbs: 'CBS', ibs: 'IBS',
};

interface Props {
  empresaId: string;
  competencia: string;
  aliquotas: Record<TipoRetencao, number>;
  onCriar: (data: {
    tipo_retencao: TipoRetencao;
    tipo_operacao: 'pagamento' | 'recebimento';
    nome_participante: string;
    cnpj_participante: string;
    valor_base: number;
    data_fato_gerador: string;
  }) => void;
}

export function NovaRetencaoDialog({ empresaId, competencia, aliquotas, onCriar }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tipo_retencao: 'irrf' as TipoRetencao,
    tipo_operacao: 'pagamento' as 'pagamento' | 'recebimento',
    nome_participante: '',
    cnpj_participante: '',
    valor_base: 0,
    data_fato_gerador: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = () => {
    onCriar(form);
    setOpen(false);
    setForm({ tipo_retencao: 'irrf', tipo_operacao: 'pagamento', nome_participante: '', cnpj_participante: '', valor_base: 0, data_fato_gerador: format(new Date(), 'yyyy-MM-dd') });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!empresaId}><Plus className="h-4 w-4 mr-2" />Nova Retenção</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Retenção</DialogTitle>
          <DialogDescription>Adicione uma nova retenção na fonte</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Retenção</Label>
              <Select value={form.tipo_retencao} onValueChange={(v) => setForm(prev => ({ ...prev, tipo_retencao: v as TipoRetencao }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TIPO_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Operação</Label>
              <Select value={form.tipo_operacao} onValueChange={(v) => setForm(prev => ({ ...prev, tipo_operacao: v as 'pagamento' | 'recebimento' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagamento">Pagamento (retivemos)</SelectItem>
                  <SelectItem value="recebimento">Recebimento (retido de nós)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Participante (Nome/Razão Social)</Label><Input value={form.nome_participante} onChange={(e) => setForm(prev => ({ ...prev, nome_participante: e.target.value }))} placeholder="Nome do fornecedor ou cliente" /></div>
          <div className="space-y-2"><Label>CNPJ/CPF</Label><Input value={form.cnpj_participante} onChange={(e) => setForm(prev => ({ ...prev, cnpj_participante: e.target.value }))} placeholder="00.000.000/0001-00" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Valor Base</Label><Input type="number" value={form.valor_base} onChange={(e) => setForm(prev => ({ ...prev, valor_base: Number(e.target.value) }))} min={0} step={0.01} /></div>
            <div className="space-y-2"><Label>Data Fato Gerador</Label><Input type="date" value={form.data_fato_gerador} onChange={(e) => setForm(prev => ({ ...prev, data_fato_gerador: e.target.value }))} /></div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between text-sm"><span>Alíquota:</span><span className="font-medium">{(aliquotas[form.tipo_retencao] * 100).toFixed(2)}%</span></div>
            <div className="flex justify-between text-sm mt-1"><span>Valor Retido:</span><span className="font-bold text-primary">{formatCurrency(form.valor_base * aliquotas[form.tipo_retencao])}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!form.nome_participante || form.valor_base <= 0}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
