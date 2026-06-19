/**
 * recomendarEmpresa — motor de sugestão do CNPJ ideal para uma operação.
 *
 * Pontua cada empresa vinculada do grupo considerando:
 *  - Regime tributário adequado ao tipo de operação (venda/compra, serviço/produto)
 *  - Disponibilidade de crédito ICMS (Lucro Real/Presumido) para compras com IPI/ICMS
 *  - Margem do Simples por anexo (quando aplicável)
 *  - Limite de faturamento (RBT12 < R$ 4.8M no Simples)
 *  - Histórico recente de operações com aquele cliente/fornecedor (peso de continuidade)
 *
 * NÃO depende de chamadas de rede — é puro e determinístico, ideal
 * para testes unitários e execução síncrona no formulário.
 */
import type { RegimeTributario } from './types';

export type TipoOperacao = 'venda_produto' | 'venda_servico' | 'compra_produto' | 'compra_servico';

export interface EmpresaCandidata {
  id: string;
  nome: string;
  cnpj: string;
  regime: RegimeTributario;
  /** RBT12 atual em reais (faturamento acumulado 12m) — só relevante p/ Simples */
  rbt12?: number;
  /** Crédito acumulado de ICMS em reais (Lucro Real/Presumido) */
  creditoIcms?: number;
  /** Margem média histórica em % */
  margemMedia?: number;
  /** Empresa está ativa */
  ativa?: boolean;
}

export interface ContextoOperacao {
  tipo: TipoOperacao;
  valor: number;
  /** UF de destino (venda) ou origem (compra) */
  uf?: string;
  /** NCM do produto, quando aplicável */
  ncm?: string;
  /** ID do cliente/fornecedor — usado p/ peso de histórico */
  contraparteId?: string;
  /** Mapa contraparteId → empresaId mais usada nos últimos 90 dias */
  historico?: Record<string, string>;
}

export interface RecomendacaoEmpresa {
  empresaId: string;
  score: number;
  motivos: string[];
  alertas: string[];
}

const LIMITE_SIMPLES = 4_800_000;
const LIMITE_SIMPLES_ALERTA = 4_320_000; // 90% — janela de risco de desenquadramento

/** Pontua uma empresa candidata para um contexto de operação. 0..100 */
export function pontuarEmpresa(emp: EmpresaCandidata, ctx: ContextoOperacao): RecomendacaoEmpresa {
  const motivos: string[] = [];
  const alertas: string[] = [];
  let score = 50; // base neutra

  if (emp.ativa === false) {
    return { empresaId: emp.id, score: 0, motivos: [], alertas: ['Empresa inativa'] };
  }

  // 1) Regime × tipo de operação
  const isServico = ctx.tipo === 'venda_servico' || ctx.tipo === 'compra_servico';
  const isVenda = ctx.tipo.startsWith('venda_');
  const isCompra = ctx.tipo.startsWith('compra_');

  if (isServico && emp.regime === 'simples_nacional') {
    score += 15;
    motivos.push('Simples Nacional é vantajoso para prestação de serviços de baixo a médio porte');
  }
  if (!isServico && emp.regime === 'lucro_real') {
    score += 10;
    motivos.push('Lucro Real permite aproveitamento integral de créditos não-cumulativos');
  }
  if (!isServico && emp.regime === 'lucro_presumido' && ctx.valor < 50_000) {
    score += 8;
    motivos.push('Lucro Presumido com presunção fixa simplifica operações de menor valor');
  }

  // 2) Crédito de ICMS em compras de produto
  if (isCompra && !isServico) {
    if (emp.regime === 'lucro_real' || emp.regime === 'lucro_presumido') {
      score += 12;
      motivos.push('Regime permite crédito de ICMS na entrada');
      if ((emp.creditoIcms ?? 0) > 10_000) {
        score -= 5;
        alertas.push(`Crédito ICMS acumulado alto (R$ ${(emp.creditoIcms ?? 0).toLocaleString('pt-BR')}) — avaliar uso prioritário`);
      }
    } else if (emp.regime === 'simples_nacional') {
      score -= 10;
      alertas.push('Simples Nacional não permite crédito de ICMS — cliente não pode se creditar');
    }
  }

  // 3) RBT12 (Simples)
  if (emp.regime === 'simples_nacional' && emp.rbt12 !== undefined) {
    const projecao = emp.rbt12 + (isVenda ? ctx.valor : 0);
    if (projecao > LIMITE_SIMPLES) {
      score -= 40;
      alertas.push(`Operação ultrapassaria limite do Simples (R$ ${LIMITE_SIMPLES.toLocaleString('pt-BR')}) — desenquadramento iminente`);
    } else if (projecao > LIMITE_SIMPLES_ALERTA) {
      score -= 15;
      alertas.push(`Próximo do teto do Simples (${((projecao / LIMITE_SIMPLES) * 100).toFixed(1)}%)`);
    } else {
      score += 5;
      motivos.push('Faixa de faturamento confortável dentro do Simples');
    }
  }

  // 4) Histórico de continuidade com a contraparte
  if (ctx.contraparteId && ctx.historico && ctx.historico[ctx.contraparteId] === emp.id) {
    score += 10;
    motivos.push('Histórico recente de operações com esta contraparte');
  }

  // 5) Margem média (proxy de saúde operacional)
  if (emp.margemMedia !== undefined && emp.margemMedia > 15) {
    score += 3;
  }

  // Clamp 0..100
  score = Math.max(0, Math.min(100, score));
  return { empresaId: emp.id, score, motivos, alertas };
}

/** Ordena candidatas pela recomendação. Retorna ranking decrescente. */
export function recomendarEmpresa(
  candidatas: EmpresaCandidata[],
  ctx: ContextoOperacao,
): RecomendacaoEmpresa[] {
  return candidatas
    .map((emp) => pontuarEmpresa(emp, ctx))
    .sort((a, b) => b.score - a.score);
}
