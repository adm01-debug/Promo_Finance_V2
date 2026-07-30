// Validação de códigos referenciais CFC (Conselho Federal de Contabilidade)
// usados no SPED ECD/ECF. Valida formato, prefixo por natureza, hierarquia
// e detecta duplicidades por empresa.
import type { PlanoContaRow } from '@/hooks/usePlanoContas';

// Padrão CFC: N.NN.NN.NN[.NNN]  (4 ou 5 níveis hierárquicos)
// 1.01.01.01      → 4 níveis
// 1.01.01.01.001  → 5 níveis (com subconta opcional 1-3 dígitos)
const REGEX_CFC = /^\d(\.\d{2}){3}(\.\d{1,3})?$/;

export type NaturezaConta =
  | 'ativo'
  | 'passivo'
  | 'patrimonio'
  | 'receita'
  | 'despesa'
  | 'custo'
  | 'resultado'
  | string;

// Mapeamento natureza → prefixo esperado (1º dígito do código CFC)
// 1 = Ativo, 2 = Passivo + PL, 3 = Receita, 4 = Custos/Despesas, 5 = Apuração de Resultado
export const PREFIXO_POR_NATUREZA: Record<string, string[]> = {
  ativo: ['1'],
  passivo: ['2'],
  patrimonio: ['2'],
  receita: ['3'],
  despesa: ['4'],
  custo: ['4'],
  resultado: ['5'],
};

export function validarFormatoCFC(codigo: string | null | undefined): boolean {
  if (!codigo) return false;
  return REGEX_CFC.test(codigo.trim());
}

export interface PrefixoCheck {
  ok: boolean;
  esperado: string[];
  atual: string;
}

export function validarPrefixoNatureza(
  codigo: string | null | undefined,
  natureza: NaturezaConta | null | undefined,
): PrefixoCheck {
  const atual = (codigo || '').trim().charAt(0) || '';
  const key = (natureza || '').toLowerCase();
  const esperado = PREFIXO_POR_NATUREZA[key] || [];
  if (esperado.length === 0) {
    // Natureza desconhecida: não conseguimos validar — considera OK para não gerar ruído.
    return { ok: true, esperado: [], atual };
  }
  return { ok: esperado.includes(atual), esperado, atual };
}

export function validarHierarquiaCFC(
  codigo: string | null | undefined,
  nivelDeclarado: number | null | undefined,
): boolean {
  if (!codigo) return false;
  const nivel = codigo.trim().split('.').length;
  if (!nivelDeclarado) return true;
  return nivel === nivelDeclarado;
}

export interface DuplicidadeCFC {
  codigo_referencial: string;
  contas: PlanoContaRow[];
}

export function detectarDuplicidades(contas: PlanoContaRow[]): DuplicidadeCFC[] {
  const map = new Map<string, PlanoContaRow[]>();
  for (const c of contas) {
    if (!c.codigo_referencial || c.ativo === false) continue;
    const key = `${c.empresa_id ?? '__global__'}::${c.codigo_referencial.trim()}`;
    const arr = map.get(key) || [];
    arr.push(c);
    map.set(key, arr);
  }
  const result: DuplicidadeCFC[] = [];
  for (const [key, arr] of map.entries()) {
    if (arr.length > 1) {
      result.push({
        codigo_referencial: key.split('::')[1],
        contas: arr,
      });
    }
  }
  return result.sort((a, b) => a.codigo_referencial.localeCompare(b.codigo_referencial));
}

// Sugere correção mínima quando o prefixo está errado: troca apenas o 1º dígito.
export function sugerirCorrecaoPrefixo(codigo: string, esperado: string[]): string | null {
  if (!codigo || esperado.length === 0) return null;
  const novo = esperado[0];
  if (codigo.charAt(0) === novo) return null;
  return novo + codigo.slice(1);
}
