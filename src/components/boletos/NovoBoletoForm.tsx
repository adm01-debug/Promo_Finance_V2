import { useState } from 'react';
import { Barcode, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { NovoBoletoData } from '@/hooks/useBoletos';

interface NovoBoletoFormProps {
  onClose: () => void;
  empresas: Array<{ id: string; razao_social: string; cnpj: string | null }> | undefined;
  contasBancarias: Array<{ id: string; banco: string; agencia: string; conta: string; empresa_id: string }> | undefined;
  onSubmit: (data: NovoBoletoData) => void;
  isCreating: boolean;
}

export function NovoBoletoForm({ onClose, empresas, contasBancarias, onSubmit, isCreating }: NovoBoletoFormProps) {
  const [formData, setFormData] = useState({ sacado_nome: '', sacado_cpf_cnpj: '', valor: '', vencimento: '', conta_bancaria_id: '', empresa_id: '', descricao: '' });
  const filteredContas = contasBancarias?.filter(c => !formData.empresa_id || c.empresa_id === formData.empresa_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empresa_id || !formData.conta_bancaria_id) { toast.error('Selecione a empresa e conta bancária'); return; }
    onSubmit({ sacado_nome: formData.sacado_nome, sacado_cpf_cnpj: formData.sacado_cpf_cnpj, valor: parseFloat(formData.valor), vencimento: formData.vencimento, empresa_id: formData.empresa_id, conta_bancaria_id: formData.conta_bancaria_id, descricao: formData.descricao || undefined });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Label htmlFor="sacado_nome">Pagador (Sacado)</Label><Input id="sacado_nome" value={formData.sacado_nome} onChange={(e) => setFormData({ ...formData, sacado_nome: e.target.value })} placeholder="Nome do pagador" required /></div>
        <div><Label htmlFor="sacado_cpf_cnpj">CPF/CNPJ do Pagador</Label><Input id="sacado_cpf_cnpj" value={formData.sacado_cpf_cnpj} onChange={(e) => setFormData({ ...formData, sacado_cpf_cnpj: e.target.value })} placeholder="00.000.000/0000-00" required /></div>
        <div><Label htmlFor="valor">Valor</Label><Input id="valor" type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} placeholder="0,00" required /></div>
        <div><Label htmlFor="vencimento">Vencimento</Label><Input id="vencimento" type="date" value={formData.vencimento} onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })} required /></div>
        <div><Label>Empresa (Cedente)</Label><Select value={formData.empresa_id} onValueChange={(v) => setFormData({ ...formData, empresa_id: v, conta_bancaria_id: '' })}><SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger><SelectContent>{empresas?.map((e) => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Conta Bancária</Label><Select value={formData.conta_bancaria_id} onValueChange={(v) => setFormData({ ...formData, conta_bancaria_id: v })} disabled={!formData.empresa_id}><SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger><SelectContent>{filteredContas?.map((c) => <SelectItem key={c.id} value={c.id}>{c.banco} - {c.agencia}/{c.conta}</SelectItem>)}</SelectContent></Select></div>
        <div className="col-span-2"><Label>Descrição (opcional)</Label><Input value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descrição ou referência do boleto" /></div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 gap-2" disabled={isCreating}>{isCreating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Barcode className="h-4 w-4" />}{isCreating ? 'Gerando...' : 'Gerar Boleto'}</Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}
