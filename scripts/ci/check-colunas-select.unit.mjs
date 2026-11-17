// Testes do gate de colunas de select/order.
// node --test scripts/ci/check-colunas-select.unit.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  catalogoDoTypes,
  normalizaColuna,
  paresDoArquivo,
  tiraEmbeds,
  EXCECOES,
} from './check-colunas-select.mjs';

const TYPES_FALSO = `
export type Database = {
  public: {
    Tables: {
      faturamento_mensal: {
        Row: {
          ano: number
          empresa_id: string
          mes: number
          receita_bruta: number
          valor_impostos: number | null
        }
        Insert: {
          ano: number
        }
      }
      regime_decision_cache: {
        Row: {
          ano: number
          decisao: Json
          empresa_id: string
          mes: number
        }
        Insert: {
          ano: number
        }
      }
    }
  }
}
`;

test('catalogoDoTypes extrai tabela e colunas do bloco Row', () => {
  const c = catalogoDoTypes(TYPES_FALSO);
  assert.equal(c.size, 2);
  assert.ok(c.get('faturamento_mensal').has('valor_impostos'));
  assert.ok(c.get('faturamento_mensal').has('receita_bruta'));
  assert.equal(c.get('faturamento_mensal').has('total_tributos'), false);
  assert.ok(c.get('regime_decision_cache').has('decisao'));
  assert.equal(c.get('regime_decision_cache').has('carga_pct'), false);
});

test('tiraEmbeds remove embed com parenteses aninhados', () => {
  const lista =
    'ncm_codigo, mva_original, protocolo:protocolos_st(id, codigo, ufs:protocolos_st_ufs(uf, papel))';
  // compara a LISTA de colunas, nao substring: 'ncm_codigo' contem 'codigo'
  const colunas = tiraEmbeds(lista)
    .split(',')
    .map((x) => normalizaColuna(x))
    .filter(Boolean)
    .sort();
  assert.deepEqual(colunas, ['mva_original', 'ncm_codigo']);
});

test('normalizaColuna trata alias, estrela, agregado e caminho jsonb', () => {
  assert.equal(normalizaColuna(' receita_bruta '), 'receita_bruta');
  assert.equal(normalizaColuna('apelido:coluna_real'), 'coluna_real');
  assert.equal(normalizaColuna('*'), null);
  assert.equal(normalizaColuna('count'), null);
  assert.equal(normalizaColuna('decisao->recomendado'), 'decisao');
  assert.equal(normalizaColuna(''), null);
});

test('paresDoArquivo acha coluna de select e de order e nao vaza entre cadeias', () => {
  const src = [
    "const a = await supa.from('faturamento_mensal')",
    "  .select('receita_bruta, valor_impostos')",
    "  .order('ano', { ascending: false });",
    "const b = await supa.from('regime_decision_cache')",
    "  .select('empresa_id, decisao')",
    "  .order('mes');",
  ].join('\n');
  const pares = paresDoArquivo(src, 'x.ts');
  const chave = (p) => `${p.tabela}.${p.col}`;
  const chaves = pares.map(chave).sort();
  assert.deepEqual(chaves, [
    'faturamento_mensal.ano',
    'faturamento_mensal.receita_bruta',
    'faturamento_mensal.valor_impostos',
    'regime_decision_cache.decisao',
    'regime_decision_cache.empresa_id',
    'regime_decision_cache.mes',
  ]);
  // o `.order('mes')` da segunda cadeia nao pode ser atribuido a primeira
  assert.equal(chaves.includes('faturamento_mensal.mes'), false);
});

test('reprova os cinco bugs reais de 17/11 contra o catalogo', () => {
  const catalogo = catalogoDoTypes(TYPES_FALSO);
  const src = [
    "await supa.from('faturamento_mensal').select('receita_bruta, total_tributos');",
    "await supa.from('regime_decision_cache').select('empresa_id, carga_pct, regime_recomendado');",
  ].join('\n');
  const reprovados = paresDoArquivo(src, 'y.ts').filter((p) => {
    const cols = catalogo.get(p.tabela);
    return cols && !cols.has(p.col) && !EXCECOES.has(`${p.tabela}.${p.col}`);
  });
  assert.deepEqual(reprovados.map((p) => `${p.tabela}.${p.col}`).sort(), [
    'faturamento_mensal.total_tributos',
    'regime_decision_cache.carga_pct',
    'regime_decision_cache.regime_recomendado',
  ]);
});

test('coluna valida nao e reprovada', () => {
  const catalogo = catalogoDoTypes(TYPES_FALSO);
  const src = "await supa.from('faturamento_mensal').select('receita_bruta, valor_impostos');";
  const reprovados = paresDoArquivo(src, 'z.ts').filter((p) => {
    const cols = catalogo.get(p.tabela);
    return cols && !cols.has(p.col);
  });
  assert.deepEqual(reprovados, []);
});

test('tabela fora do types.ts e ignorada, nao reprovada', () => {
  const catalogo = catalogoDoTypes(TYPES_FALSO);
  const src = "await externa.from('companies').select('razao_social');";
  const pares = paresDoArquivo(src, 'w.ts');
  assert.equal(pares.length, 1);
  assert.equal(catalogo.has('companies'), false);
});
