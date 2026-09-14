import { createLinhaTracker, reg } from '../_shared/sped/push-helper.ts';
import { buildBloco9 } from '../_shared/sped/bloco9.ts';

export interface EcfEmpresa {
  cnpj: string;
  razao_social: string;
  estado?: string;
  inscricao_estadual?: string;
}
export interface EcfConta {
  id: string;
  codigo: string;
  nome: string | null;
  descricao: string;
  natureza: string;
  tipo: string;
  codigo_referencial: string | null;
}
export interface EcfPartida {
  conta_id: string;
  tipo: 'D' | 'C';
  valor: number;
}
export interface EcfLancamento {
  id: string;
  numero_lancamento: number;
  data_lancamento: string;
  historico: string;
  valor_total: number;
  partidas: EcfPartida[];
}
export interface EcdReferencia {
  recibo_transmissao: string | null;
}

export interface EcfInput {
  empresa: EcfEmpresa;
  plano: EcfConta[];
  lancamentos: EcfLancamento[];
  ano_calendario: number;
  periodo_inicio: string;
  periodo_fim: string;
  ecdAnterior: EcdReferencia | null;
}

export interface EcfApuracao {
  lucro_liquido: number;
  base_irpj: number;
  irpj: number;
  csll: number;
}

const fmtData = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
};
const fmtNum = (v: number) => v.toFixed(2).replace('.', ',');
const cleanCnpj = (c: string) => c.replace(/\D/g, '');

/**
 * Reproduz a apuração de IRPJ/CSLL que o handler já calculava antes de
 * montar o TXT — extraída aqui só para que `buildEcfLinhas` seja pura e
 * não recalcule os mesmos números duas vezes.
 */
export function calcularApuracaoEcf(input: Pick<EcfInput, 'plano' | 'lancamentos'>): EcfApuracao {
  const { plano, lancamentos } = input;
  const naturezaDe = (cid: string) => plano.find((c) => c.id === cid)?.natureza;
  const receitas = lancamentos
    .flatMap((l) => l.partidas)
    .filter((p) => naturezaDe(p.conta_id) === 'receita')
    .reduce((s, p) => s + (p.tipo === 'C' ? Number(p.valor) : -Number(p.valor)), 0);
  const despesas = lancamentos
    .flatMap((l) => l.partidas)
    .filter((p) => naturezaDe(p.conta_id) === 'despesa')
    .reduce((s, p) => s + (p.tipo === 'D' ? Number(p.valor) : -Number(p.valor)), 0);
  const lucro_liquido = receitas - despesas;
  const base_irpj = Math.max(0, lucro_liquido);
  const irpj = base_irpj * 0.15 + Math.max(0, base_irpj - 240000) * 0.1;
  const csll = base_irpj * 0.09;
  return { lucro_liquido, base_irpj, irpj, csll };
}

/**
 * Monta as linhas do arquivo SPED ECF (Escrituração Contábil Fiscal) a
 * partir dos dados já buscados no banco — função pura, sem I/O.
 *
 * Única correção da Etapa 40: o bloco 9 vem de `buildBloco9`
 * (`_shared/sped/bloco9.ts`) em vez de uma lista `['0','C','J','K','L','M',
 * 'N']` cravada que nunca cobria `0010`, `0020`, `0030`, `C040`, `J050`,
 * `J051`, `J100`, `K030`, `K355`, `L030`, `L100`, `L210`, `L300`, `M010`,
 * `M300`, `M350`, `N500`, `N620`, `N650`. Não há defeito de ordenação de
 * registro-filho como no ECD: `J051` já é emitido dentro do mesmo loop
 * logo após o único `J050` do arquivo (não há um `J050` por conta).
 */
