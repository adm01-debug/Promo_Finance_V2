/**
 * Etapa 80 — resumo da gravacao dos catalogos NCM/NBS.
 *
 * `preservadas` (carga retroativa) nao pode chegar ao `upsert` nem ao contador
 * `gravados`: os dois descrevem o que foi para o banco, e a linha preservada
 * fica apenas no relatorio.
 */
import { assertEquals } from 'jsr:@std/assert@1';
import { gravar } from '../index.ts';

type Linha = { ncm: string; inicio_vigencia: string; descricao: string };

function clienteFalso(abertos: Array<Record<string, unknown>>) {
  const upserts: Linha[][] = [];
  const api: Record<string, unknown> = {};
  api.select = () => api;
  api.is = () => api;
  api.order = () => api;
  api.range = (de: number) => Promise.resolve({ data: de === 0 ? abertos : [], error: null });
  api.upsert = (payload: Linha[]) => {
    upserts.push(payload);
    return Promise.resolve({ error: null });
  };
  api.update = () => ({
    in: () => ({
      is: () => ({ lte: () => Promise.resolve({ error: null, count: 0 }) }),
    }),
  });
  return { sb: { from: () => api } as unknown as Parameters<typeof gravar>[0], upserts };
}

Deno.test('gravar nao envia nem conta a linha preservada da carga retroativa', async () => {
  const abertos = [
    { ncm: '10000000', inicio_vigencia: '2026-01-01' },
    { ncm: '20000000', inicio_vigencia: '2026-06-01' },
  ];
  const { sb, upserts } = clienteFalso(abertos);
  const linhas: Linha[] = [
    { ncm: '10000000', inicio_vigencia: '2026-01-01', descricao: 'periodo base' },
    { ncm: '20000000', inicio_vigencia: '2026-01-01', descricao: 'periodo futuro' },
    { ncm: '30000000', inicio_vigencia: '2026-01-01', descricao: 'codigo novo' },
  ];

  const resultado = await gravar(
    sb,
    'catalogo_ncm',
    'ncm',
    { linhas, presentes: ['10000000', '20000000'], ignoradas: [] },
    1,
    '2026-03-01'
  );

  assertEquals(resultado.preservadas, 1);
  assertEquals(resultado.gravados, 2);
  assertEquals(
    upserts
      .flat()
      .map((linha) => linha.ncm)
      .sort(),
    ['10000000', '30000000']
  );
});
