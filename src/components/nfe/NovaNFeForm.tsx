import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Plus, XCircle, Loader2, CheckCircle2, Zap, Package, User } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useEmpresas } from '@/hooks/useFinancialData';
import { toast } from 'sonner';
import { processarSefaz, NFEData, SefazResponse } from '@/lib/sefaz-simulator';
import { registrarEvento } from '@/lib/sefaz-event-logger';
import { SefazStatusPanel } from './SefazStatusPanel';
import { NotaFiscal, ItemNFe } from './nfe-types';

interface NovaNFeFormProps {
  onClose: () => void;
  onSuccess: (nota: NotaFiscal) => void;
}

export function NovaNFeForm({ onClose, onSuccess }: NovaNFeFormProps) {
  const { data: empresas = [] } = useEmpresas();
  
  const [formData, setFormData] = useState({
    destinatarioNome: '', destinatarioCnpj: '', destinatarioEndereco: '',
    naturezaOperacao: 'Venda de Mercadoria', empresa: '', observacoes: ''
  });

  const [itens, setItens] = useState<ItemNFe[]>([
    { codigo: '', descricao: '', ncm: '', cfop: '5102', unidade: 'UN', quantidade: 1, valorUnitario: 0, valorTotal: 0 }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [sefazResponse, setSefazResponse] = useState<SefazResponse | null>(null);

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
    setIsProcessing(true);
    setSefazResponse(null);

    const empresa = empresas.find(c => c.id === formData.empresa);
    const steps = ['validating', 'connecting', 'sending', 'processing', 'done'];
    
    for (const step of steps.slice(0, -1)) {
      setCurrentStep(step);
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    }

    const nfeData: NFEData = {
      numero: Math.floor(1000 + Math.random() * 9000), serie: 1,
      naturezaOperacao: formData.naturezaOperacao, dataEmissao: new Date(),
      emitente: {
        cnpj: empresa?.cnpj || '12.345.678/0001-90',
        razaoSocial: empresa?.razao_social || 'Promo Brindes Ltda',
        inscricaoEstadual: empresa?.inscricao_estadual || '123.456.789.123',
        uf: empresa?.estado || 'SP'
      },
      destinatario: { cpfCnpj: formData.destinatarioCnpj, nome: formData.destinatarioNome, endereco: formData.destinatarioEndereco },
      itens: itens.map(item => ({
        codigo: item.codigo || 'PROD001', descricao: item.descricao, ncm: item.ncm || '96082000',
        cfop: item.cfop, quantidade: item.quantidade, valorUnitario: item.valorUnitario, valorTotal: item.valorTotal
      })),
      valorTotal: totalProdutos
    };

    const tempoInicio = Date.now();
    registrarEvento({ tipo: 'VALIDACAO', numeroNfe: String(nfeData.numero).padStart(9, '0'), cStat: '000', xMotivo: 'Validação de schema XML concluída', ambiente: 'homologacao', tempoResposta: Date.now() - tempoInicio, detalhes: 'Estrutura XML validada conforme schema NF-e 4.00' });
    registrarEvento({ tipo: 'ENVIO_LOTE', numeroNfe: String(nfeData.numero).padStart(9, '0'), cStat: '103', xMotivo: 'Lote recebido com sucesso', ambiente: 'homologacao', tempoResposta: 1200, detalhes: 'Lote enviado para processamento na SEFAZ' });

    const response = await processarSefaz({ tipo: 'autorizacao', nfeData });
    const tempoTotal = Date.now() - tempoInicio;

    registrarEvento({
      tipo: response.success ? 'AUTORIZACAO' : 'REJEICAO',
      numeroNfe: String(nfeData.numero).padStart(9, '0'), chaveAcesso: response.chaveAcesso,
      cStat: response.cStat, xMotivo: response.xMotivo, protocolo: response.protocolo,
      ambiente: 'homologacao', tempoResposta: tempoTotal,
      detalhes: response.success ? 'NF-e autorizada com sucesso pela SEFAZ' : `Rejeição: ${response.errors?.join(', ') || response.xMotivo}`
    });

    setCurrentStep('done');
    setSefazResponse(response);
    setIsProcessing(false);

    if (response.success) {
      toast.success(`NF-e autorizada! Protocolo: ${response.protocolo}`);
      const novaNota: NotaFiscal = {
        id: Date.now().toString(), numero: String(nfeData.numero).padStart(9, '0'), serie: '1',
        chaveAcesso: response.chaveAcesso!, naturezaOperacao: formData.naturezaOperacao,
        dataEmissao: new Date().toISOString(), cnpjEmitente: nfeData.emitente.cnpj,
        emitenteNome: nfeData.emitente.razaoSocial, cnpjDestinatario: formData.destinatarioCnpj,
        destinatarioNome: formData.destinatarioNome, destinatarioEndereco: formData.destinatarioEndereco,
        valorProdutos: totalProdutos, valorFrete: 0, valorSeguro: 0, valorDesconto: 0,
        valorIPI: 0, valorICMS: totalProdutos * 0.18, valorTotal: totalProdutos,
        status: 'autorizada', protocolo: response.protocolo, itens
      };
      setTimeout(() => onSuccess(novaNota), 1500);
    } else {
      toast.error(`Rejeição SEFAZ: ${response.xMotivo}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
      <AnimatePresence>
        <SefazStatusPanel isProcessing={isProcessing} currentStep={currentStep} response={sefazResponse} />
      </AnimatePresence>

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
              <div><Label>Quantidade</Label><Input type="number" min="1" value={item.quantidade} onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 0)} /></div>
              <div><Label>Valor Unitário</Label><Input type="number" step="0.01" min="0" value={item.valorUnitario} onChange={(e) => updateItem(index, 'valorUnitario', parseFloat(e.target.value) || 0)} /></div>
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
        <Button type="submit" className="flex-1 gap-2" disabled={isProcessing || sefazResponse?.success}>
          {isProcessing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Processando...</>) :
           sefazResponse?.success ? (<><CheckCircle2 className="h-4 w-4" /> Autorizada!</>) :
           (<><Zap className="h-4 w-4" /> Transmitir para SEFAZ</>)}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
          {sefazResponse?.success ? 'Fechar' : 'Cancelar'}
        </Button>
      </div>
    </form>
  );
}
