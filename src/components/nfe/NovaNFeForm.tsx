import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Plus, XCircle, AlertTriangle, Package, User } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useEmpresas } from '@/hooks/useFinancialData';
import { toast } from 'sonner';
import { NotaFiscal, ItemNFe } from './nfe-types';

interface NovaNFeFormProps {
  onClose: () => void;
  onSuccess: (nota: NotaFiscal) => void;
}

export function NovaNFeForm({ onClose }: NovaNFeFormProps) {
  const { data: empresas = [] } = useEmpresas();
  
  const [formData, setFormData] = useState({
    destinatarioNome: '', destinatarioCnpj: '', destinatarioEndereco: '',
    naturezaOperacao: 'Venda de Mercadoria', empresa: '', observacoes: ''
  });

  const [itens, setItens] = useState<ItemNFe[]>([
    { codigo: '', descricao: '', ncm: '', cfop: '5102', unidade: 'UN', quantidade: 1, valorUnitario: 0, valorTotal: 0 }
  ]);

  const addItem = () => {
    setItens([...itens, { codigo: '', descricao: '', ncm: '', cfop: '5102', unidade: 'UN', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
  };

  const removeItem = (index: number) => {
    if (itens.length > 1) setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemNFe, value: string | number) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    if (field === 'quantidade' || field === 'valorUnitario') {
      newItens[index].valorTotal = newItens[index].quantidade * newItens[index].valorUnitario;
    }
    setItens(newItens);
  };

  const totalProdutos = itens.reduce((acc, item) => acc + item.valorTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.error('Emissão indisponível: a integração SEFAZ ainda precisa ser homologada e confirmar protocolo real.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
      <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
        Esta tela não transmite NF-e até que a integração SEFAZ esteja homologada. Nenhum protocolo será simulado.
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2"><User className="h-4 w-4" /> Destinatário</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="destinatarioNome">Razão Social / Nome</Label>
            <Input id="destinatarioNome" value={formData.destinatarioNome} onChange={(e) => setFormData({ ...formData, destinatarioNome: e.target.value })} placeholder="Nome do destinatário" required />
          </div>
          <div>
            <Label htmlFor="destinatarioCnpj">CNPJ/CPF</Label>
            <Input id="destinatarioCnpj" value={formData.destinatarioCnpj} onChange={(e) => setFormData({ ...formData, destinatarioCnpj: e.target.value })} placeholder="00.000.000/0000-00" required />
          </div>
          <div>
            <Label htmlFor="empresa">Empresa Emitente</Label>
            <Select value={formData.empresa} onValueChange={(value) => setFormData({ ...formData, empresa: value })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{empresas.map((emp) => (<SelectItem key={emp.id} value={emp.id}>{emp.razao_social}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="destinatarioEndereco">Endereço Completo</Label>
            <Input id="destinatarioEndereco" value={formData.destinatarioEndereco} onChange={(e) => setFormData({ ...formData, destinatarioEndereco: e.target.value })} placeholder="Rua, número, bairro, cidade/UF" required />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2"><Package className="h-4 w-4" /> Itens da NF-e</h4>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3 w-3" /> Adicionar Item</Button>
        </div>

        {itens.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
              {itens.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}><XCircle className="h-4 w-4 text-destructive" /></Button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div><Label>Código</Label><Input value={item.codigo} onChange={(e) => updateItem(index, 'codigo', e.target.value)} placeholder="SKU" /></div>
              <div className="col-span-3"><Label>Descrição</Label><Input value={item.descricao} onChange={(e) => updateItem(index, 'descricao', e.target.value)} placeholder="Descrição do produto" required /></div>
              <div><Label>NCM</Label><Input value={item.ncm} onChange={(e) => updateItem(index, 'ncm', e.target.value)} placeholder="00000000" /></div>
              <div><Label>Quantidade</Label><Input type="number" min="1" value={item.quantidade} onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value, 10) || 0)} /></div>
              <div><Label>Valor Unitário</Label><Input type="number" step="0.01" min="0" value={item.valorUnitario} onChange={(e) => updateItem(index, 'valorUnitario', Number.parseFloat(e.target.value) || 0)} /></div>
              <div><Label>Total</Label><Input value={formatCurrency(item.valorTotal)} disabled className="bg-muted" /></div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Total dos Produtos:</span>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalProdutos)}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <Label htmlFor="observacoes">Informações Adicionais</Label>
        <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Observações, informações complementares..." rows={3} />
      </div>

      <div className="flex gap-2 pt-4 sticky bottom-0 bg-background">
        <Button type="submit" className="flex-1 gap-2" disabled>
          <AlertTriangle className="h-4 w-4" /> Emissão indisponível
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}
