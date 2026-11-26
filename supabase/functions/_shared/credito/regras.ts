/**
 * Regras de alerta da análise de crédito da 1ª venda.
 *
 * Puro (sem rede, sem banco) para ser testado: recebe o retorno normalizado do
 * CNPJ.já (mesmo formato gravado em `cnpja_cache.data`) e o valor do pedido e
 * devolve os alertas que o analista precisa ver antes de aprovar venda a prazo.
 */

export interface DadosCnpjaResumo {
  situacaoCadastral?: string | null;
  dataAbertura?: string | null;
  capitalSocial?: number | null;
  porte?: string | null;
  meiOptante?: boolean;
  simplesOptante?: boolean;
  razaoSocial?: string;
  endereco?: { uf?: string } | null;
}

export type NivelAlerta = 'critico' | 'atencao' | 'info';

export interface AlertaCredito {
  codigo: string;
  nivel: NivelAlerta;
  mensagem: string;
}

const MESES_MINIMOS_ATIVIDADE = 12;

export function mesesDesde(dataIso: string | null | undefined, hoje = new Date()): number | null {
  if (!dataIso) return null;
  const inicio = new Date(dataIso);
  if (Number.isNaN(inicio.getTime())) return null;
  const meses =
    (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
  return hoje.getDate() < inicio.getDate() ? meses - 1 : meses;
}

export function avaliarAlertas(
  dados: DadosCnpjaResumo | null | undefined,
  valorPedido: number | null | undefined,
  hoje = new Date()
): AlertaCredito[] {
  const alertas: AlertaCredito[] = [];

  if (!dados) {
    alertas.push({
      codigo: 'cnpj_ausente',
      nivel: 'critico',
      mensagem: 'CNPJ não informado ou não consultado — pedir ao vendedor antes de decidir.',
    });
    return alertas;
  }

  const situacao = (dados.situacaoCadastral ?? '').trim().toLowerCase();
  if (situacao && situacao !== 'ativa') {
    alertas.push({
      codigo: 'situacao_cadastral',
      nivel: 'critico',
      mensagem: `Situação cadastral na Receita: ${dados.situacaoCadastral}.`,
    });
  }

  const meses = mesesDesde(dados.dataAbertura, hoje);
  if (meses !== null && meses < MESES_MINIMOS_ATIVIDADE) {
    alertas.push({
      codigo: 'empresa_recente',
      nivel: 'atencao',
      mensagem: `Empresa aberta há ${meses} mês(es) — menos de ${MESES_MINIMOS_ATIVIDADE} meses de atividade.`,
    });
  }

  if (dados.meiOptante) {
    alertas.push({
      codigo: 'mei',
      nivel: 'atencao',
      mensagem: 'Optante pelo MEI — faturamento limitado; avaliar prazo com cautela.',
    });
  }

  const capital = typeof dados.capitalSocial === 'number' ? dados.capitalSocial : null;
  const valor = typeof valorPedido === 'number' ? valorPedido : null;
  if (capital !== null && valor !== null && valor > 0 && capital < valor) {
    alertas.push({
      codigo: 'capital_menor_que_pedido',
      nivel: 'atencao',
      mensagem: `Capital social (R$ ${capital.toLocaleString('pt-BR')}) menor que o pedido (R$ ${valor.toLocaleString('pt-BR')}).`,
    });
  }

  return alertas;
}

/** Só dígitos; null quando não forma um CNPJ de 14 posições. */
export function normalizarCnpj(valor: string | null | undefined): string | null {
  const digitos = (valor ?? '').replace(/\D/g, '');
  if (digitos.length !== 14) return null;
  if (/^(\d)\1+$/.test(digitos)) return null;
  return digitos;
}
