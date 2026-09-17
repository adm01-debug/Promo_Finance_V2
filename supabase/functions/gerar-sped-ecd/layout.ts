import { createLinhaTracker, reg } from '../_shared/sped/push-helper.ts';
import { buildBloco9 } from '../_shared/sped/bloco9.ts';

export interface EcdEmpresa {
  cnpj: string;
  razao_social: string;
  estado?: string;
  inscricao_estadual?: string;
}
export interface EcdConta {
  id: string;
  codigo: string;
  nome: string | null;
  descricao: string;
  natureza: string;
  tipo: string;
  codigo_referencial: string | null;
}
export interface EcdPartida {
  conta_id: string;
  tipo: 'D' | 'C';
  valor: number;
  historico_complementar?: string;
}
export interface EcdLancamento {
  id: string;
  numero_lancamento: number;
  data_lancamento: string;
  historico: string;
  valor_total: number;
  partidas: EcdPartida[];
}

export interface EcdInput {
  empresa: EcdEmpresa;
  plano: EcdConta[];
  lancamentos: EcdLancamento[];
  ano_calendario: number;
  periodo_inicio: string;
  periodo_fim: string;
}

const fmtData = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
};
const fmtNum = (v: number) => v.toFixed(2).replace('.', ',');
const cleanCnpj = (c: string) => c.replace(/\D/g, '');

const NAT_MAP: Record<string, string> = {
  ativo: '01',
  passivo: '02',
  patrimonio: '03',
  resultado: '04',
  receita: '04',
  despesa: '04',
};

/**
 * Monta as linhas do arquivo SPED ECD (Escrituração Contábil Digital) a
 * partir dos dados já buscados no banco — função pura, sem I/O, para poder
 * ser testada com golden file + invariantes sem subir `Deno.serve` nem
 * mockar Supabase.
 *
 * Duas correções da Etapa 40 em relação à versão anterior (que montava
 * tudo inline dentro do handler HTTP):
 *
 * 1. `I051` é emitido logo após o `I050` da mesma conta, não num segundo
 *    loop ao final — no leiaute ECD ele é registro-filho posicional de
 *    `I050`, e emiti-lo depois de todos os `I050` associava todo `I051`
 *    do arquivo ao ÚLTIMO `I050`, não ao seu.
 * 2. O bloco 9 vem de `buildBloco9` (`_shared/sped/bloco9.ts`), que tabula
 *    os tipos de registro realmente emitidos, no lugar de uma lista
 *    `['0','I','J']` cravada que nunca cobria `I050`, `I051`, `I150`,
 *    `I155`, `I200`, `I250`, nem os registros do bloco 0/J além do
 *    001/990.
 */
