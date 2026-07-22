// Types e configuração padrão do matcher de transações.

export interface LancamentoSistema {
  id: string;
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  dataVencimento: Date;
  entidade: string;
  entidadeNome?: string;
  status: string;
  numeroDocumento?: string;
  centro_custo_nome?: string;
  centro_custo_id?: string;
  empresaId?: string;
  contaBancariaId?: string;
}

export interface MatchMotivo {
  tipo:
    | 'valor_exato'
    | 'valor_proximo'
    | 'nome_exato'
    | 'nome_parcial'
    | 'data_proxima'
    | 'documento';
  descricao: string;
  peso: number;
}

export interface MatchSugestao {
  transacaoId: string;
  lancamentoId: string;
  lancamentoTipo: 'pagar' | 'receber';
  score: number;
  motivos: MatchMotivo[];
  lancamento: LancamentoSistema;
  confianca: 'alta' | 'media' | 'baixa';
  divergenciaValor?: number;
}

export interface ConfiguracaoMatch {
  pesoValorExato: number;
  pesoValorProximo: number;
  pesoNomeExato: number;
  pesoNomeParcial: number;
  pesoDataProxima: number;
  pesoDocumento: number;
  pesoCnpj: number;
  toleranciaValor: number;
  toleranciaDias: number;
  scoreMinimo: number;
}

export const DEFAULT_CONFIG: ConfiguracaoMatch = {
  pesoValorExato: 50,
  pesoValorProximo: 30,
  pesoNomeExato: 40,
  pesoNomeParcial: 25,
  pesoDataProxima: 20,
  pesoDocumento: 30,
  pesoCnpj: 60,
  toleranciaValor: 2,
  toleranciaDias: 5,
  scoreMinimo: 45,
};

export const TOLERANCIA_CENTAVOS = 0.5;

export interface EstatisticasMatch {
  totalTransacoes: number;
  comSugestao: number;
  confiancaAlta: number;
  confiancaMedia: number;
  confiancaBaixa: number;
  semMatch: number;
  valorTotalMatcheado: number;
}
