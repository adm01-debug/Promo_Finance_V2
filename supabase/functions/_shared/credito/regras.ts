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

export type NivelAlerta = "critico" | "atencao" | "info";

export interface AlertaCredito {
  codigo: string;
  nivel: NivelAlerta;
  mensagem: string;
}

const MESES_MINIMOS_ATIVIDADE = 12;

export function mesesDesde(
  dataIso: string | null | undefined,
  hoje = new Date(),
): number | null {
  if (!dataIso) return null;
  const inicio = new Date(dataIso);
  if (Number.isNaN(inicio.getTime())) return null;
  const meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 +
    (hoje.getMonth() - inicio.getMonth());
  return hoje.getDate() < inicio.getDate() ? meses - 1 : meses;
}

export function avaliarAlertas(
  dados: DadosCnpjaResumo | null | undefined,
  valorPedido: number | null | undefined,
  hoje = new Date(),
): AlertaCredito[] {
  const alertas: AlertaCredito[] = [];

  if (!dados) {
    alertas.push({
      codigo: "cnpj_ausente",
      nivel: "critico",
      mensagem:
        "CNPJ não informado ou não consultado — pedir ao vendedor antes de decidir.",
    });
    return alertas;
  }

  const situacao = (dados.situacaoCadastral ?? "").trim().toLowerCase();
  if (situacao && situacao !== "ativa") {
    alertas.push({
      codigo: "situacao_cadastral",
      nivel: "critico",
      mensagem: `Situação cadastral na Receita: ${dados.situacaoCadastral}.`,
    });
  }

  const meses = mesesDesde(dados.dataAbertura, hoje);
  if (meses !== null && meses < MESES_MINIMOS_ATIVIDADE) {
    alertas.push({
      codigo: "empresa_recente",
      nivel: "atencao",
      mensagem:
        `Empresa aberta há ${meses} mês(es) — menos de ${MESES_MINIMOS_ATIVIDADE} meses de atividade.`,
    });
  }

  if (dados.meiOptante) {
    alertas.push({
      codigo: "mei",
      nivel: "atencao",
      mensagem:
        "Optante pelo MEI — faturamento limitado; avaliar prazo com cautela.",
    });
  }

  const capital = typeof dados.capitalSocial === "number"
    ? dados.capitalSocial
    : null;
  const valor = typeof valorPedido === "number" ? valorPedido : null;
  if (capital !== null && valor !== null && valor > 0 && capital < valor) {
    alertas.push({
      codigo: "capital_menor_que_pedido",
      nivel: "atencao",
      mensagem: `Capital social (R$ ${
        capital.toLocaleString("pt-BR")
      }) menor que o pedido (R$ ${valor.toLocaleString("pt-BR")}).`,
    });
  }

  return alertas;
}

/** Só dígitos; null quando não forma um CNPJ de 14 posições. */
export function normalizarCnpj(
  valor: string | null | undefined,
): string | null {
  const digitos = (valor ?? "").replace(/\D/g, "");
  if (digitos.length !== 14) return null;
  if (/^(\d)\1+$/.test(digitos)) return null;
  return digitos;
}

/** CNPJ com máscara (XX.XXX.XXX/XXXX-XX) — o cadastro de clientes grava assim. */
export function formatarCnpj(cnpj: string): string {
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

/** Filtro PostgREST `.or()` que casa `clientes.cnpj_cpf` gravado com ou sem máscara. */
export function filtroCnpjCliente(cnpj: string): string {
  return `cnpj_cpf.eq."${cnpj}",cnpj_cpf.eq."${formatarCnpj(cnpj)}"`;
}

/**
 * O vínculo com um cadastro de cliente veio do CNPJ anterior e precisa ser
 * refeito: senão a aprovação grava o limite no cliente errado depois de o
 * analista corrigir o CNPJ. Vínculo que não aponta para o CNPJ antigo (casado
 * por e-mail, ou cliente pessoa física) é preservado.
 */
export function vinculoDesatualizado(
  cnpjDoClienteVinculado: string | null | undefined,
  cnpjAnterior: string | null | undefined,
  cnpjNovo: string | null | undefined,
): boolean {
  const anterior = normalizarCnpj(cnpjAnterior ?? null);
  const novo = normalizarCnpj(cnpjNovo ?? null);
  if (!anterior || !novo || anterior === novo) return false;
  return normalizarCnpj(cnpjDoClienteVinculado ?? null) === anterior;
}

/**
 * Onde o limite aprovado pode ser gravado quando o cadastro veio do vínculo
 * por e-mail (a análise não achou o cliente pelo CNPJ):
 * - `gravar`: cadastro sem CNPJ ou com o mesmo CNPJ da análise;
 * - `conflito`: cadastro guarda outro CNPJ e a análise não tem CNPJ — sem
 *   documento não há como confirmar que é o mesmo cliente, então quem decide
 *   (recusar e pedir o CNPJ, ou desvincular) é o analista;
 * - `sem_destino`: cadastro de outra empresa, ou documento diferente com a
 *   análise já tendo CNPJ (nesse caso o limite segue pelo CNPJ da análise).
 */
export function destinoDoLimiteVinculo(params: {
  cnpjAnalise: string | null | undefined;
  documentoVinculo: string | null | undefined;
  empresaAnalise: string | null | undefined;
  empresaVinculo: string | null | undefined;
}): "gravar" | "conflito" | "sem_destino" {
  const cnpj = normalizarCnpj(params.cnpjAnalise ?? null) ?? null;
  const documento = normalizarCnpj(params.documentoVinculo ?? null) ?? "";
  if (documento.length === 14 && documento !== cnpj) {
    return cnpj ? "sem_destino" : "conflito";
  }
  if (
    params.empresaAnalise &&
    params.empresaVinculo &&
    params.empresaVinculo !== params.empresaAnalise
  ) {
    return "sem_destino";
  }
  return "gravar";
}

/**
 * Aprovar com limite só passa quando existe destino para gravá-lo: o CNPJ da
 * análise, ou um cadastro vinculado que não guarde outro CNPJ (documento
 * nenhum ou CPF). Sem destino o Champions receberia um crédito que a base não
 * tem, e o analista não teria como corrigir depois — a fila não reaplica.
 */
export function bloqueioParaAprovarComLimite(params: {
  cnpjAnalise: string | null | undefined;
  clienteId: string | null | undefined;
  documentoVinculo: string | null | undefined;
}): "cnpj_necessario_limite" | null {
  if (normalizarCnpj(params.cnpjAnalise ?? null)) return null;
  if (!params.clienteId) return "cnpj_necessario_limite";
  const documento = normalizarCnpj(params.documentoVinculo ?? null) ?? "";
  return documento.length === 14 ? "cnpj_necessario_limite" : null;
}

/**
 * O mesmo CNPJ pode estar cadastrado em mais de uma empresa (o formulário de
 * clientes permite). O cadastro da empresa da análise vem primeiro: é o que o
 * analista enxerga e o único que ele pode mover para a fila; sem candidato
 * nessa empresa, o primeiro cadastro encontrado.
 */
export function escolherCadastroDoCnpj<T extends { empresa_id: string | null }>(
  candidatos: readonly T[],
  empresaDaAnalise: string | null | undefined,
): T | null {
  if (candidatos.length === 0) return null;
  if (empresaDaAnalise) {
    const mesmoEscopo = candidatos.find((c) =>
      c.empresa_id === empresaDaAnalise
    );
    if (mesmoEscopo) return mesmoEscopo;
  }
  return candidatos[0];
}
