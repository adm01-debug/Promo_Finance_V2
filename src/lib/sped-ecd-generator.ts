// ============================================
// SPED ECD - Escrituração Contábil Digital
// Layout 9 (versão 2024)
// ============================================

export interface EmpresaECD {
  cnpj: string;
  razao_social: string;
  uf?: string;
  ie?: string;
  cod_municipio?: string;
}

export interface ContaPlano {
  id: string;
  codigo: string;
  nome: string;
  natureza: string; // ativo|passivo|patrimonio|receita|despesa|resultado
  tipo: string; // sintetica|analitica
  conta_pai_id?: string | null;
  codigo_referencial?: string | null;
}

export interface LancamentoECD {
  id: string;
  numero_lancamento: number;
  data_lancamento: string; // ISO
  historico: string;
  valor_total: number;
  partidas: Array<{
    conta_codigo: string;
    tipo: 'D' | 'C';
    valor: number;
    historico_complementar?: string;
  }>;
}

const fmtData = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
};
const fmtNum = (v: number) => v.toFixed(2).replace('.', ',');
const cleanCnpj = (c: string) => c.replace(/\D/g, '');

const NATUREZA_MAP: Record<string, string> = {
  ativo: '01',
  passivo: '02',
  patrimonio: '03',
  resultado: '04',
  receita: '04',
  despesa: '04',
};

function reg(...campos: (string | number)[]): string {
  return '|' + campos.map(c => (c === null || c === undefined ? '' : String(c))).join('|') + '|';
}

export function gerarSPED_ECD(
  empresa: EmpresaECD,
  anoCalendario: number,
  plano: ContaPlano[],
  lancamentos: LancamentoECD[],
  saldosIniciais: Map<string, number> = new Map(),
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

  // --- Bloco 0 ---
  push(reg('0000', 'LECD', fmtData(periodoInicio), fmtData(periodoFim),
    empresa.razao_social, cleanCnpj(empresa.cnpj), empresa.uf || 'SP',
    empresa.ie || '', empresa.cod_municipio || '', '', '0', '0', '0', '0', '0', '0', '', '', '0', '0'));
  push(reg('0001', '0'));
  push(reg('0007', 'G'));
  push(reg('0020', 'N', '', '', '', '', '', '', '', ''));
  push(reg('0990', blocoCount.get('0')! + 1));

  // --- Bloco I (escrituração) ---
  push(reg('I001', '0'));
  push(reg('I010', 'G', '9.00'));
  push(reg('I030', 'TERMO DE ABERTURA', '1', '12', anoCalendario,
    fmtData(periodoInicio), fmtData(periodoFim), empresa.razao_social,
    cleanCnpj(empresa.cnpj), '', ''));

  // I050 - plano de contas
  for (const c of plano.filter(p => p.tipo === 'sintetica' || p.tipo === 'analitica')) {
    push(reg('I050', fmtData(periodoInicio),
      NATUREZA_MAP[c.natureza] || '04',
      c.tipo === 'sintetica' ? 'S' : 'A',
      String(c.codigo.split('.').length),
      c.codigo, c.nome, ''));
  }
  // I051 - código referencial CFC
  for (const c of plano.filter(p => p.tipo === 'analitica' && p.codigo_referencial)) {
    push(reg('I051', '01', '', c.codigo_referencial!));
  }

  // I150/I155 - balancetes (saldos por período)
  push(reg('I150', fmtData(periodoInicio), fmtData(periodoFim)));
  for (const c of plano.filter(p => p.tipo === 'analitica')) {
    const saldoIni = saldosIniciais.get(c.codigo) || 0;
    const movDeb = lancamentos.flatMap(l => l.partidas).filter(p => p.conta_codigo === c.codigo && p.tipo === 'D').reduce((s, p) => s + p.valor, 0);
    const movCre = lancamentos.flatMap(l => l.partidas).filter(p => p.conta_codigo === c.codigo && p.tipo === 'C').reduce((s, p) => s + p.valor, 0);
    const saldoFim = saldoIni + movDeb - movCre;
    if (saldoIni === 0 && movDeb === 0 && movCre === 0) continue;
    push(reg('I155', c.codigo, '', fmtNum(Math.abs(saldoIni)), saldoIni >= 0 ? 'D' : 'C',
      fmtNum(movDeb), fmtNum(movCre),
      fmtNum(Math.abs(saldoFim)), saldoFim >= 0 ? 'D' : 'C'));
  }

  // I200/I250 - lançamentos
  for (const l of lancamentos) {
    push(reg('I200', l.numero_lancamento, fmtData(l.data_lancamento), fmtNum(l.valor_total), 'N'));
    for (const p of l.partidas) {
      push(reg('I250', p.conta_codigo, '', fmtNum(p.valor), p.tipo,
        l.historico.substring(0, 700), p.historico_complementar || ''));
    }
  }

  push(reg('I990', blocoCount.get('I')! + 1));

  // --- Bloco J (DRE / BP) ---
  push(reg('J001', '0'));
  push(reg('J005', fmtData(periodoInicio), fmtData(periodoFim), '0', 'DEMONSTRACOES CONTABEIS'));

  // J100 - Balanço Patrimonial
  let ordemBP = 1;
  for (const c of plano.filter(p => ['ativo', 'passivo', 'patrimonio'].includes(p.natureza))) {
    const saldo = (saldosIniciais.get(c.codigo) || 0) +
      lancamentos.flatMap(l => l.partidas).filter(p => p.conta_codigo === c.codigo)
        .reduce((s, p) => s + (p.tipo === 'D' ? p.valor : -p.valor), 0);
    if (saldo === 0) continue;
    push(reg('J100', String(ordemBP++).padStart(4, '0'),
      c.natureza === 'ativo' ? '1' : c.natureza === 'passivo' ? '2' : '2',
      c.tipo === 'sintetica' ? 'S' : 'A', String(c.codigo.split('.').length),
      c.codigo, c.nome, fmtNum(Math.abs(saldo)), saldo >= 0 ? 'D' : 'C',
      '0,00', 'D'));
  }

  // J150 - DRE
  let ordemDRE = 1;
  for (const c of plano.filter(p => ['receita', 'despesa', 'resultado'].includes(p.natureza))) {
    const total = lancamentos.flatMap(l => l.partidas).filter(p => p.conta_codigo === c.codigo)
      .reduce((s, p) => s + (p.tipo === 'C' ? p.valor : -p.valor), 0);
    if (total === 0) continue;
    push(reg('J150', String(ordemDRE++).padStart(4, '0'),
      c.tipo === 'sintetica' ? 'S' : 'A', String(c.codigo.split('.').length),
      c.codigo, c.nome, fmtNum(Math.abs(total)), total >= 0 ? 'C' : 'D', '0,00', 'C'));
  }

  push(reg('J900', 'TERMO DE ENCERRAMENTO', '1', empresa.razao_social,
    cleanCnpj(empresa.cnpj), fmtData(periodoFim), '', ''));
  push(reg('J990', blocoCount.get('J')! + 1));

  // --- Bloco 9 ---
  push(reg('9001', '0'));
  const blocos = ['0', 'I', 'J'];
  let count9900 = blocos.length + 2; // próprios 9900 + 9990 + 9999
  for (const b of blocos) {
    push(reg('9900', `${b}001`, '1'));
    push(reg('9900', `${b}990`, '1'));
    count9900 += 2;
  }
  push(reg('9900', '9001', '1'));
  push(reg('9900', '9990', '1'));
  push(reg('9900', '9999', '1'));
  push(reg('9990', blocoCount.get('9')! + 1));
  push(reg('9999', linhas.length + 1));

  return linhas.join('\r\n') + '\r\n';
}

