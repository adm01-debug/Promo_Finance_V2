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
import { useProdutoCclasstribPadrao } from '@/hooks/useProdutoCclasstribPadrao';
import { calcularGrupoIbscbs, resolverCclassTribPadrao } from '@/lib/nfe/grupo-ibscbs-item';
import { calcularBaseCalculo } from '@/lib/reforma-tributaria/base-calculo';
import { adaptarItem, preValidarIbscbs } from '@/lib/nfe/pre-validar-ibscbs';
import { PreValidacaoIbscbs } from './PreValidacaoIbscbs';
import {
  cclasstribManualAposTroca,
  ncmAposTrocaDeCodigo,
} from '@/lib/tributario/produtos/cclasstrib-padrao';
import { toast } from 'sonner';
import { NotaFiscal, ItemNFe } from './nfe-types';

/** Ano do cronograma usado na estimativa local do grupo IBS/CBS. */
const ANO_REFERENCIA = new Date().getFullYear();

/**
 * CRT (código de regime tributário) do emitente: 1 = Simples Nacional,
 * 3 = regime normal (Lucro Presumido e Lucro Real). Regime desconhecido devolve
 * `undefined` — sem CRT a pré-validação não afirma nada sobre a obrigatoriedade
 * do grupo, em vez de bloquear por suposição.
 */
const crtDoRegime = (regime?: string | null): number | undefined => {
  if (regime === 'simples_nacional') return 1;
  if (regime === 'lucro_presumido' || regime === 'lucro_real') return 3;
  return undefined;
};

interface NovaNFeFormProps {
  onClose: () => void;
  onSuccess: (nota: NotaFiscal) => void;
}

/** Par CST + cClassTrib escolhido para o item (padrao do produto, NCM ou manual). */
interface EnquadramentoItem {
  cst: string;
  cclasstrib: string;
}

