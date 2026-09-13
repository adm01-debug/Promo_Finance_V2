/**
 * Regra arquitetural: query que filtra por `empresa_id` precisa carregar a
 * empresa na queryKey. Sem isso a query nunca é invalidada na troca de
 * empresa e o cache serve dados do tenant anterior.
 *
 * A allowlist abaixo é um catraca de não-regressão: só encolhe.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { analisarEscopoEmpresa, extrairBlocosUseQuery, fatiarBalanceado } from '../escopo-empresa';

const RAIZ = process.cwd();

/**
 * Queries que filtram por empresa sem empresa na chave e ainda não foram
 * migradas. Cada entrada é uma dívida conhecida — nunca adicione novas.
 */
const DIVIDA_CONHECIDA: ReadonlySet<string> = new Set([]);

function varrer(dir: string, acumulado: string[] = []): string[] {
  const absoluto = path.join(RAIZ, dir);
  if (!fs.existsSync(absoluto)) return acumulado;
  for (const entrada of fs.readdirSync(absoluto, { withFileTypes: true })) {
    const relativo = path.posix.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === '__tests__' || entrada.name === 'node_modules') continue;
      varrer(relativo, acumulado);
    } else if (/\.(ts|tsx)$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) {
      acumulado.push(relativo);
    }
  }
  return acumulado;
}

function violacoesDoRepositorio() {
  return varrer('src').flatMap((arquivo) =>
    analisarEscopoEmpresa(fs.readFileSync(path.join(RAIZ, arquivo), 'utf8'), arquivo)
  );
}

describe('detector de escopo de empresa', () => {
  it('fatia blocos balanceados ignorando strings e comentários', () => {
    expect(fatiarBalanceado('{ a: "}" /* } */ }', 0, '{', '}')).toBe('{ a: "}" /* } */ }');
    expect(fatiarBalanceado('{ sem fim', 0, '{', '}')).toBeNull();
  });

  it('extrai a queryKey de cada useQuery', () => {
    const codigo = `useQuery({ queryKey: ['a', empresaId], queryFn: async () => 1 });`;
    const blocos = extrairBlocosUseQuery(codigo);
    expect(blocos).toHaveLength(1);
    expect(blocos[0].queryKey).toBe("['a', empresaId]");
  });

  it('acusa filtro por empresa_id sem empresa na chave', () => {
    const ruim = `useQuery({
      queryKey: ['categorias'],
      queryFn: async () => supabase.from('x').select('*').eq('empresa_id', empresaId),
    });`;
    expect(analisarEscopoEmpresa(ruim, 'ruim.ts')).toHaveLength(1);
  });

  it('aceita a mesma query quando a chave carrega a empresa', () => {
    const bom = `useQuery({
      queryKey: ['categorias', empresaId],
      queryFn: async () => supabase.from('x').select('*').eq('empresa_id', empresaId),
    });`;
    expect(analisarEscopoEmpresa(bom, 'bom.ts')).toHaveLength(0);
  });

  it('resolve queryKey passada por atalho a partir da const', () => {
    // Falso positivo real: useConformidadeFiscal/usePrevisaoTributaria usam
    // `const queryKey = [...]` e depois o atalho `queryKey,`.
    const codigo = `
      const queryKey = ['conformidade-fiscal', empresaId, periodo];
      const query = useQuery({
        queryKey,
        queryFn: async () => supabase.from('x').select('*').eq('empresa_id', empresaId),
      });`;
    expect(analisarEscopoEmpresa(codigo, 'atalho.ts')).toHaveLength(0);
  });

  it('aceita chave que carrega o objeto de filtros que origina a empresa', () => {
    // useBloqueiosData: a chave leva `filters`, e o filtro é filters.empresa_id.
    const codigo = `useQuery({
      queryKey: ["bloqueios", filters],
      queryFn: async () => supabase.from("t").select("*").eq("empresa_id", filters.empresa_id),
    });`;
    expect(analisarEscopoEmpresa(codigo, 'filtros.ts')).toHaveLength(0);
  });

  it('não confunde construção de objeto de saída com filtro', () => {
    // useAuditoriaIA monta `empresa_id:` no resultado; não é filtro de tenant.
    const codigo = `useQuery({
      queryKey: ['auditoria-ia'],
      queryFn: async () => rows.map((r) => ({ id: r.id, empresa_id: empresa?.id ?? null })),
    });`;
    expect(analisarEscopoEmpresa(codigo, 'saida.ts')).toHaveLength(0);
  });

  it('acusa empresa_id enviado no body de uma edge function sem escopo na chave', () => {
    const codigo = `useQuery({
      queryKey: ['previsao'],
      queryFn: async () => supabase.functions.invoke('f', { body: { empresa_id: empresaId } }),
    });`;
    expect(analisarEscopoEmpresa(codigo, 'invoke.ts')).toHaveLength(1);
  });

  it('não acusa query sem filtro de empresa', () => {
    const neutro = `useQuery({ queryKey: ['bancos'], queryFn: async () => supabase.from('bancos').select('*') });`;
    expect(analisarEscopoEmpresa(neutro, 'neutro.ts')).toHaveLength(0);
  });
});

describe('escopo de empresa nas queryKeys do repositório', () => {
  it('nenhuma query filtra por empresa_id sem declarar a empresa na chave', () => {
    const violacoes = violacoesDoRepositorio().filter(
      (v) => !DIVIDA_CONHECIDA.has(`${v.arquivo}:${v.linha}`)
    );

    const relatorio = violacoes
      .map((v) => `  ${v.arquivo}:${v.linha}  key=${v.queryKey}  filtro=${v.evidencia}`)
      .join('\n');

    expect(violacoes, `Queries sem escopo de empresa na chave:\n${relatorio}`).toHaveLength(0);
  });

  it('a allowlist não contém entradas obsoletas', () => {
    const atuais = new Set(violacoesDoRepositorio().map((v) => `${v.arquivo}:${v.linha}`));
    const obsoletas = [...DIVIDA_CONHECIDA].filter((e) => !atuais.has(e));
    expect(obsoletas, 'Remova da allowlist: já estão corrigidas').toEqual([]);
  });
});
