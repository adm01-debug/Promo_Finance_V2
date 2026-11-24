import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Plus, XCircle, AlertTriangle, Package, User } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useEmpresas } from '@/hooks/useFinancialData';
import { useCatalogoCclasstrib } from '@/hooks/useCatalogoCclasstrib';
import { calcularGrupoIbscbs, resolverCclassTribPadrao } from '@/lib/nfe/grupo-ibscbs-item';
import { calcularBaseCalculo } from '@/lib/reforma-tributaria/base-calculo';
import { toast } from 'sonner';
import { NotaFiscal, ItemNFe } from './nfe-types';

/** Ano do cronograma usado na estimativa local do grupo IBS/CBS. */
const ANO_REFERENCIA = new Date().getFullYear();

interface NovaNFeFormProps {
  onClose: () => void;
  onSuccess: (nota: NotaFiscal) => void;
}

export function NovaNFeForm({ onClose }: NovaNFeFormProps) {
  const { data: empresas = [] } = useEmpresas();
  const { opcoes, codigos, carregando, indisponivel } = useCatalogoCclasstrib();

  const [formData, setFormData] = useState({
    destinatarioNome: '',
    destinatarioCnpj: '',
    destinatarioEndereco: '',
    naturezaOperacao: 'Venda de Mercadoria',
    empresa: '',
    observacoes: '',
  });

  const [itens, setItens] = useState<ItemNFe[]>([
    {
      codigo: '',
      descricao: '',
      ncm: '',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
    },
  ]);

  const addItem = () => {
    setItens([
      ...itens,
      {
        codigo: '',
        descricao: '',
        ncm: '',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 1,
        valorUnitario: 0,
        valorTotal: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (itens.length > 1) setItens(itens.filter((_, i) => i !== index));
  };

  /**
   * Base oficial do grupo IBS/CBS (art. 11 da LC 214/2025): valor do item menos
   * ICMS, FCP e (em 2026) PIS/COFINS. O formulario ainda nao coleta esses campos,
   * entao a base sai pelo valor do item e o aviso da Fase 2 aparece no rodape.
   */
  const calcularBaseItem = (item: ItemNFe) =>
    calcularBaseCalculo({ vProd: item.valorTotal }, ANO_REFERENCIA);

  /**
   * Recalcula o grupo IBS/CBS do item a partir do cClassTrib vigente no catalogo.
   * Sem codigo escolhido o grupo fica limpo: nao ha valor a destacar.
   */
  const comGrupo = (item: ItemNFe, codigo?: string): ItemNFe => {
    const linha = codigo ? opcoes.find((opcao) => opcao.cclasstrib === codigo) : undefined;
    if (!linha) {
      return {
        ...item,
        cClassTrib: undefined,
        cstIbsCbs: undefined,
        vBCIbsCbs: undefined,
        pCBS: undefined,
        vCBS: undefined,
        pIBSUF: undefined,
        vIBSUF: undefined,
        pIBSMun: undefined,
        vIBSMun: undefined,
        vIBS: undefined,
      };
    }
    const grupo = calcularGrupoIbscbs(calcularBaseItem(item).baseRG, linha, ANO_REFERENCIA);
    return {
      ...item,
      cClassTrib: linha.cclasstrib,
      cstIbsCbs: linha.cst,
      vBCIbsCbs: grupo.vBC,
      pCBS: grupo.pCBS,
      vCBS: grupo.vCBS,
      pIBSUF: grupo.pIBSUF,
      vIBSUF: grupo.vIBSUF,
      pIBSMun: grupo.pIBSMun,
      vIBSMun: grupo.vIBSMun,
      vIBS: grupo.vIBS,
    };
  };

  const selecionarCclassTrib = (index: number, codigo: string) => {
    setItens(itens.map((item, i) => (i === index ? comGrupo(item, codigo) : item)));
  };

  const updateItem = (index: number, field: keyof ItemNFe, value: string | number) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    if (field === 'quantidade' || field === 'valorUnitario') {
      newItens[index].valorTotal = newItens[index].quantidade * newItens[index].valorUnitario;
    }
    // NCM completo e sem codigo escolhido assume tributacao integral (000001).
    const padrao =
      field === 'ncm'
        ? resolverCclassTribPadrao(String(value), newItens[index].cClassTrib, codigos)
        : null;
    newItens[index] = comGrupo(newItens[index], padrao ?? newItens[index].cClassTrib);
    setItens(newItens);
  };

  const totalProdutos = itens.reduce((acc, item) => acc + item.valorTotal, 0);
  const totalIbscbs = itens.reduce((acc, item) => acc + (item.vCBS ?? 0) + (item.vIBS ?? 0), 0);
  const avisosBase = Array.from(new Set(itens.flatMap((item) => calcularBaseItem(item).avisos)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.error(
      'Emissão indisponível: a integração SEFAZ ainda precisa ser homologada e confirmar protocolo real.'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
      <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
        Esta tela não transmite NF-e até que a integração SEFAZ esteja homologada. Nenhum protocolo
        será simulado.
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" /> Destinatário
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="destinatarioNome">Razão Social / Nome</Label>
            <Input
              id="destinatarioNome"
              value={formData.destinatarioNome}
              onChange={(e) => setFormData({ ...formData, destinatarioNome: e.target.value })}
              placeholder="Nome do destinatário"
              required
            />
          </div>
          <div>
            <Label htmlFor="destinatarioCnpj">CNPJ/CPF</Label>
            <Input
              id="destinatarioCnpj"
              value={formData.destinatarioCnpj}
              onChange={(e) => setFormData({ ...formData, destinatarioCnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>
          <div>
            <Label htmlFor="empresa">Empresa Emitente</Label>
            <Select
              value={formData.empresa}
              onValueChange={(value) => setFormData({ ...formData, empresa: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="destinatarioEndereco">Endereço Completo</Label>
            <Input
              id="destinatarioEndereco"
              value={formData.destinatarioEndereco}
              onChange={(e) => setFormData({ ...formData, destinatarioEndereco: e.target.value })}
              placeholder="Rua, número, bairro, cidade/UF"
              required
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <Package className="h-4 w-4" /> Itens da NF-e
          </h4>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
            <Plus className="h-3 w-3" /> Adicionar Item
          </Button>
        </div>

        {itens.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
              {itens.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>Código</Label>
                <Input
                  value={item.codigo}
                  onChange={(e) => updateItem(index, 'codigo', e.target.value)}
                  placeholder="SKU"
                />
              </div>
              <div className="col-span-3">
                <Label>Descrição</Label>
                <Input
                  value={item.descricao}
                  onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                  placeholder="Descrição do produto"
                  required
                />
              </div>
              <div>
                <Label>NCM</Label>
                <Input
                  value={item.ncm}
                  onChange={(e) => updateItem(index, 'ncm', e.target.value)}
                  placeholder="00000000"
                />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) =>
                    updateItem(index, 'quantidade', parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>
              <div>
                <Label>Valor Unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.valorUnitario}
                  onChange={(e) =>
                    updateItem(index, 'valorUnitario', Number.parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label>Total</Label>
                <Input value={formatCurrency(item.valorTotal)} disabled className="bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label>cClassTrib (LC 214/2025)</Label>
                <Select
                  value={item.cClassTrib ?? ''}
                  onValueChange={(codigo) => selecionarCclassTrib(index, codigo)}
                  disabled={carregando || opcoes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={carregando ? 'Carregando...' : 'Selecione o codigo'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoes.map((opcao) => (
                      <SelectItem key={opcao.cclasstrib} value={opcao.cclasstrib}>
                        {opcao.cclasstrib} — {opcao.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CST IBS/CBS</Label>
                <Input value={item.cstIbsCbs ?? ''} disabled className="bg-muted" placeholder="—" />
              </div>
              <div>
                <Label>CBS + IBS</Label>
                <Input
                  value={formatCurrency((item.vCBS ?? 0) + (item.vIBS ?? 0))}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
        ))}

        {indisponivel && (
          <p className="text-xs text-muted-foreground">
            Catalogo oficial de cClassTrib indisponivel: o codigo fica bloqueado ate a carga da RFB
            rodar.
          </p>
        )}

        <div className="flex justify-end gap-8">
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Total dos Produtos:</span>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalProdutos)}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground">
              CBS + IBS dos itens ({ANO_REFERENCIA}):
            </span>
            <p className="text-xl font-bold">{formatCurrency(totalIbscbs)}</p>
          </div>
        </div>

        {avisosBase.length > 0 && (
          <div className="space-y-1 text-xs text-muted-foreground">
            {avisosBase.map((aviso) => (
              <p key={aviso} className="flex gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
                {aviso}
              </p>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <Label htmlFor="observacoes">Informações Adicionais</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          placeholder="Observações, informações complementares..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4 sticky bottom-0 bg-background">
        <Button type="submit" className="flex-1 gap-2" disabled>
          <AlertTriangle className="h-4 w-4" /> Emissão indisponível
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
