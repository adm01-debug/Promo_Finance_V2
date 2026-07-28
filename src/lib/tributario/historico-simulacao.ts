/**
 * Normalização defensiva e agregação de auditoria do histórico de simulações.
 *
 * Os campos `parametros` e `ajustes_aplicados` da tabela `regimes_simulados`
 * são colunas `jsonb` — o banco não garante forma alguma. Registros legados
 * (anteriores às colunas) e payloads corrompidos precisam degradar de forma
 * previsível, jamais lançar exceção durante a renderização.
 */
import type { AjusteParametro } from './diagnostico-parametros';
import type { ParametrosSimulacao } from './types';

/** Campos numéricos do snapshot, com piso e teto legais aplicados na leitura. */
const CAMPOS_NUMERICOS: Record<string, { min: number; max: number }> = {
  faturamentoAnual: { min: 0, max: Number.MAX_SAFE_INTEGER },
  folhaAnual: { min: 0, max: Number.MAX_SAFE_INTEGER },
  margemLucro: { min: -100, max: 100 },
  percentualServicos: { min: 0, max: 100 },
  percentualRevenda: { min: 0, max: 100 },
  percentualIndustria: { min: 0, max: 100 },
  percentualExportacao: { min: 0, max: 100 },
  comprasComCredito: { min: 0, max: Number.MAX_SAFE_INTEGER },
  comprasComCreditoICMS: { min: 0, max: Number.MAX_SAFE_INTEGER },
  despesasOperacionais: { min: 0, max: Number.MAX_SAFE_INTEGER },
  aliquotaICMS: { min: 0, max: 1 },
  aliquotaISS: { min: 0, max: 1 },
  aliquotaRAT: { min: 0, max: 0.06 },
  aliquotaTerceiros: { min: 0, max: 0.1 },
  presuncaoIrpjServicos: { min: 0.08, max: 0.32 },
  presuncaoCsllServicos: { min: 0.12, max: 0.32 },
  sublimiteEstadual: { min: 0, max: Number.MAX_SAFE_INTEGER },
  issRetidoFonte: { min: 0, max: Number.MAX_SAFE_INTEGER },
  prejuizoFiscalAcumulado: { min: 0, max: Number.MAX_SAFE_INTEGER },
  baseNegativaCsllAcumulada: { min: 0, max: Number.MAX_SAFE_INTEGER },
};

const CAMPOS_TEXTO = ['uf', 'atividadePrincipal', 'cnaePrincipal'] as const;

