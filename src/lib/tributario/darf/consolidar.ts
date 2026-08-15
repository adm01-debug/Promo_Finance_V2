import { CODIGOS_RECEITA, VALOR_MINIMO_DARF, VALOR_MINIMO_QUOTA, buscarCodigo } from './tabelas';
import {
  calcularAcrescimos,
  calcularVencimento,
  parsePeriodo,
  round2,
  selicAcumulada,
  somarMeses,
} from './vencimento';
import type {
  DarfConsolidado,
  ParametrosConsolidacao,
  QuotaDarf,
  ResultadoConsolidacao,
} from './types';

interface Bucket {
  codigo: string;
  periodoApuracao: string;
  principal: number;
  origens: string[];
}

function chave(codigo: string, periodo: string): string {
  return `${codigo}|${periodo}`;
}

/** Divide IRPJ/CSLL trimestral em até 3 quotas com juros SELIC (Lei 9.430/96, art. 5º). */
function montarQuotas(
  principal: number,
  vencimento: string,
  selicMensal: Readonly<Record<string, number>> | undefined,
  padrao: number | undefined,
): readonly QuotaDarf[] {
  if (principal < 2 * VALOR_MINIMO_QUOTA) return [];
  const maxQuotas = Math.min(3, Math.floor(principal / VALOR_MINIMO_QUOTA));
  if (maxQuotas < 2) return [];
  const valorQuota = round2(principal / maxQuotas);
  const quotas: QuotaDarf[] = [];
  let alocado = 0;
  for (let i = 0; i < maxQuotas; i += 1) {
    const ultima = i === maxQuotas - 1;
    const valor = ultima ? round2(principal - alocado) : valorQuota;
    alocado = round2(alocado + valor);
    const compVenc = somarMeses(vencimento.slice(0, 7), i);
    const [ano, mes] = parsePeriodo(compVenc);
    const dataQuota = calcularVencimento(
      `${String(ano).padStart(4, '0')}-${String(mes - 1 === 0 ? 12 : mes - 1).padStart(2, '0')}`,
      'ultimo_dia_util_mes_seguinte',
    );
    // 1ª quota sem juros; demais com SELIC acumulada + 1% no mês do pagamento.
    const percentual = i === 0 ? 0 : selicAcumulada(vencimento, dataQuota, selicMensal, padrao);
    const juros = round2(valor * percentual);
    quotas.push({
      numero: i + 1,
      vencimento: dataQuota,
      principal: valor,
      jurosSelic: juros,
      total: round2(valor + juros),
    });
  }
  return quotas;
}

/**
 * Consolida débitos apurados em DARFs por código de receita e competência.
 *
 * Regras aplicadas:
 * - Soma de débitos do mesmo código/competência (IN RFB 2.055/2021).
 * - DARF inferior a R$ 10,00 é diferido e somado ao período seguinte do mesmo
 *   código (Lei 9.430/96, art. 68).
 * - Vencimento antecipado para o dia útil anterior quando cair em dia não útil.
 * - Multa de mora de 0,33%/dia (teto 20%) e juros SELIC + 1% quando em atraso.
 */
