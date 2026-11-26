// Etapa 86: onde o enquadramento padrao do produto e escolhido.
//
// O catalogo de produtos e do Bling, mas o enquadramento (CST + cClassTrib) e
// decisao fiscal nossa e precisa sobreviver a emissao de cada nota. Como o
// catalogo da RFB pode estar vazio (carga pendente), CST e cClassTrib sao campos
// digitaveis: o seletor do catalogo e uma ajuda, nunca a unica porta de entrada.
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2, Wand2 } from 'lucide-react';
import { useClassificacaoTributaria } from '@/hooks/useCatalogoCclasstrib';
import { useBlingProdutoDetail } from '@/hooks/bling/useProdutos';
import {
  useProdutoCclasstribPadrao,
  useProdutoCclasstribPadraoMutations,
} from '@/hooks/useProdutoCclasstribPadrao';
import {
  normalizarCodigo,
  sugerirPadraoPorNcm,
  validarCoerenciaCst,
  validarPadrao,
} from '@/lib/tributario/produtos/cclasstrib-padrao';

export interface ProdutoParaPadrao {
  id: number | string;
  nome?: string;
  /** SKU do produto no Bling: e a chave que o item da NF-e conhece. */
  codigo?: string;
  ncm?: string | null;
  /** O Bling devolve o NCM dentro de `tributacao` no detalhe do produto. */
  tributacao?: { ncm?: string };
}

interface Props {
  produto: ProdutoParaPadrao | null;
  aberto: boolean;
  onFechar: () => void;
}

const LIMITE_OPCOES = 200;