// Validações pré-geração
export interface ValidacaoSPED {
  erros: string[];
  avisos: string[];
}

export function validarECD(
  plano: ContaPlano[],
  lancamentos: LancamentoECD[],
  periodoInicio: string,
  periodoFim: string,
): ValidacaoSPED {
  const erros: string[] = [];
  const avisos: string[] = [];
  const di = new Date(periodoInicio);
  const df = new Date(periodoFim);

  // Plano: analíticas precisam de código referencial CFC
  const semRef = plano.filter(p => p.tipo === 'analitica' && !p.codigo_referencial);
  if (semRef.length > 0) {
    avisos.push(`${semRef.length} contas analíticas sem código referencial CFC`);
  }

  // Lançamentos: partidas dobradas
  for (const l of lancamentos) {
    const d = l.partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + p.valor, 0);
    const c = l.partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + p.valor, 0);
    if (Math.abs(d - c) > 0.01) {
      erros.push(`Lançamento #${l.numero_lancamento}: débitos (${d.toFixed(2)}) ≠ créditos (${c.toFixed(2)})`);
    }
    const dl = new Date(l.data_lancamento);
    if (dl < di || dl > df) {
      erros.push(`Lançamento #${l.numero_lancamento}: data fora do período`);
    }
  }

  // Numeração sequencial
  const nums = lancamentos.map(l => l.numero_lancamento).sort((a, b) => a - b);
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + 1) {
      avisos.push(`Numeração com gap entre #${nums[i - 1]} e #${nums[i]}`);
      break;
    }
  }

  if (lancamentos.length === 0) {
    erros.push('Nenhum lançamento contábil no período');
  }

  return { erros, avisos };
}
