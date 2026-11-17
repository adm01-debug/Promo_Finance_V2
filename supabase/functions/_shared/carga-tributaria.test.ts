import { assertEquals } from 'jsr:@std/assert@1';
import { cargaEfetivaDeFaturamento, competenciasConsecutivas } from './carga-tributaria.ts';

Deno.test('carga: soma receita e tributo e devolve o percentual com uma decimal', () => {
  const carga = cargaEfetivaDeFaturamento([
    { receita_bruta: 100000, valor_impostos: 12345 },
    { receita_bruta: 100000, valor_impostos: 10000 },
  ]);
  assertEquals(carga, 11.2);
});

Deno.test('carga: tributo zero com receita positiva devolve null, nao 0%', () => {
  // o caso que fazia o benchmark dizer "operacao eficiente" sem medir imposto
  assertEquals(cargaEfetivaDeFaturamento([{ receita_bruta: 100000, valor_impostos: 0 }]), null);
  assertEquals(cargaEfetivaDeFaturamento([{ receita_bruta: 100000 }]), null);
  assertEquals(cargaEfetivaDeFaturamento([{ receita_bruta: 100000, valor_impostos: null }]), null);
});

Deno.test('carga: receita zero devolve null em vez de dividir por zero', () => {
  assertEquals(cargaEfetivaDeFaturamento([{ receita_bruta: 0, valor_impostos: 500 }]), null);
});

Deno.test('carga: lista vazia devolve null', () => {
  assertEquals(cargaEfetivaDeFaturamento([]), null);
});

Deno.test('carga: aceita numero em string, como o PostgREST devolve numeric', () => {
  assertEquals(
    cargaEfetivaDeFaturamento([{ receita_bruta: '200000', valor_impostos: '30000' }]),
    15
  );
});

Deno.test('competencia: mes seguinte e consecutivo', () => {
  assertEquals(competenciasConsecutivas({ ano: 2026, mes: 11 }, { ano: 2026, mes: 10 }), true);
});

Deno.test('competencia: virada dezembro/janeiro e consecutiva', () => {
  assertEquals(competenciasConsecutivas({ ano: 2027, mes: 1 }, { ano: 2026, mes: 12 }), true);
});

Deno.test('competencia: salto de dez meses nao e consecutivo', () => {
  // janeiro vs novembro, o caso que gerava alerta "MoM" de variacao acumulada
  assertEquals(competenciasConsecutivas({ ano: 2026, mes: 11 }, { ano: 2026, mes: 1 }), false);
});

Deno.test('competencia: mesma competencia nao e consecutiva', () => {
  assertEquals(competenciasConsecutivas({ ano: 2026, mes: 11 }, { ano: 2026, mes: 11 }), false);
});

Deno.test('competencia: ordem invertida nao e consecutiva', () => {
  assertEquals(competenciasConsecutivas({ ano: 2026, mes: 10 }, { ano: 2026, mes: 11 }), false);
});

Deno.test('competencia: ano ou mes ausente ou invalido devolve false', () => {
  assertEquals(competenciasConsecutivas({ ano: 2026 }, { ano: 2026, mes: 10 }), false);
  assertEquals(competenciasConsecutivas({ ano: null, mes: 11 }, { ano: 2026, mes: 10 }), false);
  assertEquals(competenciasConsecutivas({ ano: 2026, mes: 13 }, { ano: 2026, mes: 12 }), false);
});