/** Converte valores jsonb heterogêneos (number | string numérica) em número finito. */
function numeroFinito(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const n = Number(valor);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Aceita apenas séries mensais bem-formadas; descarta a série inteira se corrompida. */
function serieMensal(
  valor: unknown,
  chaves: readonly string[],
  opcionais: readonly string[] = [],
): Record<string, number>[] | null {
  if (!Array.isArray(valor) || valor.length === 0 || valor.length > 120) return null;
  const itens: Record<string, number>[] = [];
  for (const bruto of valor) {
    if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null;
    const registro = bruto as Record<string, unknown>;
    const item: Record<string, number> = {};
    for (const chave of chaves) {
      const n = numeroFinito(registro[chave]);
      if (n === null) return null;
      item[chave] = n;
    }
    for (const chave of opcionais) {
      const n = numeroFinito(registro[chave]);
      if (n !== null) item[chave] = n;
    }
    if (item.mes < 1 || item.mes > 12) return null;
    itens.push(item);
  }
  return itens;
}

/**
 * Snapshot é utilizável apenas se trouxer, no mínimo, um faturamento anual
 * finito. Os demais campos são validados e limitados individualmente: um valor
 * corrompido é descartado sem invalidar o registro inteiro, preservando a
 * reprodutibilidade do histórico.
 */
export function normalizarParametrosSnapshot(
  bruto: unknown,
): Partial<ParametrosSimulacao> | null {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null;
  const registro = bruto as Record<string, unknown>;
  const faturamentoAnual = numeroFinito(registro.faturamentoAnual);
  if (faturamentoAnual === null || faturamentoAnual < 0) return null;

  const saida: Record<string, unknown> = {};

  for (const [campo, limite] of Object.entries(CAMPOS_NUMERICOS)) {
    if (registro[campo] === undefined || registro[campo] === null) continue;
    const n = numeroFinito(registro[campo]);
    if (n === null) continue;
    saida[campo] = clamp(n, limite.min, limite.max);
  }
  saida.faturamentoAnual = faturamentoAnual;

  for (const campo of CAMPOS_TEXTO) {
    const v = registro[campo];
    if (typeof v === 'string' && v.trim() !== '') saida[campo] = v.trim().slice(0, 120);
  }

  if (registro.periodicidadeApuracao === 'anual' || registro.periodicidadeApuracao === 'trimestral') {
    saida.periodicidadeApuracao = registro.periodicidadeApuracao;
  }

  if (Array.isArray(registro.lucroTrimestral) && registro.lucroTrimestral.length === 4) {
    const trimestres = registro.lucroTrimestral.map(numeroFinito);
    if (trimestres.every((v): v is number => v !== null)) saida.lucroTrimestral = trimestres;
  }

  const faturamentoMensal = serieMensal(
    registro.faturamentoMensal,
    ['ano', 'mes', 'receita_bruta'],
    ['receita_servicos', 'receita_revenda', 'receita_industria', 'receita_exportacao'],
  );
  if (faturamentoMensal) saida.faturamentoMensal = faturamentoMensal;

  const folhaMensal = serieMensal(registro.folhaMensal, [
    'ano', 'mes', 'salarios', 'pro_labore', 'encargos', 'total_folha',
  ]);
  if (folhaMensal) saida.folhaMensal = folhaMensal;

  return saida as Partial<ParametrosSimulacao>;
}

/**
 * Campos OPCIONAIS do snapshot. Ao restaurar, qualquer um deles que não conste
 * no registro salvo precisa ser REMOVIDO do estado corrente — caso contrário
 * parâmetros avançados digitados depois (lucro por trimestre, prejuízos,
 * periodicidade, presunções) vazariam para dentro do cenário histórico e o
 * recálculo deixaria de reproduzir o snapshot.
 */
const CAMPOS_OPCIONAIS_SNAPSHOT = [
  'percentualRevenda',
  'percentualIndustria',
  'percentualExportacao',
  'comprasComCredito',
  'comprasComCreditoICMS',
  'despesasOperacionais',
  'aliquotaICMS',
  'aliquotaISS',
  'aliquotaRAT',
  'aliquotaTerceiros',
  'presuncaoIrpjServicos',
  'presuncaoCsllServicos',
  'sublimiteEstadual',
  'issRetidoFonte',
  'prejuizoFiscalAcumulado',
  'baseNegativaCsllAcumulada',
  'periodicidadeApuracao',
  'lucroTrimestral',
  'faturamentoMensal',
  'folhaMensal',
  'uf',
  'atividadePrincipal',
  'cnaePrincipal',
] as const satisfies ReadonlyArray<keyof ParametrosSimulacao>;

/**
 * Mescla um snapshot normalizado sobre os parâmetros correntes de forma
 * REPRODUTÍVEL: os campos obrigatórios do estado atual são preservados como
 * fallback, mas todo campo opcional ausente no snapshot é zerado.
 *
 * Função pura — não muta `atual`.
 */
export function mesclarSnapshotParametros(
  atual: ParametrosSimulacao,
  snapshot: Partial<ParametrosSimulacao>,
): ParametrosSimulacao {
  const mesclado: Record<string, unknown> = { ...atual, ...snapshot };
  for (const campo of CAMPOS_OPCIONAIS_SNAPSHOT) {
    if (snapshot[campo] === undefined) delete mesclado[campo];
  }
  return mesclado as ParametrosSimulacao;
}



/** Filtra apenas os itens que satisfazem integralmente o contrato de ajuste. */
export function normalizarAjustesAplicados(bruto: unknown): AjusteParametro[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.filter((item): item is AjusteParametro => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const registro = item as Record<string, unknown>;
    return (
      typeof registro.campo === 'string' &&
      typeof registro.rotulo === 'string' &&
      typeof registro.informado === 'string' &&
      typeof registro.aplicado === 'string' &&
      (registro.severidade === 'aviso' || registro.severidade === 'critico')
    );
  });
}

export interface ResumoAuditoriaHistorico {
  total: number;
  divergentes: number;
  motorDesatualizado: number;
  comAjustes: number;
  comAjustesCriticos: number;
  /** True quando nenhum snapshot apresenta divergência, ajuste ou versão antiga. */
  saudavel: boolean;
}