export function NovaNFeForm({ onClose }: NovaNFeFormProps) {
  const { data: empresas = [] } = useEmpresas();
  const { opcoes, codigos, carregando, indisponivel } = useCatalogoCclasstrib();
  const { porCodigo: padraoPorCodigo } = useProdutoCclasstribPadrao();

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
   * Recalcula o grupo IBS/CBS do item a partir do enquadramento escolhido.
   *
   * O par CST + cClassTrib e uma decisao fiscal (padrao do produto, regra por NCM
   * ou escolha manual) e sobrevive sem o catalogo da RFB: sem a linha oficial
   * nada e calculado, e nenhuma aliquota e estimada.
   */
  const comGrupo = (item: ItemNFe, enquadramento?: EnquadramentoItem | null): ItemNFe => {
    const linha = enquadramento
      ? opcoes.find((opcao) => opcao.cclasstrib === enquadramento.cclasstrib)
      : undefined;
    const grupo = linha
      ? calcularGrupoIbscbs(calcularBaseItem(item).baseRG, linha, ANO_REFERENCIA)
      : null;
    return {
      ...item,
      cClassTrib: enquadramento ? (linha?.cclasstrib ?? enquadramento.cclasstrib) : undefined,
      cstIbsCbs: enquadramento ? (linha?.cst ?? enquadramento.cst) || undefined : undefined,
      vBCIbsCbs: grupo?.vBC,
      pCBS: grupo?.pCBS,
      vCBS: grupo?.vCBS,
      pIBSUF: grupo?.pIBSUF,
      vIBSUF: grupo?.vIBSUF,
      pIBSMun: grupo?.pIBSMun,
      vIBSMun: grupo?.vIBSMun,
      vIBS: grupo?.vIBS,
    };
  };

  const enquadramentoDoCodigo = (codigo?: string | null): EnquadramentoItem | null => {
    if (!codigo) return null;
    const linha = opcoes.find((opcao) => opcao.cclasstrib === codigo);
    return { cst: linha?.cst ?? '', cclasstrib: linha?.cclasstrib ?? codigo };
  };

  const enquadramentoDoItem = (item: ItemNFe): EnquadramentoItem | null =>
    item.cClassTrib ? { cst: item.cstIbsCbs ?? '', cclasstrib: item.cClassTrib } : null;

  /**
   * Enquadramento do item depois de uma edicao. Trocar de produto descarta o
   * padrao herdado do produto anterior e preserva a escolha manual; informar o
   * NCM so decide quando o item ainda nao tem codigo escolhido.
   */
  const enquadramentoApos = (
    anterior: ItemNFe,
    campo: keyof ItemNFe,
    valor: string | number
  ): EnquadramentoItem | null => {
    if (campo === 'codigo') {
      const padrao = padraoPorCodigo(String(valor));
      if (padrao) return { cst: padrao.cst, cclasstrib: padrao.cclasstrib };
      // Sem padrao no SKU novo: a escolha manual do operador continua valendo.
      // So o padrao herdado do SKU anterior sai de cena, e a regra por NCM
      // assume o lugar dele.
      if (
        cclasstribManualAposTroca(padraoPorCodigo, {
          codigoAnterior: anterior.codigo,
          cclasstribAtual: anterior.cClassTrib,
        })
      ) {
        return enquadramentoDoItem(anterior);
      }
      return enquadramentoDoCodigo(resolverCclassTribPadrao(anterior.ncm, undefined, codigos));
    }
    if (campo === 'ncm') {
      const integral = resolverCclassTribPadrao(String(valor), anterior.cClassTrib, codigos);
      return integral ? enquadramentoDoCodigo(integral) : enquadramentoDoItem(anterior);
    }
    return enquadramentoDoItem(anterior);
  };

  const selecionarCclassTrib = (index: number, codigo: string) => {
    setItens(
      itens.map((item, i) => (i === index ? comGrupo(item, enquadramentoDoCodigo(codigo)) : item))
    );
  };

  const updateItem = (index: number, field: keyof ItemNFe, value: string | number) => {
    const newItens = [...itens];
    const anterior = newItens[index];
    newItens[index] = { ...anterior, [field]: value };
    if (field === 'quantidade' || field === 'valorUnitario') {
      newItens[index].valorTotal = newItens[index].quantidade * newItens[index].valorUnitario;
    }
    // Etapa 86: o padrao do produto traz o NCM junto, para nao exigir redigitar.
    // O NCM herdado do produto anterior nao sobrevive a troca de SKU.
    if (field === 'codigo') {
      newItens[index].ncm = ncmAposTrocaDeCodigo(padraoPorCodigo, {
        codigoAnterior: anterior.codigo,
        ncmAtual: anterior.ncm,
        codigoNovo: String(value),
      });
    }
    newItens[index] = comGrupo(newItens[index], enquadramentoApos(anterior, field, value));
    setItens(newItens);
  };

  const totalProdutos = itens.reduce((acc, item) => acc + item.valorTotal, 0);
  const totalIbscbs = itens.reduce((acc, item) => acc + (item.vCBS ?? 0) + (item.vIBS ?? 0), 0);
  // Item com enquadramento sem linha no catalogo da RFB entra no total como zero:
  // enquanto existir, o total de IBS/CBS e parcial.
  const itensSemReferencia = itens.filter(
    (item) => item.cClassTrib && !opcoes.some((opcao) => opcao.cclasstrib === item.cClassTrib)
  ).length;
  const avisosBase = Array.from(new Set(itens.flatMap((item) => calcularBaseItem(item).avisos)));

  /** Achados da pré-validação IBS/CBS do contexto atual (etapa 54 do plano RT/RFB). */
  const empresaEmitente = empresas.find((emp) => emp.id === formData.empresa);
  const preValidacao = preValidarIbscbs({
    crt: crtDoRegime(empresaEmitente?.regime_tributario),
    dataEmissao: new Date().toISOString().slice(0, 10),
    itens: itens.map((item, indice) => adaptarItem({ ...item, nItem: indice + 1 })),
    cclasstribVigentes: codigos,
  });

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

      <PreValidacaoIbscbs achados={preValidacao.achados} />

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
                    {item.cClassTrib && !opcoes.some((o) => o.cclasstrib === item.cClassTrib) && (
                      <SelectItem value={item.cClassTrib}>
                        {item.cClassTrib} (cadastro do produto)
                      </SelectItem>
                    )}
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

            {item.cClassTrib && !opcoes.some((o) => o.cclasstrib === item.cClassTrib) && (
              <p className="text-xs text-muted-foreground">
                Enquadramento {item.cstIbsCbs}/{item.cClassTrib} vem do cadastro do produto e nao
                tem referencia no catalogo da RFB: os valores de IBS/CBS ficam pendentes, sem
                estimativa.
              </p>
            )}
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
            {itensSemReferencia > 0 && (
              <p className="text-xs text-warning">
                Parcial: {itensSemReferencia} {itensSemReferencia === 1 ? 'item sem' : 'itens sem'}{' '}
                referencia no catalogo da RFB.
              </p>
            )}
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
