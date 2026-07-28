// Testes Deno das funções puras de fallback do endpoint `consulta-tributaria`.
// Rodar: deno test supabase/functions/consulta-tributaria/index.test.ts
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  classificarCenarioST,
  escolherAliquotaInterna,
  prefixosHierarquicos,
  somenteDigitos,
  vigenteEm,
  vigentes,
} from './helpers.ts';

Deno.test('somenteDigitos normaliza NCM e CNAE formatados', () => {
  assertEquals(somenteDigitos('2202.10.00'), '22021000');
  assertEquals(somenteDigitos('6201-5/01'), '6201501');
  assertEquals(somenteDigitos(''), '');
});

Deno.test('vigenteEm trata vigência aberta como válida', () => {
  const ref = '2026-07-28';
  assertEquals(vigenteEm({}, ref), true);
  assertEquals(vigenteEm({ vigente_de: '2026-01-01' }, ref), true);
  assertEquals(vigenteEm({ vigente_de: '2027-01-01' }, ref), false);
  assertEquals(vigenteEm({ vigente_ate: '2026-07-27' }, ref), false);
  assertEquals(vigenteEm({ vigente_de: '2026-01-01', vigente_ate: '2026-12-31' }, ref), true);
});

Deno.test('vigentes filtra registros fora da janela', () => {
  const rows = [
    { id: 1, vigente_de: '2020-01-01', vigente_ate: null },
    { id: 2, vigente_de: '2030-01-01', vigente_ate: null },
    { id: 3, vigente_de: null, vigente_ate: '2021-01-01' },
  ];
  assertEquals(vigentes<{ id: number }>(rows, '2026-07-28').map((r) => r.id), [1]);
  assertEquals(vigentes(null, '2026-07-28'), []);
});

Deno.test('prefixosHierarquicos gera do mais específico ao mais genérico', () => {
  assertEquals(prefixosHierarquicos('2202.10.00', [8, 6, 4, 2]), ['22021000', '220210', '2202', '22']);
  // Código curto ignora tamanhos maiores que o disponível.
  assertEquals(prefixosHierarquicos('2202', [8, 6, 4, 2]), ['2202', '22']);
  assertEquals(prefixosHierarquicos('6201-5/01', [5, 4, 3, 2]), ['62015', '6201', '620', '62']);
});

const internas = [
  { categoria_produto: 'ENERGIA', aliquota: 0.25 },
  { categoria_produto: 'GERAL', aliquota: 0.18 },
  { categoria_produto: 'CESTA_BASICA', aliquota: 0.07 },
];

Deno.test('escolherAliquotaInterna prioriza categoria exata', () => {
  const r = escolherAliquotaInterna(internas, 'energia', 'SP');
  assertEquals(r.escolhida?.aliquota, 0.25);
  assertEquals(r.match, { estrategia: 'categoria_exata', exato: true });
});

Deno.test('escolherAliquotaInterna cai para GERAL quando categoria não existe', () => {
  const r = escolherAliquotaInterna(internas, 'INEXISTENTE', 'SP');
  assertEquals(r.escolhida?.aliquota, 0.18);
  assertEquals(r.match.estrategia, 'fallback_categoria_geral');
  assertEquals(r.match.exato, false);
  assertEquals(r.match.detalhe, 'Categoria "INEXISTENTE" não cadastrada para SP');
});

Deno.test('escolherAliquotaInterna usa primeira disponível sem GERAL/PADRÃO', () => {
  const r = escolherAliquotaInterna([{ categoria_produto: 'ENERGIA', aliquota: 0.25 }], 'X', 'RJ');
  assertEquals(r.match.estrategia, 'fallback_primeira_disponivel');
  assertEquals(r.escolhida?.aliquota, 0.25);
});

Deno.test('escolherAliquotaInterna sinaliza ausência total de catálogo', () => {
  const r = escolherAliquotaInterna([], 'GERAL', 'AC');
  assertEquals(r.escolhida, null);
  assertEquals(r.match, { estrategia: 'sem_correspondencia', exato: false });
});

const vinculoSP = { protocolo: { ufs: [{ uf: 'SP' }] } };
const vinculoMG = { protocolo: { ufs: [{ uf: 'MG' }] } };

Deno.test('classificarCenarioST mantém estratégia base sem UF alvo', () => {
  const r = classificarCenarioST([vinculoSP, vinculoMG], [], 'exato');
  assertEquals(r.estrategia, 'exato');
  assertEquals(r.vinculos.length, 2);
});

Deno.test('classificarCenarioST filtra por aderência da UF', () => {
  const r = classificarCenarioST([vinculoSP, vinculoMG], ['SP'], 'exato');
  assertEquals(r.estrategia, 'exato');
  assertEquals(r.vinculos, [vinculoSP]);
});

Deno.test('classificarCenarioST sinaliza protocolo sem adesão da UF alvo', () => {
  const r = classificarCenarioST([vinculoSP, vinculoMG], ['BA'], 'fallback_prefixo');
  assertEquals(r.estrategia, 'fallback_sem_adesao_uf');
  assertEquals(r.vinculos.length, 2);
});

Deno.test('classificarCenarioST sem vínculos preserva estratégia base', () => {
  const r = classificarCenarioST([], ['SP'], 'fallback_prefixo');
  assertEquals(r.estrategia, 'fallback_prefixo');
  assertEquals(r.vinculos, []);
});