export interface ItemAuditavel {
  divergente: boolean;
  motorDesatualizado: boolean;
  ajustesAplicados: AjusteParametro[];
}

/** Agrega os indicadores de qualidade do histórico para exibição resumida. */
export function resumirAuditoriaHistorico(
  itens: readonly ItemAuditavel[],
): ResumoAuditoriaHistorico {
  const divergentes = itens.filter((i) => i.divergente).length;
  const motorDesatualizado = itens.filter((i) => i.motorDesatualizado).length;
  const comAjustes = itens.filter((i) => i.ajustesAplicados.length > 0).length;
  const comAjustesCriticos = itens.filter((i) =>
    i.ajustesAplicados.some((a) => a.severidade === 'critico'),
  ).length;

  return {
    total: itens.length,
    divergentes,
    motorDesatualizado,
    comAjustes,
    comAjustesCriticos,
    saudavel: divergentes === 0 && motorDesatualizado === 0 && comAjustes === 0,
  };
}

/** Um snapshot é "pendente" se diverge, veio de motor antigo ou teve ajustes. */
export function snapshotComPendencia(item: ItemAuditavel): boolean {
  return item.divergente || item.motorDesatualizado || item.ajustesAplicados.length > 0;
}

/**
 * Filtra o histórico para exibição. Quando `somentePendencias` é true, retorna
 * apenas snapshots que exigem atenção do contador; caso o filtro zere a lista,
 * a UI deve informar o usuário em vez de simplesmente sumir com o card.
 */
export function filtrarHistorico<T extends ItemAuditavel>(
  itens: readonly T[],
  somentePendencias: boolean,
): T[] {
  return somentePendencias ? itens.filter(snapshotComPendencia) : [...itens];
}

/** Linha achatada da trilha de auditoria, pronta para CSV/planilha. */
export interface LinhaAuditoriaCsv extends Record<string, string | number> {
  data: string;
  regimeSalvo: string;
  regimeRecalculado: string;
  situacao: string;
  versaoMotor: string;
  faturamento12m: number;
  folha12m: number;
  economiaAnual: number;
  qtdAjustes: number;
  ajustesCriticos: number;
  ajustes: string;
}

/** Item mínimo exigido para compor a trilha exportável. */
export interface ItemAuditavelExportavel extends ItemAuditavel {
  data_simulacao: string;
  regime_recomendado: string;
  regimeRecalculado: string | null;
  versao_motor: string | null;
  rbt12: number;
  folha_12m: number;
  economia_anual_estimada: number | null;
}

function descreverSituacao(item: ItemAuditavelExportavel): string {
  const marcas: string[] = [];
  if (item.divergente) marcas.push('divergente');
  if (item.motorDesatualizado) marcas.push('motor antigo');
  if (item.ajustesAplicados.some((a) => a.severidade === 'critico')) marcas.push('ajuste crítico');
  else if (item.ajustesAplicados.length > 0) marcas.push('ajustado');
  return marcas.length > 0 ? marcas.join(' | ') : 'ok';
}

/**
 * Achata o histórico auditado em linhas exportáveis. Função pura: não formata
 * moeda nem toca no DOM, para permanecer testável e independente de locale.
 */
export function montarLinhasAuditoriaCsv(
  itens: readonly ItemAuditavelExportavel[],
): LinhaAuditoriaCsv[] {
  return itens.map((item) => ({
    data: item.data_simulacao ?? '',
    regimeSalvo: item.regime_recomendado ?? '',
    regimeRecalculado: item.regimeRecalculado ?? '',
    situacao: descreverSituacao(item),
    versaoMotor: item.versao_motor ?? 'legado',
    faturamento12m: Number.isFinite(item.rbt12) ? item.rbt12 : 0,
    folha12m: Number.isFinite(item.folha_12m) ? item.folha_12m : 0,
    economiaAnual:
      typeof item.economia_anual_estimada === 'number' &&
      Number.isFinite(item.economia_anual_estimada)
        ? item.economia_anual_estimada
        : 0,
    qtdAjustes: item.ajustesAplicados.length,
    ajustesCriticos: item.ajustesAplicados.filter((a) => a.severidade === 'critico').length,
    ajustes: item.ajustesAplicados
      .map((a) => `${a.rotulo}: ${a.informado} → ${a.aplicado}`)
      .join(' ; '),
  }));
}

