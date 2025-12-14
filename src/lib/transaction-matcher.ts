// ============================================
// INTELLIGENT TRANSACTION MATCHING ENGINE
// ============================================

import { TransacaoOFX } from './ofx-parser';

// Types for matching
export interface LancamentoSistema {
  id: string;
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  dataVencimento: Date;
  entidade: string; // Cliente ou Fornecedor
  entidadeNome?: string;
  status: string;
  numeroDocumento?: string;
}

export interface MatchSugestao {
  transacaoId: string;
  lancamentoId: string;
  lancamentoTipo: 'pagar' | 'receber';
  score: number; // 0-100
  motivos: MatchMotivo[];
  lancamento: LancamentoSistema;
  confianca: 'alta' | 'media' | 'baixa';
}

export interface MatchMotivo {
  tipo: 'valor_exato' | 'valor_proximo' | 'nome_exato' | 'nome_parcial' | 'data_proxima' | 'documento';
  descricao: string;
  peso: number;
}

export interface ConfiguracaoMatch {
  pesoValorExato: number;
  pesoValorProximo: number;
  pesoNomeExato: number;
  pesoNomeParcial: number;
  pesoDataProxima: number;
  pesoDocumento: number;
  toleranciaValor: number; // Percentual de diferença aceita
  toleranciaDias: number; // Dias de diferença aceita para data
  scoreMinimo: number; // Score mínimo para considerar match
}

// Default configuration
export const DEFAULT_CONFIG: ConfiguracaoMatch = {
  pesoValorExato: 40,
  pesoValorProximo: 20,
  pesoNomeExato: 35,
  pesoNomeParcial: 20,
  pesoDataProxima: 15,
  pesoDocumento: 30,
  toleranciaValor: 2, // 2% de tolerância
  toleranciaDias: 5, // 5 dias de tolerância
  scoreMinimo: 50,
};

// Text normalization for comparison
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Extract keywords from text
function extrairPalavrasChave(texto: string): string[] {
  const stopWords = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'para', 'com', 'em', 'por',
    'ltda', 'sa', 'me', 'eireli', 'epp', 'sas', 'ss',
    'pix', 'ted', 'doc', 'boleto', 'pag', 'pagamento', 'recebimento',
    'transferencia', 'debito', 'credito', 'enviado', 'recebido',
  ]);
  
  return normalizarTexto(texto)
    .split(' ')
    .filter(palavra => palavra.length > 2 && !stopWords.has(palavra));
}

// Calculate text similarity using Jaccard index + partial matching
function calcularSimilaridadeTexto(texto1: string, texto2: string): { score: number; tipo: 'exato' | 'parcial' | 'nenhum' } {
  const normalizado1 = normalizarTexto(texto1);
  const normalizado2 = normalizarTexto(texto2);
  
  // Exact match
  if (normalizado1 === normalizado2) {
    return { score: 1, tipo: 'exato' };
  }
  
  // Check if one contains the other
  if (normalizado1.includes(normalizado2) || normalizado2.includes(normalizado1)) {
    const maior = Math.max(normalizado1.length, normalizado2.length);
    const menor = Math.min(normalizado1.length, normalizado2.length);
    return { score: menor / maior, tipo: 'parcial' };
  }
  
  // Keyword matching
  const palavras1 = new Set(extrairPalavrasChave(texto1));
  const palavras2 = new Set(extrairPalavrasChave(texto2));
  
  if (palavras1.size === 0 || palavras2.size === 0) {
    return { score: 0, tipo: 'nenhum' };
  }
  
  // Calculate Jaccard similarity
  const intersecao = [...palavras1].filter(p => palavras2.has(p)).length;
  const uniao = new Set([...palavras1, ...palavras2]).size;
  const jaccard = intersecao / uniao;
  
  // Also check for partial word matches
  let matchesParciais = 0;
  for (const p1 of palavras1) {
    for (const p2 of palavras2) {
      if (p1.includes(p2) || p2.includes(p1)) {
        matchesParciais++;
      }
    }
  }
  
  const scoreParcial = matchesParciais / Math.max(palavras1.size, palavras2.size);
  const scoreFinal = Math.max(jaccard, scoreParcial * 0.8);
  
  return { 
    score: scoreFinal, 
    tipo: scoreFinal > 0.3 ? 'parcial' : 'nenhum' 
  };
}

// Calculate value similarity
function calcularSimilaridadeValor(
  valor1: number, 
  valor2: number, 
  tolerancia: number
): { score: number; tipo: 'exato' | 'proximo' | 'diferente' } {
  const diff = Math.abs(valor1 - valor2);
  const percentDiff = (diff / Math.max(Math.abs(valor1), Math.abs(valor2))) * 100;
  
  if (diff < 0.01) { // Essentially equal (floating point tolerance)
    return { score: 1, tipo: 'exato' };
  }
  
  if (percentDiff <= tolerancia) {
    return { score: 1 - (percentDiff / tolerancia) * 0.3, tipo: 'proximo' };
  }
  
  // Linear decay for values outside tolerance
  if (percentDiff <= tolerancia * 5) {
    return { score: 0.5 - (percentDiff - tolerancia) / (tolerancia * 10), tipo: 'proximo' };
  }
  
  return { score: 0, tipo: 'diferente' };
}