export function ProdutoCclasstribDialog({ produto, aberto, onFechar }: Props) {
  const produtoId = produto ? String(produto.id) : '';
  const { padroes, porProduto, isLoading } = useProdutoCclasstribPadrao(aberto);
  const { salvar, remover } = useProdutoCclasstribPadraoMutations();
  const { opcoes, carregando: carregandoCatalogo, indisponivel } = useClassificacaoTributaria();

  const [ncm, setNcm] = useState('');
  const [cst, setCst] = useState('');
  const [cclasstrib, setCclasstrib] = useState('');

  // A listagem de produtos pode nao trazer o NCM; o detalhe do Bling traz.
  const { data: detalhe } = useBlingProdutoDetail(aberto && produtoId ? produtoId : undefined);
  const ncmDetalhe =
    (detalhe?.data as { tributacao?: { ncm?: string } } | undefined)?.tributacao?.ncm ?? '';

  const existente = produtoId ? porProduto.get(produtoId) : undefined;

  useEffect(() => {
    if (!aberto) return;
    const atual = produtoId ? porProduto.get(produtoId) : undefined;
    setNcm(atual?.ncm ?? produto?.ncm ?? produto?.tributacao?.ncm ?? ncmDetalhe);
    setCst(atual?.cst ?? '');
    setCclasstrib(atual?.cclasstrib ?? '');
  }, [aberto, produtoId, produto, porProduto, ncmDetalhe]);

  const sugestao = useMemo(
    () => (produto ? sugerirPadraoPorNcm(padroes, ncm, produtoId) : null),
    [padroes, ncm, produtoId, produto]
  );

  const opcoesFiltradas = useMemo(() => {
    const cstAlvo = normalizarCodigo(cst, 3);
    const lista = cstAlvo ? opcoes.filter((o) => o.cst.trim() === cstAlvo) : opcoes;
    return [...lista]
      .sort((a, b) => a.cclasstrib.localeCompare(b.cclasstrib))
      .slice(0, LIMITE_OPCOES);
  }, [opcoes, cst]);

  const erro =
    validarPadrao({ cst, cclasstrib, ncm }) ?? validarCoerenciaCst({ cst, cclasstrib }, opcoes);
  const ocupado = salvar.isPending || remover.isPending;
  const sugestaoDiferente =
    sugestao &&
    (sugestao.cst !== normalizarCodigo(cst, 3) ||
      sugestao.cclasstrib !== normalizarCodigo(cclasstrib, 6));

  const aplicarSugestao = () => {
    if (!sugestao) return;
    setCst(sugestao.cst);
    setCclasstrib(sugestao.cclasstrib);
  };

  const enviar = () => {
    if (!produto || erro) return;
    salvar.mutate(
      { produto_id: produtoId, codigo: produto.codigo ?? null, ncm, cst, cclasstrib },
      { onSuccess: () => onFechar() }
    );
  };

  return (
    <Dialog open={aberto} onOpenChange={(abertoAgora) => !abertoAgora && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enquadramento tributario padrao</DialogTitle>
          <DialogDescription>
            {produto?.nome ? `${produto.nome} — ` : ''}
            vale para todo item desta nota que usar este produto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="padrao-ncm">NCM do produto</Label>
            <Input
              id="padrao-ncm"
              value={ncm}
              inputMode="numeric"
              maxLength={10}
              placeholder="12345678"
              onChange={(e) => setNcm(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Usado apenas para sugerir o enquadramento de produtos do mesmo NCM.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="padrao-cst">CST IBS/CBS</Label>
              <Input
                id="padrao-cst"
                value={cst}
                inputMode="numeric"
                maxLength={3}
                placeholder="000"
                onChange={(e) => setCst(normalizarCodigo(e.target.value, 3))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="padrao-cclasstrib">cClassTrib</Label>
              <Input
                id="padrao-cclasstrib"
                value={cclasstrib}
                inputMode="numeric"
                maxLength={6}
                placeholder="000001"
                onChange={(e) => setCclasstrib(normalizarCodigo(e.target.value, 6))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Escolher do catalogo</Label>
            {carregandoCatalogo ? (
              <p className="text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 inline animate-spin" /> Carregando catalogo...
              </p>
            ) : indisponivel || opcoes.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Catalogo da RFB ainda nao sincronizado (carga pendente): informe CST e cClassTrib
                manualmente.
              </p>
            ) : (
              <Select
                value=""
                onValueChange={(valor) => {
                  const escolhida = opcoes.find((o) => o.cclasstrib === valor);
                  if (!escolhida) return;
                  setCst(escolhida.cst.trim());
                  setCclasstrib(escolhida.cclasstrib);
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      opcoesFiltradas.length === 0
                        ? 'Nenhuma classificacao para este CST'
                        : `${opcoesFiltradas.length} classificacao(oes) disponivel(is)`
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {opcoesFiltradas.map((opcao) => (
                    <SelectItem key={`${opcao.cst}-${opcao.cclasstrib}`} value={opcao.cclasstrib}>
                      {opcao.cclasstrib} — {opcao.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {sugestao && sugestaoDiferente && (
            <div className="flex items-start justify-between gap-2 rounded-md border p-2 text-xs">
              <span>
                Outro produto deste NCM usa{' '}
                <span className="font-mono">
                  {sugestao.cst}/{sugestao.cclasstrib}
                </span>
                .
              </span>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={aplicarSugestao}>
                <Wand2 className="h-3.5 w-3.5" /> Usar
              </Button>
            </div>
          )}

          {existente && (
            <p className="text-xs text-muted-foreground">
              Padrao atual:{' '}
              <span className="font-mono">
                {existente.cst}/{existente.cclasstrib}
              </span>{' '}
              <Badge variant="secondary" className="ml-1">
                {isLoading
                  ? 'atualizando'
                  : `atualizado em ${new Date(existente.atualizado_em).toLocaleDateString('pt-BR')}`}
              </Badge>
            </p>
          )}

          {erro && <p className="text-xs text-destructive">{erro}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            className="text-destructive gap-1.5"
            disabled={!existente || ocupado}
            onClick={() => produto && remover.mutate(produtoId, { onSuccess: () => onFechar() })}
          >
            <Trash2 className="h-4 w-4" /> Remover padrao
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onFechar} disabled={ocupado}>
              Cancelar
            </Button>
            <Button onClick={enviar} disabled={!!erro || ocupado}>
              {salvar.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Salvar padrao
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
