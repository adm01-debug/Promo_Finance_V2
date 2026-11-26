import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentEmpresaId } from '@/hooks/useUserEmpresas';
import { EmpresaScopeContext } from '@/contexts/useEmpresaScope';
import { getNfeXmlSignedUrl } from '@/hooks/useNfeRecebidas';
import { env } from '@/config/env';
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
  empresa_id: string | null;
  numero: string | null;
  serie: string | null;
  chave_acesso: string | null;
  data_emissao: string | null;
  natureza_operacao?: string | null;
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

/**
 * Hosts que realmente entregam arquivo fiscal do sistema. Um usuário com
 * permissão de escrita em `notas_fiscais` pode gravar qualquer URL na nota;
 * abrir um destino arbitrário levaria outro usuário da mesma empresa para uma
 * página de terceiro (phishing). Só http(s) de host conhecido é aberto.
 */
const HOSTS_CONFIAVEIS = ['bling.com.br', 'asaas.com'];

/**
 * `*.supabase.co` é compartilhado por todos os projetos Supabase: aceitar o
 * domínio inteiro permitiria trocar o link fiscal por conteúdo de outro
 * projeto. Só o projeto deste sistema serve os arquivos (bucket `nfe-xml`).
 */
function hostSupabaseDoProjeto(host: string): boolean {
  const ref = env.SUPABASE_PROJECT_ID.toLowerCase();
  return host === `${ref}.supabase.co` || host === `${ref}.supabase.in`;
}