export function consolidarDarf(params: ParametrosConsolidacao): ResultadoConsolidacao {
  const { debitos, dataPagamento, selicMensal, selicPadraoMensal, parcelarEmQuotas } = params;

  const buckets = new Map<string, Bucket>();
  for (const d of debitos) {
    if (!Number.isFinite(d.principal) || d.principal <= 0) continue;
    parsePeriodo(d.periodoApuracao); // valida cedo
    const k = chave(d.codigo, d.periodoApuracao);
    const existente = buckets.get(k);
    if (existente) {
      existente.principal = round2(existente.principal + d.principal);
      if (d.origem) existente.origens.push(d.origem);
    } else {
      buckets.set(k, {
        codigo: d.codigo,
        periodoApuracao: d.periodoApuracao,
        principal: round2(d.principal),
        origens: d.origem ? [d.origem] : [],
      });
    }
  }

  // Agrupa por código e ordena por competência para aplicar a regra dos R$ 10,00.
  const porCodigo = new Map<string, Bucket[]>();
  for (const b of buckets.values()) {
    const lista = porCodigo.get(b.codigo) ?? [];
    lista.push(b);
    porCodigo.set(b.codigo, lista);
  }

  const darfs: DarfConsolidado[] = [];
  const diferidos: DarfConsolidado[] = [];

  for (const [codigo, lista] of porCodigo) {
    lista.sort((a, b) => a.periodoApuracao.localeCompare(b.periodoApuracao));
    const meta = buscarCodigo(codigo);
    let arrastado = 0;
    const origensArrastadas: string[] = [];

    lista.forEach((bucket, indice) => {
      const principalPeriodo = bucket.principal;
      const principal = round2(principalPeriodo + arrastado);
      const observacoes: string[] = [];
      const origens = [...origensArrastadas, ...bucket.origens];

      if (!meta) {
        observacoes.push(`Código de receita ${codigo} não catalogado — validar na tabela da RFB.`);
      }
      if (arrastado > 0) {
        observacoes.push(
          `Inclui R$ ${arrastado.toFixed(2)} diferidos de competências anteriores (Lei 9.430/96, art. 68).`,
        );
      }

      const regra = meta?.regraVencimento ?? 'ultimo_dia_util_mes_seguinte';
      const vencimento = calcularVencimento(bucket.periodoApuracao, regra);
      const ultimo = indice === lista.length - 1;

      if (principal < VALOR_MINIMO_DARF) {
        const registro: DarfConsolidado = {
          codigo,
          tributo: meta?.tributo ?? 'IRPJ',
          descricao: meta?.descricao ?? `Código ${codigo}`,
          periodoApuracao: bucket.periodoApuracao,
          principal,
          principalAcumulado: arrastado,
          vencimento,
          acrescimos: {
            diasAtraso: 0,
            multaMora: 0,
            percentualMulta: 0,
            juros: 0,
            percentualJuros: 0,
          },
          total: principal,
          quotas: [],
          origens,
          observacoes: [
            ...observacoes,
            `Valor inferior a R$ ${VALOR_MINIMO_DARF.toFixed(2)}: recolhimento diferido para a competência seguinte do mesmo código.`,
          ],
        };
        if (ultimo) {
          diferidos.push(registro);
        } else {
          arrastado = principal;
          origensArrastadas.length = 0;
          origensArrastadas.push(...origens);
        }
        return;
      }

      arrastado = 0;
      origensArrastadas.length = 0;

      const acrescimos = calcularAcrescimos({
        principal,
        vencimento,
        dataPagamento: dataPagamento ?? vencimento,
        selicMensal,
        selicPadraoMensal,
      });

      const quotas =
        parcelarEmQuotas && meta?.permiteQuotas && acrescimos.diasAtraso === 0
          ? montarQuotas(principal, vencimento, selicMensal, selicPadraoMensal)
          : [];

      if (parcelarEmQuotas && meta?.permiteQuotas && quotas.length === 0) {
        observacoes.push(
          `Quota mínima de R$ ${VALOR_MINIMO_QUOTA.toFixed(2)} não atingida — recolhimento em cota única.`,
        );
      }

      darfs.push({
        codigo,
        tributo: meta?.tributo ?? 'IRPJ',
        descricao: meta?.descricao ?? `Código ${codigo}`,
        periodoApuracao: bucket.periodoApuracao,
        principal,
        principalAcumulado: round2(principal - principalPeriodo),
        vencimento,
        acrescimos,
        total: round2(principal + acrescimos.multaMora + acrescimos.juros),
        quotas,
        origens,
        observacoes,
      });
    });
  }

  darfs.sort(
    (a, b) =>
      a.vencimento.localeCompare(b.vencimento) ||
      a.codigo.localeCompare(b.codigo) ||
      a.periodoApuracao.localeCompare(b.periodoApuracao),
  );

  const totalPrincipal = round2(darfs.reduce((s, d) => s + d.principal, 0));
  const totalAcrescimos = round2(
    darfs.reduce((s, d) => s + d.acrescimos.multaMora + d.acrescimos.juros, 0),
  );

  return {
    darfs,
    diferidos,
    totalPrincipal,
    totalAcrescimos,
    totalGeral: round2(totalPrincipal + totalAcrescimos),
  };
}

/** Exporta a consolidação em CSV para conferência/ECF. */
export function exportarDarfCsv(resultado: ResultadoConsolidacao): string {
  const cab = [
    'codigo',
    'tributo',
    'descricao',
    'periodo_apuracao',
    'vencimento',
    'principal',
    'multa',
    'juros',
    'total',
  ].join(';');
  const linhas = resultado.darfs.map((d) =>
    [
      d.codigo,
      d.tributo,
      `"${d.descricao.replace(/"/g, '""')}"`,
      d.periodoApuracao,
      d.vencimento,
      d.principal.toFixed(2),
      d.acrescimos.multaMora.toFixed(2),
      d.acrescimos.juros.toFixed(2),
      d.total.toFixed(2),
    ].join(';'),
  );
  return [cab, ...linhas].join('\n');
}

export { CODIGOS_RECEITA };
