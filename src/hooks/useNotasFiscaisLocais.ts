import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentEmpresaId } from '@/hooks/useUserEmpresas';
import type { ItemNFe, NotaFiscal } from '@/components/nfe/nfe-types';

/**
 * Linha de `notas_fiscais` como ela existe hoje no banco
 * (`src/integrations/supabase/types.ts`). `xml_url` é a coluna canônica do XML
 * autorizado; `asaas_xml_url`/`asaas_pdf_url` foram adicionadas pela integração
 * Asaas e são opcionais — por isso a leitura usa `select('*')` e trata campo
 * ausente como ausente, em vez de exigir coluna que pode não existir.
 */
export interface NotaFiscalLocal {
  id: string;
  numero: string | null;
  serie: string | null;
  chave_acesso: string | null;
  data_emissao: string | null;
  cliente_nome: string | null;
  cliente_cnpj: string | null;
  status: string | null;
  valor_produtos: number | null;
  valor_frete: number | null;
  valor_desconto: number | null;
  valor_icms: number | null;
  valor_total: number | null;
  xml_url?: string | null;
  asaas_xml_url?: string | null;
  asaas_pdf_url?: string | null;
}

export interface ItemNotaFiscalLocal {
  nota_fiscal_id: string;
  n_item: number | null;
  c_prod: string | null;
  ncm: string | null;
  cfop: string | null;
  q_com: number | null;
  v_un_com: number | null;
  v_prod: number | null;
  cclasstrib: string | null;
  cst_ibscbs: string | null;
  v_bc_ibscbs: number | null;
  v_ibs_uf: number | null;
  v_ibs_mun: number | null;
  v_ibs: number | null;
  v_cbs: number | null;
}

/** `notas_fiscais.status` é TEXT no banco; a tela usa o enum da NF-e. */
const STATUS_LOCAL: Record<string, NotaFiscal['status']> = {
  autorizada: 'autorizada',
  emitida: 'autorizada',
  cancelada: 'cancelada',
  cancelado: 'cancelada',
  denegada: 'denegada',
  rejeitada: 'denegada',
  inutilizada: 'inutilizada',
  pendente: 'pendente',
};

export function statusNotaFiscalLocal(valor: string | null | undefined): NotaFiscal['status'] {
  return STATUS_LOCAL[(valor ?? '').trim().toLowerCase()] ?? 'pendente';
}

/** XML/DANFE só existem quando a nota foi importada com arquivo. */
export function urlDoArquivo(nota: NotaFiscalLocal, tipo: 'xml' | 'pdf'): string | undefined {
  const candidatos = tipo === 'xml' ? [nota.xml_url, nota.asaas_xml_url] : [nota.asaas_pdf_url];
  const url = candidatos.find((item) => typeof item === 'string' && item.trim().length > 0);
  return url ? url.trim() : undefined;
}

export function mapearItemLocal(item: ItemNotaFiscalLocal): ItemNFe {
  return {
    codigo: item.c_prod ?? '',
    // A tabela guarda o código do produto, não a descrição: a tela mostra o
    // dado real em vez de fabricar texto.
    descricao: item.c_prod ?? '',
    ncm: item.ncm ?? '',
    cfop: item.cfop ?? '',
    unidade: 'UN',
    quantidade: item.q_com ?? 0,
    valorUnitario: item.v_un_com ?? 0,
    valorTotal: item.v_prod ?? 0,
    cstIbsCbs: item.cst_ibscbs ?? undefined,
    cClassTrib: item.cclasstrib ?? undefined,
    vBCIbsCbs: item.v_bc_ibscbs ?? undefined,
    vIBSUF: item.v_ibs_uf ?? undefined,
    vIBSMun: item.v_ibs_mun ?? undefined,
    vIBS: item.v_ibs ?? undefined,
    vCBS: item.v_cbs ?? undefined,
  };
}

export function mapearNotaLocal(nota: NotaFiscalLocal, itens: ItemNFe[] = []): NotaFiscal {
  return {
    id: nota.id,
    numero: nota.numero ?? '',
    serie: nota.serie ?? '',
    chaveAcesso: nota.chave_acesso ?? '',
    // Emitente, natureza de operação e endereço não são importados para a
    // tabela local: ficam vazios na tela em vez de inventar dado fiscal.
    naturezaOperacao: '',
    dataEmissao: nota.data_emissao ?? '',
    cnpjEmitente: '',
    emitenteNome: '',
    cnpjDestinatario: nota.cliente_cnpj ?? '',
    destinatarioNome: nota.cliente_nome ?? '',
    destinatarioEndereco: '',
    valorProdutos: nota.valor_produtos ?? 0,
    valorFrete: nota.valor_frete ?? 0,
    valorSeguro: 0,
    valorDesconto: nota.valor_desconto ?? 0,
    valorIPI: 0,
    valorICMS: nota.valor_icms ?? 0,
    valorTotal: nota.valor_total ?? 0,
    status: statusNotaFiscalLocal(nota.status),
    itens,
    xmlUrl: urlDoArquivo(nota, 'xml'),
    pdfUrl: urlDoArquivo(nota, 'pdf'),
  };
}

const COLUNAS_ITEM =
  'nota_fiscal_id,n_item,c_prod,ncm,cfop,q_com,v_un_com,v_prod,cclasstrib,cst_ibscbs,v_bc_ibscbs,v_ibs_uf,v_ibs_mun,v_ibs,v_cbs';

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  if (typeof erro === 'object' && erro && 'message' in erro) return String(erro.message);
  return 'Falha ao consultar as notas fiscais.';
}

/**
 * Consulta as notas que existem no banco da empresa atual. A aba Notas nascia
 * com lista vazia fixa (`useState<NotaFiscal[]>([])`): a tela dizia "Nenhuma
 * nota fiscal encontrada" mesmo com notas importadas do Bling/XML.
 */
export function useNotasFiscaisLocais(limite = 200) {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const empresaId = getCurrentEmpresaId();
      let consulta = supabase
        .from('notas_fiscais')
        .select('*')
        .order('data_emissao', { ascending: false })
        .limit(limite);
      if (empresaId) consulta = consulta.eq('empresa_id', empresaId);

      const { data, error } = await consulta;
      if (error) throw error;

      const linhas = (data ?? []) as unknown as NotaFiscalLocal[];
      const itensPorNota = new Map<string, ItemNFe[]>();

      if (linhas.length > 0) {
        const { data: itens, error: erroItens } = await supabase
          .from('notas_fiscais_itens')
          .select(COLUNAS_ITEM)
          .in(
            'nota_fiscal_id',
            linhas.map((linha) => linha.id)
          );
        if (erroItens) throw erroItens;

        const ordenados = ((itens ?? []) as unknown as ItemNotaFiscalLocal[]).sort(
          (a, b) => (a.n_item ?? 0) - (b.n_item ?? 0)
        );
        for (const item of ordenados) {
          const atuais = itensPorNota.get(item.nota_fiscal_id) ?? [];
          atuais.push(mapearItemLocal(item));
          itensPorNota.set(item.nota_fiscal_id, atuais);
        }
      }

      setNotas(linhas.map((linha) => mapearNotaLocal(linha, itensPorNota.get(linha.id) ?? [])));
    } catch (erro) {
      setNotas([]);
      setErro(mensagemDeErro(erro));
    } finally {
      setLoading(false);
    }
  }, [limite]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return { notas, loading, erro, recarregar: carregar };
}