export function buildEcdLinhas(input: EcdInput): string[] {
  const { empresa, plano, lancamentos, ano_calendario, periodo_inicio, periodo_fim } = input;
  const tracker = createLinhaTracker();
  const { push, blocoCount } = tracker;

  const idToCodigo = new Map(plano.map((c) => [c.id, c.codigo]));

  push(
    reg(
      '0000',
      'LECD',
      fmtData(periodo_inicio),
      fmtData(periodo_fim),
      empresa.razao_social,
      cleanCnpj(empresa.cnpj),
      empresa.estado || 'SP',
      empresa.inscricao_estadual || '',
      '',
      '',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
      '',
      '',
      '0',
      '0'
    )
  );
  push(reg('0001', '0'));
  push(reg('0007', 'G'));
  push(reg('0020', 'N', '', '', '', '', '', '', '', ''));
  push(reg('0990', (blocoCount.get('0') || 0) + 1));

  push(reg('I001', '0'));
  push(reg('I010', 'G', '9.00'));
  push(
    reg(
      'I030',
      'TERMO DE ABERTURA',
      '1',
      '12',
      ano_calendario,
      fmtData(periodo_inicio),
      fmtData(periodo_fim),
      empresa.razao_social,
      cleanCnpj(empresa.cnpj),
      '',
      ''
    )
  );

  // Um I050 por conta, seguido IMEDIATAMENTE do seu I051 quando aplicável
  // — fix #1 da Etapa 40 (ver docstring acima).
  for (const c of plano) {
    push(
      reg(
        'I050',
        fmtData(periodo_inicio),
        NAT_MAP[c.natureza] || '04',
        c.tipo === 'sintetica' ? 'S' : 'A',
        String(c.codigo.split('.').length),
        c.codigo,
        c.nome || c.descricao,
        ''
      )
    );
    if (c.tipo === 'analitica' && c.codigo_referencial) {
      push(reg('I051', '01', '', c.codigo_referencial));
    }
  }

  push(reg('I150', fmtData(periodo_inicio), fmtData(periodo_fim)));
  for (const c of plano.filter((p) => p.tipo === 'analitica')) {
    const movD = lancamentos
      .flatMap((l) => l.partidas)
      .filter((p) => idToCodigo.get(p.conta_id) === c.codigo && p.tipo === 'D')
      .reduce((s, p) => s + Number(p.valor), 0);
    const movC = lancamentos
      .flatMap((l) => l.partidas)
      .filter((p) => idToCodigo.get(p.conta_id) === c.codigo && p.tipo === 'C')
      .reduce((s, p) => s + Number(p.valor), 0);
    const saldoFim = movD - movC;
    if (movD === 0 && movC === 0) continue;
    push(
      reg(
        'I155',
        c.codigo,
        '',
        '0,00',
        'D',
        fmtNum(movD),
        fmtNum(movC),
        fmtNum(Math.abs(saldoFim)),
        saldoFim >= 0 ? 'D' : 'C'
      )
    );
  }

  for (const l of lancamentos) {
    push(
      reg(
        'I200',
        l.numero_lancamento,
        fmtData(l.data_lancamento),
        fmtNum(Number(l.valor_total)),
        'N'
      )
    );
    for (const p of l.partidas) {
      const codigo = idToCodigo.get(p.conta_id) || '';
      push(
        reg(
          'I250',
          codigo,
          '',
          fmtNum(Number(p.valor)),
          p.tipo,
          l.historico.substring(0, 700),
          p.historico_complementar || ''
        )
      );
    }
  }
  push(reg('I990', (blocoCount.get('I') || 0) + 1));

  push(reg('J001', '0'));
  push(reg('J005', fmtData(periodo_inicio), fmtData(periodo_fim), '0', 'DEMONSTRACOES CONTABEIS'));

  let ord = 1;
  for (const c of plano.filter((p) => ['ativo', 'passivo', 'patrimonio'].includes(p.natureza))) {
    const saldo = lancamentos
      .flatMap((l) => l.partidas)
      .filter((p) => idToCodigo.get(p.conta_id) === c.codigo)
      .reduce((s, p) => s + (p.tipo === 'D' ? Number(p.valor) : -Number(p.valor)), 0);
    if (saldo === 0) continue;
    push(
      reg(
        'J100',
        String(ord++).padStart(4, '0'),
        c.natureza === 'ativo' ? '1' : '2',
        c.tipo === 'sintetica' ? 'S' : 'A',
        String(c.codigo.split('.').length),
        c.codigo,
        c.nome || c.descricao,
        fmtNum(Math.abs(saldo)),
        saldo >= 0 ? 'D' : 'C',
        '0,00',
        'D'
      )
    );
  }
  let ord2 = 1;
  for (const c of plano.filter((p) => ['receita', 'despesa', 'resultado'].includes(p.natureza))) {
    const total = lancamentos
      .flatMap((l) => l.partidas)
      .filter((p) => idToCodigo.get(p.conta_id) === c.codigo)
      .reduce((s, p) => s + (p.tipo === 'C' ? Number(p.valor) : -Number(p.valor)), 0);
    if (total === 0) continue;
    push(
      reg(
        'J150',
        String(ord2++).padStart(4, '0'),
        c.tipo === 'sintetica' ? 'S' : 'A',
        String(c.codigo.split('.').length),
        c.codigo,
        c.nome || c.descricao,
        fmtNum(Math.abs(total)),
        total >= 0 ? 'C' : 'D',
        '0,00',
        'C'
      )
    );
  }
  push(
    reg(
      'J900',
      'TERMO DE ENCERRAMENTO',
      '1',
      empresa.razao_social,
      cleanCnpj(empresa.cnpj),
      fmtData(periodo_fim),
      '',
      ''
    )
  );
  push(reg('J990', (blocoCount.get('J') || 0) + 1));

  // Bloco 9 — fix #2 da Etapa 40 (ver docstring acima).
  for (const linha of buildBloco9(tracker.linhas)) push(linha);
  push(reg('9999', tracker.linhas.length + 1));

  return tracker.linhas;
}
