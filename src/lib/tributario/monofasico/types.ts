// REGIME MONOFÁSICO PIS/COFINS — Tipos
// Base legal: Leis 9.718/98, 10.147/00, 10.485/02, 10.833/03, 10.865/04, 11.116/05
// Alíquotas em decimal (0.0210 = 2,10%).

export type PosicaoCadeia =
  | 'industria'
  | 'importador'
  | 'produtor'
  | 'distribuidor'
  | 'atacado'
  | 'varejo'
  | 'revenda';

export const POSICOES_INDUSTRIA: PosicaoCadeia[] = ['industria', 'importador', 'produtor'];
export const POSICOES_REVENDA: PosicaoCadeia[] = ['distribuidor', 'atacado', 'varejo', 'revenda'];

export type RegimeApuracaoPisCofins = 'presumido' | 'real' | 'simples';

export interface AliquotasPisCofins {
  pis: number;
  cofins: number;
}

export interface NcmMonofasico {
  /** NCM formatado como no catálogo oficial (ex.: "3004.10.00"). */
  ncm: string;
  descricao: string;
  /** Alíquotas específicas do NCM (sobrepõem as do grupo) — usadas quando existirem. */
  industria?: AliquotasPisCofins;
}

export interface GrupoMonofasico {
  chave: string;
  nome: string;
  descricao: string;
  baseLegal: string;
  /** Alíquotas padrão da etapa concentrada (indústria/importador/produtor). */
  industria?: AliquotasPisCofins;
  /** Alíquotas da revenda — em regra zero (tributação concentrada na origem). */
  revenda: AliquotasPisCofins;
  ncms: NcmMonofasico[];
  /** Prefixos NCM adicionais cobertos pelo grupo (sem pontos). */
  prefixos: string[];
  /**
   * Desempate quando dois grupos cobrem o mesmo prefixo.
   * Menor número = maior precedência (ex.: lista positiva antes da negativa).
   */
  prioridade: number;
}

export interface ClassificacaoMonofasica {
  monofasico: true;
  grupo: GrupoMonofasico;
  ncmNormalizado: string;
  /** Item exato do catálogo, quando o NCM foi reconhecido individualmente. */
  item: NcmMonofasico | null;
  /** Quantidade de dígitos que casaram — indica a precisão da classificação. */
  digitosCasados: number;
  origem: 'ncm_exato' | 'prefixo_grupo';
}

export interface ItemMonofasico {
  ncm: string;
  descricao?: string;
  /** Receita anual (ou do período) atribuída a este NCM, em BRL. */
  receita: number;
  /** Posição na cadeia deste item; usa a posição padrão quando ausente. */
  posicao?: PosicaoCadeia;
}

export interface ResultadoItemMonofasico {
  ncm: string;
  descricao: string;
  receita: number;
  posicao: PosicaoCadeia;
  monofasico: boolean;
  grupo: string | null;
  grupoNome: string | null;
  baseLegal: string | null;
  aliquotaPis: number;
  aliquotaCofins: number;
  pis: number;
  cofins: number;
  total: number;
  /** Tributo que seria pago se o item fosse tratado no regime normal. */
  totalRegimeNormal: number;
  /** Diferença positiva = economia por aplicar o monofásico corretamente. */
  economia: number;
  alerta?: string;
}

export interface ResumoMonofasico {
  itens: ResultadoItemMonofasico[];
  receitaTotal: number;
  receitaMonofasica: number;
  receitaNaoMonofasica: number;
  pisMonofasico: number;
  cofinsMonofasico: number;
  totalMonofasico: number;
  /** Quanto seria recolhido se toda a receita monofásica fosse tributada no regime normal. */
  totalSeRegimeNormal: number;
  economiaAnual: number;
  alertas: string[];
}

export interface RecuperacaoRetroativa {
  meses: number;
  creditoMensalMedio: number;
  totalRecuperavel: number;
  prescreveEm: string;
  observacoes: string[];
}
