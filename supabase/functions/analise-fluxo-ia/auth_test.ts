import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handler as analisarFluxo } from './index.ts';
import { handler as analisarDocumento } from '../analyze-document/index.ts';
import { handler as benchmarkingSetorial } from '../benchmarking-setorial/index.ts';
import { handler as categorizarDespesa } from '../categorizar-despesa/index.ts';
import { handler as insightsRelatorio } from '../insights-relatorio/index.ts';

type Handler = (req: Request) => Promise<Response>;

const FUNCOES: ReadonlyArray<{ nome: string; handler: Handler }> = [
  { nome: 'analise-fluxo-ia', handler: analisarFluxo },
  { nome: 'analyze-document', handler: analisarDocumento },
  { nome: 'benchmarking-setorial', handler: benchmarkingSetorial },
  { nome: 'categorizar-despesa', handler: categorizarDespesa },
  { nome: 'insights-relatorio', handler: insightsRelatorio },
];

const CHAVES_AMBIENTE = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LOVABLE_API_KEY',
] as const;

function requisicao(nome: string, authorization?: string): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (authorization) headers.set('Authorization', authorization);
  return new Request(`http://localhost/${nome}`, {
    method: 'POST',
    headers,
    // Corpo propositalmente inválido para os contratos de negócio: se qualquer
    // handler chegar ao parser, o teste deixa de observar o 401 esperado.
    body: '{}',
  });
}

async function corpoErro(response: Response): Promise<string> {
  const body = (await response.json()) as { error?: string };
  return body.error ?? '';
}

Deno.test({
  name: 'funções de IA rejeitam chamadas anônimas e JWT inválido antes de IA/DB',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    const fetchOriginal = globalThis.fetch;
    const ambienteOriginal = new Map(CHAVES_AMBIENTE.map((chave) => [chave, Deno.env.get(chave)]));

    Deno.env.set('SUPABASE_URL', 'https://auth-test.supabase.co');
    Deno.env.set('SUPABASE_ANON_KEY', 'anon-test-key');
    Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key');
    Deno.env.set('LOVABLE_API_KEY', 'lovable-test-key');

    try {
      for (const funcao of FUNCOES) {
        await t.step(`${funcao.nome}: preserva preflight CORS`, async () => {
          globalThis.fetch = () => {
            throw new Error('OPTIONS não deve autenticar nem acessar rede');
          };

          const response = await funcao.handler(
            new Request(`http://localhost/${funcao.nome}`, {
              method: 'OPTIONS',
              headers: {
                'Access-Control-Request-Headers': 'authorization, x-request-id',
              },
            })
          );

          assertEquals(response.status, 200);
          assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
          const headersPermitidos = response.headers.get('Access-Control-Allow-Headers') ?? '';
          assertStringIncludes(headersPermitidos, 'authorization');
          assertStringIncludes(headersPermitidos, 'x-request-id');
        });

        await t.step(`${funcao.nome}: 401 sem Authorization`, async () => {
          globalThis.fetch = () => {
            throw new Error('chamada anônima não deve acessar IA/DB/Auth');
          };

          const response = await funcao.handler(requisicao(funcao.nome));

          assertEquals(response.status, 401);
          assertEquals(await corpoErro(response), 'nao_autenticado');
        });

        await t.step(`${funcao.nome}: 401 com anon key como Bearer`, async () => {
          globalThis.fetch = () => {
            throw new Error('anon key não deve acessar IA/DB/Auth');
          };

          const response = await funcao.handler(requisicao(funcao.nome, 'Bearer anon-test-key'));

          assertEquals(response.status, 401);
          assertEquals(await corpoErro(response), 'nao_autenticado');
        });

        await t.step(`${funcao.nome}: 401 com JWT inválido sem tocar IA/DB`, async () => {
          const urls: string[] = [];
          globalThis.fetch = (input: RequestInfo | URL) => {
            const url = input instanceof Request ? input.url : input.toString();
            urls.push(url);
            return Promise.resolve(
              new Response(JSON.stringify({ message: 'Invalid JWT' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              })
            );
          };

          const response = await funcao.handler(requisicao(funcao.nome, 'Bearer jwt-invalido'));

          assertEquals(response.status, 401);
          assertEquals(await corpoErro(response), 'nao_autenticado');
          assertEquals(urls.length, 1);
          assertStringIncludes(urls[0], '/auth/v1/user');
          assertEquals(
            urls.some((url) => url.includes('ai.gateway')),
            false
          );
          assertEquals(
            urls.some((url) => url.includes('/rest/v1/')),
            false
          );
        });
      }
    } finally {
      globalThis.fetch = fetchOriginal;
      for (const [chave, valor] of ambienteOriginal) {
        if (valor === undefined) Deno.env.delete(chave);
        else Deno.env.set(chave, valor);
      }
    }
  },
});