// Calculate date similarity
function calcularSimilaridadeData(
  data1: Date, 
  data2: Date, 
  toleranciaDias: number
): number {
  const diffMs = Math.abs(data1.getTime() - data2.getTime());
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDias <= 1) {
    return 1;
  }
  
  if (diffDias <= toleranciaDias) {
    return 1 - (diffDias / toleranciaDias) * 0.5;
  }
  
  if (diffDias <= toleranciaDias * 2) {
    return 0.3 - (diffDias - toleranciaDias) / (toleranciaDias * 4);
  }
  
  return 0;
}

// Main matching function for a single transaction
export function encontrarMatchesParaTransacao(
  transacao: TransacaoOFX,
  lancamentos: LancamentoSistema[],
  config: ConfiguracaoMatch = DEFAULT_CONFIG
): MatchSugestao[] {
  const sugestoes: MatchSugestao[] = [];
  
  // Filter lancamentos by tipo (credito -> receber, debito -> pagar)
  const tipoEsperado = transacao.tipo === 'credito' ? 'receber' : 'pagar';
  const lancamentosFiltrados = lancamentos.filter(l => 
    l.tipo === tipoEsperado && 
    l.status !== 'pago' && 
    l.status !== 'cancelado'
  );
  
  for (const lancamento of lancamentosFiltrados) {
    const motivos: MatchMotivo[] = [];
    let scoreTotal = 0;
    let pesoTotal = 0;
    
    // 1. Compare values
    const valorTransacao = Math.abs(transacao.valor);
    const similaridadeValor = calcularSimilaridadeValor(
      valorTransacao, 
      lancamento.valor, 
      config.toleranciaValor
    );
    
    if (similaridadeValor.tipo === 'exato') {
      motivos.push({
        tipo: 'valor_exato',
        descricao: 'Valor exato encontrado',
        peso: config.pesoValorExato,
      });
      scoreTotal += config.pesoValorExato;
      pesoTotal += config.pesoValorExato;
    } else if (similaridadeValor.tipo === 'proximo') {
      const peso = config.pesoValorProximo * similaridadeValor.score;
      motivos.push({
        tipo: 'valor_proximo',
        descricao: `Valor próximo (${((1 - similaridadeValor.score) * 100).toFixed(1)}% diferença)`,
        peso,
      });
      scoreTotal += peso;
      pesoTotal += config.pesoValorProximo;
    } else {
      // Values don't match at all - skip this lancamento
      continue;
    }
    
    // 2. Compare description/entity name
    const textoTransacao = `${transacao.descricao} ${transacao.memo || ''}`;
    const textoLancamento = `${lancamento.descricao} ${lancamento.entidade} ${lancamento.entidadeNome || ''}`;
    
    const similaridadeTexto = calcularSimilaridadeTexto(textoTransacao, textoLancamento);
    
    if (similaridadeTexto.tipo === 'exato') {
      motivos.push({
        tipo: 'nome_exato',
        descricao: 'Nome/descrição exato',
        peso: config.pesoNomeExato,
      });
      scoreTotal += config.pesoNomeExato;
    } else if (similaridadeTexto.tipo === 'parcial' && similaridadeTexto.score > 0.2) {
      const peso = config.pesoNomeParcial * similaridadeTexto.score;
      motivos.push({
        tipo: 'nome_parcial',
        descricao: `Nome/descrição similar (${(similaridadeTexto.score * 100).toFixed(0)}%)`,
        peso,
      });
      scoreTotal += peso;
    }
    pesoTotal += config.pesoNomeExato;
    
    // 3. Compare dates
    const similaridadeData = calcularSimilaridadeData(
      transacao.data, 
      lancamento.dataVencimento,
      config.toleranciaDias
    );
    
    if (similaridadeData > 0.5) {
      const peso = config.pesoDataProxima * similaridadeData;
      motivos.push({
        tipo: 'data_proxima',
        descricao: `Data próxima ao vencimento`,
        peso,
      });
      scoreTotal += peso;
    }
    pesoTotal += config.pesoDataProxima;
    
    // 4. Document number matching (if available)
    if (transacao.numeroReferencia && lancamento.numeroDocumento) {
      if (transacao.numeroReferencia.includes(lancamento.numeroDocumento) ||
          lancamento.numeroDocumento.includes(transacao.numeroReferencia)) {
        motivos.push({
          tipo: 'documento',
          descricao: 'Número de documento correspondente',
          peso: config.pesoDocumento,
        });
        scoreTotal += config.pesoDocumento;
      }
    }
    
    // Calculate final score (normalized to 0-100)
    const scoreFinal = Math.min(100, (scoreTotal / pesoTotal) * 100);
    
    if (scoreFinal >= config.scoreMinimo) {
      sugestoes.push({
        transacaoId: transacao.id,
        lancamentoId: lancamento.id,
        lancamentoTipo: lancamento.tipo,
        score: Math.round(scoreFinal),
        motivos,
        lancamento,
        confianca: scoreFinal >= 85 ? 'alta' : scoreFinal >= 65 ? 'media' : 'baixa',
      });
    }
  }
  
  // Sort by score descending
  return sugestoes.sort((a, b) => b.score - a.score);
}