export function urlFiscalConfiavel(url: string | null | undefined): string | undefined {
  const bruto = (url ?? '').trim();
  if (!bruto) return undefined;
  try {
    const alvo = new URL(bruto);
    if (alvo.protocol !== 'https:') return undefined;
    const host = alvo.hostname.toLowerCase();
    const confiavel =
      hostSupabaseDoProjeto(host) ||
      HOSTS_CONFIAVEIS.some((dominio) => host === dominio || host.endsWith(`.${dominio}`));
    return confiavel ? alvo.toString() : undefined;
  } catch {
    return undefined;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHAVE_RE = /^[0-9]{44}$/;

/**
 * Layout do bucket privado `nfe-xml` (`_shared/nfe/xml-storage.ts`:{empresa}/{chave}.xml).
 * O XML autorizado pelo Bling é gravado apenas no bucket — `xml_url` fica nulo —,
 * então a lista monta o caminho a partir da empresa e da chave da nota.
 */
export function pathXmlNoStorage(
  empresaId: string | null | undefined,
  chave: string | null | undefined
): string | undefined {
  const empresa = (empresaId ?? '').trim();
  const chaveAcesso = (chave ?? '').trim();
  if (!UUID_RE.test(empresa) || !CHAVE_RE.test(chaveAcesso)) return undefined;
  return `${empresa.toLowerCase()}/${chaveAcesso}.xml`;
}

/** URL só existe quando a nota realmente tem o arquivo. */
export function urlDoArquivo(nota: NotaFiscalLocal, tipo: 'xml' | 'pdf'): string | undefined {
  const candidatos = tipo === 'xml' ? [nota.xml_url, nota.asaas_xml_url] : [nota.asaas_pdf_url];
  return urlFiscalConfiavel(
    candidatos.find((item) => typeof item === 'string' && item.trim()) ?? ''
  );
}

/**
 * Resolve o arquivo no clique: usa a URL gravada quando existe e, para o XML,
 * cai no objeto do bucket privado com URL assinada de curta duração (mesmo
 * caminho usado pela aba de notas recebidas). Nunca persiste URL assinada.
 */
export async function resolverUrlArquivo(
  nota: Pick<NotaFiscal, 'xmlUrl' | 'pdfUrl' | 'chaveAcesso' | 'empresaId'>,
  tipo: 'xml' | 'pdf'
): Promise<string | undefined> {
  const direta = urlFiscalConfiavel(tipo === 'xml' ? nota.xmlUrl : nota.pdfUrl);
  if (direta) return direta;
  if (tipo !== 'xml') return undefined;

  const path = pathXmlNoStorage(nota.empresaId, nota.chaveAcesso);
  if (!path) return undefined;

  const assinada = await getNfeXmlSignedUrl(path);
  return urlFiscalConfiavel(assinada ?? undefined);
}

export type ResultadoAbertura = 'aberto' | 'sem_arquivo' | 'bloqueado';

/**
 * Abre o arquivo em outra aba. A aba nasce no clique, antes do `await`: a
 * assinatura da URL leva tempo e, aberta depois dela, o navegador já encerrou
 * a ativação do clique e bloqueia a janela em silêncio.
 */
export async function abrirArquivoFiscal(
  nota: Pick<NotaFiscal, 'xmlUrl' | 'pdfUrl' | 'chaveAcesso' | 'empresaId'>,
  tipo: 'xml' | 'pdf'
): Promise<ResultadoAbertura> {
  const aba = typeof window === 'undefined' ? null : window.open('', '_blank');
  if (aba) aba.opener = null;

  let url: string | undefined;
  try {
    url = await resolverUrlArquivo(nota, tipo);
  } catch {
    url = undefined;
  }
  if (!url) {
    aba?.close();
    return 'sem_arquivo';
  }
  if (!aba) return 'bloqueado';
  aba.location.href = url;
  return 'aberto';
}

export type DirecaoNota = 'saida' | 'entrada' | 'indefinida';

const NATUREZA_DEVOLUCAO = /devolu|retorno/i;
const NATUREZA_SAIDA = /venda|sa[ií]da|presta[cç][aã]o|faturamento|exporta/i;
const NATUREZA_ENTRADA = /compra|entrada|importa|remessa|transfer|bonifica|consigna|comodato/i;

function direcaoDoCfop(cfop: string | null | undefined): DirecaoNota | undefined {
  const digito = (cfop ?? '').trim()[0];
  if (digito === '1' || digito === '2' || digito === '3') return 'entrada';
  if (digito === '5' || digito === '6' || digito === '7') return 'saida';
  return undefined;
}

/**
 * `cliente_nome`/`cliente_cnpj` guardam a contraparte do documento: o
 * destinatário quando a nota é de saída e o emitente (fornecedor) quando é de
 * entrada — os dois fluxos de importação (`useImportacaoXMLNFe` e
 * `guardar-xml-nfe-autorizada`) gravam os mesmos campos. Sem saber o sentido, a
 * tela somaria compra como faturamento e mostraria o fornecedor como cliente.
 * O CFOP manda (dado fiscal do item); a natureza da operação cobre o resto.
 */
export function direcaoDaNota(
  natureza: string | null | undefined,
  cfops: (string | null | undefined)[] = []
): DirecaoNota {
  for (const cfop of cfops) {
    const direcao = direcaoDoCfop(cfop);
    if (direcao) return direcao;
  }
  const texto = (natureza ?? '').trim();
  if (!texto) return 'indefinida';
  if (NATUREZA_DEVOLUCAO.test(texto)) return 'entrada';
  if (NATUREZA_SAIDA.test(texto)) return 'saida';
  if (NATUREZA_ENTRADA.test(texto)) return 'entrada';
  return 'indefinida';
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
  const direcao = direcaoDaNota(
    nota.natureza_operacao,
    itens.map((item) => item.cfop)
  );
  const entrada = direcao === 'entrada';

  return {
    id: nota.id,
    empresaId: nota.empresa_id ?? undefined,
    numero: nota.numero ?? '',
    serie: nota.serie ?? '',
    chaveAcesso: nota.chave_acesso ?? '',
    // Endereço e protocolo não são importados para a tabela local: ficam
    // vazios na tela em vez de inventar dado fiscal.
    naturezaOperacao: nota.natureza_operacao ?? '',
    dataEmissao: nota.data_emissao ?? '',
    cnpjEmitente: entrada ? (nota.cliente_cnpj ?? '') : '',
    emitenteNome: entrada ? (nota.cliente_nome ?? '') : '',
    cnpjDestinatario: entrada ? '' : (nota.cliente_cnpj ?? ''),
    destinatarioNome: entrada ? '' : (nota.cliente_nome ?? ''),
    destinatarioEndereco: '',
    valorProdutos: nota.valor_produtos ?? 0,
    valorFrete: nota.valor_frete ?? 0,
    valorSeguro: 0,
    valorDesconto: nota.valor_desconto ?? 0,
    valorIPI: 0,
    valorICMS: nota.valor_icms ?? 0,
    valorTotal: nota.valor_total ?? 0,
    status: statusNotaFiscalLocal(nota.status),
    direcao,
    itens,
    xmlUrl: urlDoArquivo(nota, 'xml'),
    pdfUrl: urlDoArquivo(nota, 'pdf'),
    xmlNoStorage: Boolean(pathXmlNoStorage(nota.empresa_id, nota.chave_acesso)),
  };
}

export interface ResumoNotas {
  totalEmitido: number;
  totalEntradas: number;
  totalCancelado: number;
  totalPendente: number;
  notasAutorizadas: number;
  itensFaturados: number;
  semClassificacao: number;
}

/** Indicadores da tela: emissão só conta saída; compra aparece em separado. */
export function resumirNotas(notas: NotaFiscal[]): ResumoNotas {
  const autorizadas = notas.filter((nota) => nota.status === 'autorizada');
  const saida = autorizadas.filter((nota) => nota.direcao !== 'entrada');
  const entrada = autorizadas.filter((nota) => nota.direcao === 'entrada');
  const somar = (lista: NotaFiscal[]) => lista.reduce((acc, nota) => acc + nota.valorTotal, 0);

  return {
    totalEmitido: somar(saida),
    notasAutorizadas: saida.length,
    itensFaturados: saida.reduce(
      (acc, nota) => acc + nota.itens.reduce((soma, item) => soma + item.quantidade, 0),
      0
    ),
    totalEntradas: somar(entrada),
    totalCancelado: somar(notas.filter((nota) => nota.status === 'cancelada')),
    totalPendente: somar(notas.filter((nota) => nota.status === 'pendente')),
    semClassificacao: notas.filter((nota) => nota.direcao === 'indefinida').length,
  };
}

const COLUNAS_ITEM =
  'nota_fiscal_id,n_item,c_prod,ncm,cfop,q_com,v_un_com,v_prod,cclasstrib,cst_ibscbs,v_bc_ibscbs,v_ibs_uf,v_ibs_mun,v_ibs,v_cbs';

/** Prefixo da chave de cache: a aba Bling invalida esta consulta após cancelar. */
export const CHAVE_QUERY_NOTAS = ['notas-fiscais-locais'] as const;

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  if (typeof erro === 'object' && erro && 'message' in erro) return String(erro.message);
  return 'Falha ao consultar as notas fiscais.';
}

async function carregarNotas(empresaId: string, limite: number): Promise<NotaFiscal[]> {
  const { data, error } = await supabase
    .from('notas_fiscais')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('data_emissao', { ascending: false })
    .limit(limite);
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

  return linhas.map((linha) => mapearNotaLocal(linha, itensPorNota.get(linha.id) ?? []));
}

/**
 * Consulta as notas que existem no banco da empresa atual. A aba Notas nascia
 * com lista vazia fixa (`useState<NotaFiscal[]>([])`): a tela dizia "Nenhuma
 * nota fiscal encontrada" mesmo com notas importadas do Bling/XML.
 *
 * A empresa faz parte da chave de cache: trocar de empresa no seletor lateral
 * refaz a consulta em vez de manter na tela as notas da empresa anterior.
 */
export function useNotasFiscaisLocais(limite = 200) {
  const escopo = useContext(EmpresaScopeContext);
  const empresaId = escopo?.currentEmpresaId ?? getCurrentEmpresaId() ?? null;

  const consulta = useQuery({
    queryKey: [...CHAVE_QUERY_NOTAS, empresaId, limite],
    queryFn: () => carregarNotas(empresaId as string, limite),
    enabled: Boolean(empresaId),
    staleTime: 60_000,
  });

  return {
    notas: consulta.data ?? [],
    loading: consulta.isPending && consulta.fetchStatus === 'fetching',
    erro: consulta.error ? mensagemDeErro(consulta.error) : null,
    recarregar: () => {
      void consulta.refetch();
    },
  };
}
