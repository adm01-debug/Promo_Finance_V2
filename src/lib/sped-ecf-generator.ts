// ============================================
// SPED ECF - Escrituração Contábil Fiscal
// Layout 10 (versão 2024)
// ============================================

import type { EmpresaECD, ContaPlano, LancamentoECD, ValidacaoSPED } from './sped-ecd-generator';

export interface ApuracaoIRPJCSLL {
  lucro_liquido: number;
  adicoes: number;
  exclusoes: number;
  base_calculo_irpj: number;
  irpj_devido: number;
  base_calculo_csll: number;
  csll_devida: number;
}

const fmtData = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
};
const fmtNum = (v: number) => v.toFixed(2).replace('.', ',');
const cleanCnpj = (c: string) => c.replace(/\D/g, '');

function reg(...campos: (string | number)[]): string {
  return '|' + campos.map(c => (c === null || c === undefined ? '' : String(c))).join('|') + '|';
}

export function gerarSPED_ECF(
  empresa: EmpresaECD,
  anoCalendario: number,
  plano: ContaPlano[],
  lancamentos: LancamentoECD[],
  apuracao: ApuracaoIRPJCSLL,
  reciboECD?: string,
): string {
  const periodoInicio = `${anoCalendario}-01-01`;
  const periodoFim = `${anoCalendario}-12-31`;
  const linhas: string[] = [];
  const blocoCount = new Map<string, number>();

  const push = (l: string) => {
    linhas.push(l);
    const tipo = l.split('|')[1];
    if (tipo) {
      const bloco = tipo[0];
      blocoCount.set(bloco, (blocoCount.get(bloco) || 0) + 1);
    }
  };

  // Bloco 0
  push(reg('0000', 'LECF', '0010', anoCalendario, cleanCnpj(empresa.cnpj),
    empresa.razao_social, '', fmtData(periodoInicio), fmtData(periodoFim), '0', '0', 'N', 'N', 'N'));
  push(reg('0001', '0'));
  push(reg('0010', 'A', '1', 'L', '01', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'));
  push(reg('0020', '0', '0', '0', '0', '', '', '', '', ''));
  push(reg('0030', empresa.uf || 'SP', '', '', '', '', '', empresa.cod_municipio || '', '', empresa.ie || ''));
  push(reg('0990', blocoCount.get('0')! + 1));

  // Bloco C - recuperação ECD
  push(reg('C001', '0'));
  push(reg('C040', 'G', reciboECD || '', fmtData(periodoInicio), fmtData(periodoFim)));
  push(reg('C990', blocoCount.get('C')! + 1));

  // Bloco J - plano de contas referencial
  push(reg('J001', '0'));
  push(reg('J050', fmtData(periodoInicio), '01'));
  for (const c of plano.filter(p => p.tipo === 'analitica' && p.codigo_referencial)) {
    push(reg('J051', c.codigo_referencial!, c.nome, c.codigo));
  }
  push(reg('J100', '01', anoCalendario, 'N'));
  push(reg('J990', blocoCount.get('J')! + 1));

  // Bloco K - saldos contábeis
  push(reg('K001', '0'));
  push(reg('K030', fmtData(periodoInicio), fmtData(periodoFim), 'A', 'A'));
  for (const c of plano.filter(p => ['receita', 'despesa', 'resultado'].includes(p.natureza))) {
    const total = lancamentos.flatMap(l => l.partidas).filter(p => p.conta_codigo === c.codigo)
      .reduce((s, p) => s + (p.tipo === 'C' ? p.valor : -p.valor), 0);
    if (total === 0) continue;
    push(reg('K355', c.codigo, c.codigo_referencial || '', fmtNum(Math.abs(total)),
      total >= 0 ? 'C' : 'D'));
  }
  push(reg('K990', blocoCount.get('K')! + 1));

  // Bloco L - DRE/BP
  push(reg('L001', '0'));
  push(reg('L030', fmtData(periodoInicio), fmtData(periodoFim), 'A'));

  // L100 - Balanço
  for (const c of plano.filter(p => ['ativo', 'passivo', 'patrimonio'].includes(p.natureza))) {
    const saldo = lancamentos.flatMap(l => l.partidas).filter(p => p.conta_codigo === c.codigo)
      .reduce((s, p) => s + (p.tipo === 'D' ? p.valor : -p.valor), 0);
    if (saldo === 0) continue;
    push(reg('L100', c.codigo, c.codigo_referencial || '', c.nome,
      fmtNum(Math.abs(saldo)), saldo >= 0 ? 'D' : 'C'));
  }

  // L200 - DRE
  for (const c of plano.filter(p => ['receita', 'despesa'].includes(p.natureza))) {
    const total = lancamentos.flatMap(l => l.partidas).filter(p => p.conta_codigo === c.codigo)
      .reduce((s, p) => s + (p.tipo === 'C' ? p.valor : -p.valor), 0);
    if (total === 0) continue;
    push(reg('L210', c.codigo, c.nome, fmtNum(Math.abs(total))));
  }
  push(reg('L300', '01', 'LUCRO LIQUIDO DO EXERCICIO', fmtNum(apuracao.lucro_liquido)));
  push(reg('L990', blocoCount.get('L')! + 1));

  // Bloco M - LALUR / LACS
  push(reg('M001', '0'));
  push(reg('M010', '01', 'LUCRO REAL', fmtData(periodoInicio), fmtData(periodoFim)));
  push(reg('M300', '01', 'LUCRO LIQUIDO', fmtNum(apuracao.lucro_liquido), 'P'));
  if (apuracao.adicoes > 0) push(reg('M300', '02', 'ADICOES', fmtNum(apuracao.adicoes), 'P'));
  if (apuracao.exclusoes > 0) push(reg('M300', '03', 'EXCLUSOES', fmtNum(apuracao.exclusoes), 'N'));
  push(reg('M300', '04', 'BASE CALCULO IRPJ', fmtNum(apuracao.base_calculo_irpj), 'P'));
  push(reg('M350', '01', 'BASE CALCULO CSLL', fmtNum(apuracao.base_calculo_csll), 'P'));
  push(reg('M990', blocoCount.get('M')! + 1));

  // Bloco N - cálculo IRPJ/CSLL
  push(reg('N001', '0'));
  push(reg('N500', '01', anoCalendario, fmtNum(apuracao.base_calculo_irpj)));
  push(reg('N620', '01', fmtNum(apuracao.irpj_devido)));
  push(reg('N650', '01', fmtNum(apuracao.csll_devida)));
  push(reg('N990', blocoCount.get('N')! + 1));

  // Bloco 9
  push(reg('9001', '0'));
  const blocos = ['0', 'C', 'J', 'K', 'L', 'M', 'N'];
  for (const b of blocos) {
    push(reg('9900', `${b}001`, '1'));
    push(reg('9900', `${b}990`, '1'));
  }
  push(reg('9900', '9001', '1'));
  push(reg('9900', '9990', '1'));
  push(reg('9900', '9999', '1'));
  push(reg('9990', blocoCount.get('9')! + 1));
  push(reg('9999', linhas.length + 1));

  return linhas.join('\r\n') + '\r\n';
}

export function validarECF(
  plano: ContaPlano[],
  lancamentos: LancamentoECD[],
  apuracao: ApuracaoIRPJCSLL,
): ValidacaoSPED {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (apuracao.base_calculo_irpj < 0) avisos.push('Base de cálculo IRPJ negativa (prejuízo)');
  if (apuracao.irpj_devido < 0) erros.push('IRPJ devido não pode ser negativo');
  if (apuracao.csll_devida < 0) erros.push('CSLL devida não pode ser negativa');

  const semRef = plano.filter(p => p.tipo === 'analitica' && !p.codigo_referencial);
  if (semRef.length > 0) {
    avisos.push(`${semRef.length} contas analíticas sem código referencial — recomendado para ECF`);
  }

  if (lancamentos.length === 0) erros.push('Nenhum lançamento contábil no período');

  // Cross-check: receitas - despesas ≈ lucro líquido
  const receitas = lancamentos.flatMap(l => l.partidas).filter(p => {
    const c = plano.find(pc => pc.codigo === p.conta_codigo);
    return c?.natureza === 'receita';
  }).reduce((s, p) => s + (p.tipo === 'C' ? p.valor : -p.valor), 0);
  const despesas = lancamentos.flatMap(l => l.partidas).filter(p => {
    const c = plano.find(pc => pc.codigo === p.conta_codigo);
    return c?.natureza === 'despesa';
  }).reduce((s, p) => s + (p.tipo === 'D' ? p.valor : -p.valor), 0);
  const resultadoCalc = receitas - despesas;
  if (Math.abs(resultadoCalc - apuracao.lucro_liquido) > 1) {
    avisos.push(`Lucro líquido informado (${apuracao.lucro_liquido.toFixed(2)}) difere do calculado (${resultadoCalc.toFixed(2)})`);
  }

  return { erros, avisos };
}
