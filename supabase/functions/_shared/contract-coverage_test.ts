import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const FUNCTIONS_ROOT = new URL('../', import.meta.url);
const BODY_PATTERN = /req\.(json|text)\s*\(/;
const VALIDATION_PATTERN =
  /validatePayload|validateContract|validateVersionedContract|\.safeParse\s*\(/;
const LEGACY_VALIDATION_400_PATTERN =
  /if\s*\(\s*!\s*(?:__contract|parsed|validation)\.success\s*\)\s*return\s+new Response\(JSON\.stringify\(\{\s*error:\s*(?:__contract|parsed|validation)\.(?:error|details)[\s\S]{0,240}?status:\s*400/;

Deno.test('toda Edge Function que consome body declara validação de contrato', async () => {
  const missing: string[] = [];

  for await (const entry of Deno.readDir(FUNCTIONS_ROOT)) {
    if (!entry.isDirectory || entry.name === '_shared') continue;
    const indexUrl = new URL(`${entry.name}/index.ts`, FUNCTIONS_ROOT);
    try {
      const source = await Deno.readTextFile(indexUrl);
      if (BODY_PATTERN.test(source) && !VALIDATION_PATTERN.test(source)) {
        missing.push(entry.name);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }

  assertEquals(missing, [], `Endpoints com body sem validação: ${missing.join(', ')}`);
});

Deno.test('helpers compartilhados preservam o envelope 422 canônico', async () => {
  const contractValidator = await Deno.readTextFile(
    new URL('contract-validator.ts', import.meta.url)
  );
  const validation = await Deno.readTextFile(new URL('validation.ts', import.meta.url));
  assertEquals(contractValidator.includes('createValidationErrorResponse'), true);
  assertEquals(validation.includes('createValidationErrorResponse'), true);
});

Deno.test('nenhum endpoint devolve 400 para falha de schema', async () => {
  const legacyEndpoints: string[] = [];

  for await (const entry of Deno.readDir(FUNCTIONS_ROOT)) {
    if (!entry.isDirectory || entry.name === '_shared') continue;
    try {
      const source = await Deno.readTextFile(new URL(`${entry.name}/index.ts`, FUNCTIONS_ROOT));
      if (LEGACY_VALIDATION_400_PATTERN.test(source)) {
        legacyEndpoints.push(entry.name);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }

  assertEquals(
    legacyEndpoints,
    [],
    `Endpoints com falha de schema em 400: ${legacyEndpoints.join(', ')}`
  );
});

Deno.test('bling autentica o corpo bruto antes de validar ou gravar', async () => {
  const source = await Deno.readTextFile(new URL('../bling-webhook/index.ts', import.meta.url));
  const auth = source.indexOf('authenticateWebhook(');
  const parse = source.indexOf('JSON.parse(rawBody)');
  const validation = source.indexOf('validateVersionedContract(');
  const claim = source.indexOf('processWithIdempotency(');

  assertEquals(auth >= 0, true);
  assertEquals(auth < parse, true);
  assertEquals(parse < validation, true);
  assertEquals(validation < claim, true);
});

Deno.test('webhooks com efeitos colaterais usam idempotência atômica', async () => {
  for (const endpoint of ['bling-webhook', 'bitrix24-webhook', 'whatsapp-webhook']) {
    const source = await Deno.readTextFile(new URL(`../${endpoint}/index.ts`, import.meta.url));
    assertEquals(
      source.includes('processWithIdempotency('),
      true,
      `${endpoint} não usa processWithIdempotency`
    );
  }
});

Deno.test('bitrix24 não persiste application_token', async () => {
  const source = await Deno.readTextFile(new URL('../bitrix24-webhook/index.ts', import.meta.url));
  const sanitization = source.indexOf('delete (authPayload');
  const persistence = source.indexOf('processWithIdempotency(');
  assertEquals(sanitization >= 0, true);
  assertEquals(sanitization < persistence, true);
});

// ---------------------------------------------------------------------------
// Escopo de tenant (Etapa 10 do plano de 50 etapas)
//
// Clientes service_role ignoram RLS. Uma funcao que aceita empresa_id no corpo
// e consulta com service_role sem verificar o vinculo do usuario entrega dados
// de qualquer empresa a qualquer usuario autenticado — a falha corrigida em
// analise-preditiva (Etapa 3). Estes testes impedem a reintroducao.
// ---------------------------------------------------------------------------

/** Le empresa_id do corpo: campo de schema zod ou desestruturacao do payload. */
const EMPRESA_ID_DO_CORPO =
  /empresa_id\s*:\s*z\.|const\s*\{[^}]*empresa_id[^}]*\}\s*=\s*(?:corpo|body|payload|parsed)/;

/** Autentica um usuario final (em oposicao a chamada interna por segredo). */
const AUTENTICA_USUARIO = /exigirUsuario\(|exigirPapel\(|exigirInternaOuUsuario\(/;

/** Verifica o vinculo usuario<->empresa, via helper ou consulta direta. */
const GUARDA_DE_TENANT =
  /exigirVinculoEmpresa|exigirUsuarioComEmpresa|empresasDoUsuario|user_empresas|empresa_acessivel/;

async function lerFuncoes(): Promise<Array<{ nome: string; fonte: string }>> {
  const funcoes: Array<{ nome: string; fonte: string }> = [];
  for await (const entry of Deno.readDir(FUNCTIONS_ROOT)) {
    if (!entry.isDirectory || entry.name === '_shared') continue;
    try {
      const fonte = await Deno.readTextFile(new URL(`${entry.name}/index.ts`, FUNCTIONS_ROOT));
      funcoes.push({ nome: entry.name, fonte });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return funcoes;
}

Deno.test('funcao user-facing que recebe empresa_id no corpo valida o vinculo', async () => {
  const semGuarda: string[] = [];

  for (const { nome, fonte } of await lerFuncoes()) {
    if (!BODY_PATTERN.test(fonte)) continue;
    if (!EMPRESA_ID_DO_CORPO.test(fonte)) continue;
    if (!AUTENTICA_USUARIO.test(fonte)) continue;
    if (GUARDA_DE_TENANT.test(fonte)) continue;
    semGuarda.push(nome);
  }

  assertEquals(
    semGuarda,
    [],
    `Funcoes que aceitam empresa_id do corpo sem verificar user_empresas: ${semGuarda.join(
      ', '
    )}. Use exigirUsuarioComEmpresa() de _shared/auth-guard.ts.`
  );
});

/**
 * Divida conhecida: has_role() e tenant-agnostico (user_roles nao tem
 * empresa_id), entao usa-lo como desvio do vinculo concede leitura
 * cross-tenant a qualquer portador do papel. Ver docs/ADR-003-PAPEIS-POR-EMPRESA.md.
 * A lista so encolhe — e so apos a decisao registrada na ADR.
 */
const DESVIO_HAS_ROLE_CONHECIDO: readonly string[] = [
  'calcular-health-score-operacional',
  'comparar-benchmark-setorial',
  'contabilizar-evento',
  'gerar-acoes-recomendadas',
  'gerar-dre-tributaria',
  'gerar-heatmap-tributario',
  'gerar-pdf-tributario',
  'gerar-resumo-executivo-semanal',
  'prever-carga-tributaria',
];

Deno.test('has_role nao vira desvio novo do vinculo de empresa', async () => {
  const comDesvio: string[] = [];

  for (const { nome, fonte } of await lerFuncoes()) {
    if (!/user_empresas/.test(fonte)) continue;
    if (!/rpc\(\s*['"]has_role['"]/.test(fonte)) continue;
    comDesvio.push(nome);
  }

  const novos = comDesvio.filter((n) => !DESVIO_HAS_ROLE_CONHECIDO.includes(n));
  assertEquals(
    novos,
    [],
    `has_role() usado como desvio do vinculo de empresa em: ${novos.join(', ')}.`
  );

  const corrigidos = DESVIO_HAS_ROLE_CONHECIDO.filter((n) => !comDesvio.includes(n));
  assertEquals(
    corrigidos,
    [],
    `Remova de DESVIO_HAS_ROLE_CONHECIDO (ja corrigidos): ${corrigidos.join(', ')}`
  );
});