export function buildEcfLinhas(input: EcfInput): string[] {
  const { empresa, plano, lancamentos, ano_calendario, periodo_inicio, periodo_fim, ecdAnterior } =
    input;
  const tracker = createLinhaTracker();
  const { push, blocoCount } = tracker;

  const idToCodigo = new Map(plano.map((c) => [c.id, c.codigo]));
  const { lucro_liquido, base_irpj, irpj, csll } = calcularApuracaoEcf({ plano, lancamentos });

  push(
    reg(
      '0000',
      'LECF',
      '0010',
      ano_calendario,
      cleanCnpj(empresa.cnpj),
      empresa.razao_social,
      '',
      fmtData(periodo_inicio),
      fmtData(periodo_fim),
      '0',
      '0',
      'N',
      'N',
      'N'
    )
  );
  push(reg('0001', '0'));
  push(reg('0010', 'A', '1', 'L', '01', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'));
  push(reg('0020', '0', '0', '0', '0', '', '', '', '', ''));
  push(
    reg(
      '0030',
      empresa.estado || 'SP',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      empresa.inscricao_estadual || ''
    )
  );
  push(reg('0990', (blocoCount.get('0') || 0) + 1));

  push(reg('C001', '0'));
  push(
    reg(
      'C040',
      'G',
      ecdAnterior?.recibo_transmissao || '',
      fmtData(periodo_inicio),
      fmtData(periodo_fim)
    )
  );
  push(reg('C990', (blocoCount.get('C') || 0) + 1));

  push(reg('J001', '0'));
  push(reg('J050', fmtData(periodo_inicio), '01'));
  for (const c of plano.filter((p) => p.tipo === 'analitica' && p.codigo_referencial)) {
    push(reg('J051', c.codigo_referencial!, c.nome || c.descricao, c.codigo));
  }
  push(reg('J100', '01', ano_calendario, 'N'));
  push(reg('J990', (blocoCount.get('J') || 0) + 1));

  push(reg('K001', '0'));
  push(reg('K030', fmtData(periodo_inicio), fmtData(periodo_fim), 'A', 'A'));
  for (const c of plano.filter((p) => ['receita', 'despesa', 'resultado'].includes(p.natureza))) {
    const total = lancamentos
      .flatMap((l) => l.partidas)
      .filter((p) => idToCodigo.get(p.conta_id) === c.codigo)
      .reduce((s, p) => s + (p.tipo === 'C' ? Number(p.valor) : -Number(p.valor)), 0);
    if (total === 0) continue;
    push(
      reg(
        'K355',
        c.codigo,
        c.codigo_referencial || '',
        fmtNum(Math.abs(total)),
        total >= 0 ? 'C' : 'D'
      )
    );
  }
  push(reg('K990', (blocoCount.get('K') || 0) + 1));

  push(reg('L001', '0'));
  push(reg('L030', fmtData(periodo_inicio), fmtData(periodo_fim), 'A'));
  for (const c of plano.filter((p) => ['ativo', 'passivo', 'patrimonio'].includes(p.natureza))) {
    const saldo = lancamentos
      .flatMap((l) => l.partidas)
      .filter((p) => idToCodigo.get(p.conta_id) === c.codigo)
      .reduce((s, p) => s + (p.tipo === 'D' ? Number(p.valor) : -Number(p.valor)), 0);
    if (saldo === 0) continue;
    push(
      reg(
        'L100',
        c.codigo,
        c.codigo_referencial || '',
        c.nome || c.descricao,
        fmtNum(Math.abs(saldo)),
        saldo >= 0 ? 'D' : 'C'
      )
    );
  }
  for (const c of plano.filter((p) => ['receita', 'despesa'].includes(p.natureza))) {
    const total = lancamentos
      .flatMap((l) => l.partidas)
      .filter((p) => idToCodigo.get(p.conta_id) === c.codigo)
      .reduce((s, p) => s + (p.tipo === 'C' ? Number(p.valor) : -Number(p.valor)), 0);
    if (total === 0) continue;
    push(reg('L210', c.codigo, c.nome || c.descricao, fmtNum(Math.abs(total))));
  }
  push(reg('L300', '01', 'LUCRO LIQUIDO DO EXERCICIO', fmtNum(lucro_liquido)));
  push(reg('L990', (blocoCount.get('L') || 0) + 1));

  push(reg('M001', '0'));
  push(reg('M010', '01', 'LUCRO REAL', fmtData(periodo_inicio), fmtData(periodo_fim)));
  push(reg('M300', '01', 'LUCRO LIQUIDO', fmtNum(lucro_liquido), 'P'));
  push(reg('M300', '04', 'BASE CALCULO IRPJ', fmtNum(base_irpj), 'P'));
  push(reg('M350', '01', 'BASE CALCULO CSLL', fmtNum(base_irpj), 'P'));
  push(reg('M990', (blocoCount.get('M') || 0) + 1));

  push(reg('N001', '0'));
  push(reg('N500', '01', ano_calendario, fmtNum(base_irpj)));
  push(reg('N620', '01', fmtNum(irpj)));
  push(reg('N650', '01', fmtNum(csll)));
  push(reg('N990', (blocoCount.get('N') || 0) + 1));

  for (const linha of buildBloco9(tracker.linhas)) push(linha);
  push(reg('9999', tracker.linhas.length + 1));

  return tracker.linhas;
}