// Match all transactions at once
export function encontrarTodosMatches(
  transacoes: TransacaoOFX[],
  lancamentos: LancamentoSistema[],
  config: ConfiguracaoMatch = DEFAULT_CONFIG
): Map<string, MatchSugestao[]> {
  const resultado = new Map<string, MatchSugestao[]>();
  
  // Track which lancamentos have been matched
  const lancamentosUsados = new Set<string>();
  
  // Sort transactions by value (higher first) to prioritize exact matches
  const transacoesOrdenadas = [...transacoes].sort(
    (a, b) => Math.abs(b.valor) - Math.abs(a.valor)
  );
  
  for (const transacao of transacoesOrdenadas) {
    // Filter out already used lancamentos for top suggestions
    const lancamentosDisponiveis = lancamentos.filter(
      l => !lancamentosUsados.has(l.id)
    );
    
    const matches = encontrarMatchesParaTransacao(transacao, lancamentosDisponiveis, config);
    
    if (matches.length > 0) {
      resultado.set(transacao.id, matches);
      
      // Mark top match as used (but still show in results)
      if (matches[0].score >= 80) {
        lancamentosUsados.add(matches[0].lancamentoId);
      }
    }
  }
  
  return resultado;
}

// Convert database records to LancamentoSistema format
export function converterContasPagarParaLancamentos(
  contasPagar: Array<{
    id: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    fornecedor_nome: string;
    status: string;
    numero_documento?: string | null;
    fornecedores?: { razao_social: string; nome_fantasia?: string | null } | null;
  }>
): LancamentoSistema[] {
  return contasPagar.map(cp => ({
    id: cp.id,
    tipo: 'pagar' as const,
    descricao: cp.descricao,
    valor: cp.valor,
    dataVencimento: new Date(cp.data_vencimento),
    entidade: cp.fornecedor_nome,
    entidadeNome: cp.fornecedores?.nome_fantasia || cp.fornecedores?.razao_social,
    status: cp.status,
    numeroDocumento: cp.numero_documento || undefined,
  }));
}

export function converterContasReceberParaLancamentos(
  contasReceber: Array<{
    id: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    cliente_nome: string;
    status: string;
    numero_documento?: string | null;
    clientes?: { razao_social: string; nome_fantasia?: string | null } | null;
  }>
): LancamentoSistema[] {
  return contasReceber.map(cr => ({
    id: cr.id,
    tipo: 'receber' as const,
    descricao: cr.descricao,
    valor: cr.valor,
    dataVencimento: new Date(cr.data_vencimento),
    entidade: cr.cliente_nome,
    entidadeNome: cr.clientes?.nome_fantasia || cr.clientes?.razao_social,
    status: cr.status,
    numeroDocumento: cr.numero_documento || undefined,
  }));
}

// Get match statistics
export interface EstatisticasMatch {
  totalTransacoes: number;
  comSugestao: number;
  confiancaAlta: number;
  confiancaMedia: number;
  confiancaBaixa: number;
  semMatch: number;
  valorTotalMatcheado: number;
}

export function calcularEstatisticasMatch(
  transacoes: TransacaoOFX[],
  matches: Map<string, MatchSugestao[]>
): EstatisticasMatch {
  let confiancaAlta = 0;
  let confiancaMedia = 0;
  let confiancaBaixa = 0;
  let valorTotalMatcheado = 0;
  
  for (const transacao of transacoes) {
    const sugestoes = matches.get(transacao.id);
    if (sugestoes && sugestoes.length > 0) {
      const melhor = sugestoes[0];
      if (melhor.confianca === 'alta') {
        confiancaAlta++;
        valorTotalMatcheado += Math.abs(transacao.valor);
      } else if (melhor.confianca === 'media') {
        confiancaMedia++;
        valorTotalMatcheado += Math.abs(transacao.valor);
      } else {
        confiancaBaixa++;
      }
    }
  }
  
  return {
    totalTransacoes: transacoes.length,
    comSugestao: confiancaAlta + confiancaMedia + confiancaBaixa,
    confiancaAlta,
    confiancaMedia,
    confiancaBaixa,
    semMatch: transacoes.length - (confiancaAlta + confiancaMedia + confiancaBaixa),
    valorTotalMatcheado,
  };
}