export interface PaginaHistorico<T> {
  itens: T[];
  /** Página efetivamente aplicada após o clamp (1-based). */
  pagina: number;
  totalPaginas: number;
  total: number;
  /** Índice humano do primeiro item exibido (1-based); 0 quando vazio. */
  inicio: number;
  /** Índice humano do último item exibido; 0 quando vazio. */
  fim: number;
}

/**
 * Pagina o histórico de forma defensiva: página fora do intervalo é ajustada
 * para o limite mais próximo (útil quando o filtro de pendências encurta a
 * lista enquanto o usuário está numa página avançada) e tamanhos inválidos
 * degradam para 1, jamais produzindo divisão por zero ou fatia vazia.
 */
export function paginarHistorico<T>(
  itens: readonly T[],
  pagina: number,
  tamanhoPagina: number,
): PaginaHistorico<T> {
  const total = itens.length;
  const tamanho =
    Number.isFinite(tamanhoPagina) && tamanhoPagina >= 1 ? Math.floor(tamanhoPagina) : 1;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanho));
  const paginaSolicitada = Number.isFinite(pagina) ? Math.floor(pagina) : 1;
  const paginaAtual = Math.min(Math.max(paginaSolicitada, 1), totalPaginas);
  const offset = (paginaAtual - 1) * tamanho;
  const fatia = itens.slice(offset, offset + tamanho);

  return {
    itens: fatia,
    pagina: paginaAtual,
    totalPaginas,
    total,
    inicio: total === 0 ? 0 : offset + 1,
    fim: total === 0 ? 0 : offset + fatia.length,
  };
}

/** Critérios de ordenação suportados pelo card de histórico. */
export type OrdenacaoHistorico = 'data_desc' | 'data_asc' | 'economia_desc' | 'pendencia';

export const ORDENACOES_HISTORICO: ReadonlyArray<{
  valor: OrdenacaoHistorico;
  rotulo: string;
}> = [
  { valor: 'data_desc', rotulo: 'Mais recentes' },
  { valor: 'data_asc', rotulo: 'Mais antigos' },
  { valor: 'economia_desc', rotulo: 'Maior economia' },
  { valor: 'pendencia', rotulo: 'Pendências primeiro' },
];

/** Item mínimo ordenável (subconjunto do exportável). */
export interface ItemAuditavelOrdenavel extends ItemAuditavel {
  data_simulacao: string;
  economia_anual_estimada: number | null;
}

/** Datas inválidas/ausentes vão para o fim, nunca quebram a comparação. */
function tempoDe(valor: string): number {
  const t = Date.parse(valor ?? '');
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

function economiaDe(valor: number | null): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : Number.NEGATIVE_INFINITY;
}

/** Peso de pendência: crítico > divergente/motor antigo > ajuste simples > ok. */
function pesoPendencia(item: ItemAuditavelOrdenavel): number {
  if (item.ajustesAplicados.some((a) => a.severidade === 'critico')) return 3;
  if (item.divergente || item.motorDesatualizado) return 2;
  if (item.ajustesAplicados.length > 0) return 1;
  return 0;
}

/**
 * Ordena o histórico sem mutar a lista de entrada. Todos os critérios usam a
 * data decrescente como desempate para manter a saída estável e determinística.
 */
export function ordenarHistorico<T extends ItemAuditavelOrdenavel>(
  itens: readonly T[],
  ordenacao: OrdenacaoHistorico,
): T[] {
  const copia = [...itens];
  const porDataDesc = (a: T, b: T) => tempoDe(b.data_simulacao) - tempoDe(a.data_simulacao);

  switch (ordenacao) {
    case 'data_asc':
      return copia.sort((a, b) => tempoDe(a.data_simulacao) - tempoDe(b.data_simulacao));
    case 'economia_desc':
      return copia.sort(
        (a, b) =>
          economiaDe(b.economia_anual_estimada) - economiaDe(a.economia_anual_estimada) ||
          porDataDesc(a, b),
      );
    case 'pendencia':
      return copia.sort((a, b) => pesoPendencia(b) - pesoPendencia(a) || porDataDesc(a, b));
    case 'data_desc':
    default:
      return copia.sort(porDataDesc);
  }
}
