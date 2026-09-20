import { createLinhaTracker, reg } from '../_shared/sped/push-helper.ts';
import { buildBloco9 } from '../_shared/sped/bloco9.ts';

export interface ContribuicoesEmpresa {
  cnpj: string | null;
  razao_social: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
}

export interface ContribuicoesApuracao {
  cbs_creditos?: number | null;
  cbs_debitos?: number | null;
  cbs_a_pagar?: number | null;
}

export interface EfdContribuicoesInput {
  empresa: ContribuicoesEmpresa;
  apuracao: ContribuicoesApuracao | null;
  ano: number;
  mes: number;
}

function pad(n: number, len: number) {
  return String(n).padStart(len, '0');
}
function fmtNum(n: number | null | undefined): string {
  return Number(n ?? 0)
    .toFixed(2)
    .replace('.', ',');
}
function fmtDate(d: Date): string {
  return `${pad(d.getDate(), 2)}${pad(d.getMonth() + 1, 2)}${d.getFullYear()}`;
}

/**
 * Monta as linhas do arquivo EFD-Contribuições a partir dos dados já
 * buscados no banco — função pura, sem I/O.
 *
 * Três correções da Etapa 40 em relação à versão anterior (que montava
 * tudo inline dentro do handler HTTP com `.join('|')` cru):
 *
 * 1. Passa a usar `createLinhaTracker` (`_shared/sped/push-helper.ts`),
 *    o mesmo padrão já usado em ECD/ECF, ganhando `blocoCount` de graça.
 * 2. `M990` (fechamento do bloco M) usa `blocoCount.get('M')` em vez do
 *    literal `5` cravado — que era o total de registros do bloco M só
 *    quando o `M100` condicional estava presente; sem ele o bloco tinha 4
 *    registros e o arquivo mentia sobre a própria contagem.
 * 3. O bloco 9 vem de `buildBloco9`, que substitui a dupla ausência
 *    anterior: o arquivo não tinha NENHUM registro `9900`, e `9990` era
 *    cravado em `2` (contando só `9001`+`9990`, nunca os `9900` que
 *    deveriam existir).
 */
export function buildEfdContribuicoesLinhas(input: EfdContribuicoesInput): string[] {
  const { empresa, apuracao, ano, mes } = input;
  const dtIni = new Date(ano, mes - 1, 1);
  const dtFim = new Date(ano, mes, 0);
  const cnpjLimpo = (empresa.cnpj ?? '').replace(/\D/g, '');

  const tracker = createLinhaTracker();
  const { push, blocoCount } = tracker;

  // 0000 — Abertura do arquivo
  push(
    reg(
      '0000',
      '006',
      '0',
      fmtDate(dtIni),
      fmtDate(dtFim),
      empresa.razao_social ?? '',
      cnpjLimpo,
      '',
      empresa.inscricao_estadual ?? '',
      empresa.inscricao_municipal ?? '',
      '0',
      '1'
    )
  );
  // 0001 — Abertura do bloco 0
  push(reg('0001', '0'));
  // 0140 — Estabelecimento
  push(
    reg(
      '0140',
      '001',
      empresa.razao_social ?? '',
      cnpjLimpo,
      empresa.inscricao_estadual ?? '',
      '',
      '',
      empresa.inscricao_municipal ?? ''
    )
  );
  // 0990 — Encerramento do bloco 0
  push(reg('0990', (blocoCount.get('0') || 0) + 1));

  // M001 — Abertura do bloco M
  push(reg('M001', '0'));

  // M100 — Crédito de PIS/Pasep (residual) — usando cbs_creditos como
  // proxy aproximado. Condicional: só existe quando há crédito a lançar.
  const temCredito = !!apuracao?.cbs_creditos && Number(apuracao.cbs_creditos) > 0;
  if (temCredito) {
    push(
      reg(
        'M100',
        '101',
        '0',
        '',
        fmtNum(apuracao!.cbs_creditos),
        fmtNum(0),
        fmtNum(0),
        '0',
        fmtNum(apuracao!.cbs_creditos),
        fmtNum(apuracao!.cbs_creditos),
        '',
        fmtNum(0),
        fmtNum(0)
      )
    );
  }

  // M200 — Consolidação da contribuição (CBS)
  push(
    reg(
      'M200',
      fmtNum(apuracao?.cbs_debitos),
      fmtNum(0),
      fmtNum(apuracao?.cbs_creditos),
      fmtNum(0),
      fmtNum(apuracao?.cbs_a_pagar),
      fmtNum(0),
      fmtNum(0),
      fmtNum(apuracao?.cbs_a_pagar)
    )
  );

  // M210 — Detalhamento por código
  push(
    reg(
      'M210',
      '01',
      fmtNum(apuracao?.cbs_debitos),
      fmtNum(apuracao?.cbs_debitos),
      '0,00',
      fmtNum(apuracao?.cbs_debitos),
      '0,00',
      '0,00',
      fmtNum(apuracao?.cbs_debitos),
      '0,00',
      '0,00',
      fmtNum(apuracao?.cbs_a_pagar)
    )
  );

  // M990 — Encerramento bloco M. Fix #2 da Etapa 40: dinâmico, não '5'.
  push(reg('M990', (blocoCount.get('M') || 0) + 1));

  // Bloco 9 — fix #3 da Etapa 40 (ver docstring acima).
  for (const linha of buildBloco9(tracker.linhas)) push(linha);
  push(reg('9999', tracker.linhas.length + 1));

  return tracker.linhas;
}
