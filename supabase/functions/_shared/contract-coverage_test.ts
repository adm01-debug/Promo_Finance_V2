import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const FUNCTIONS_ROOT = new URL('../', import.meta.url);
const BODY_PATTERN = /req\.(json|text)\s*\(/;
const VALIDATION_PATTERN =
  /validatePayload|validateContract|validateVersionedContract|\.safeParse\s*\(/;
/**
 * Recorta o statement executado quando o schema falha.
 *
 * Precisa ser recorte exato, não janela de N caracteres: metade das funções
 * escreve `if (!_v.success) return _v.response;` e logo abaixo faz uma
 * checagem manual de campo que devolve 400 legitimamente. Uma janela fixa
 * engole esse 400 e acusa 7 funções inocentes.
 */
function corpoDoRamo(source: string, apos: number): string {
  let i = apos;
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] === '{') {
    let prof = 0;
    for (let j = i; j < source.length; j++) {
      if (source[j] === '{') prof++;
      else if (source[j] === '}' && --prof === 0) return source.slice(i, j + 1);
    }
    return source.slice(i);
  }
  // Statement solto: vai até o `;` de nível zero (ou o fim da linha, porque
  // este repositório tem arquivos sem ponto-e-vírgula).
  let prof = 0;
  for (let j = i; j < source.length; j++) {
    const c = source[j];
    if ('([{'.includes(c)) prof++;
    else if (')]}'.includes(c)) prof--;
    else if (prof === 0 && (c === ';' || c === '\n')) return source.slice(i, j + 1);
  }
  return source.slice(i);
}

/**
 * Endpoints cujo ramo de falha de schema responde 400 na prática.
 *
 * A versão anterior deste guard era um regex único exigindo a forma literal
 * `return new Response(JSON.stringify({ error: ... status: 400`. Ele passava
 * verde sobre 21 violações, porque quase ninguém escreve a resposta assim: a
 * maioria usa um helper local (`json`, `jsonComCors`, `resposta`, `erro`) que
 * o regex não enxergava. Um guard que só reconhece uma forma de escrever não
 * é guard, é decoração — e este custou caro: `nfe-vinculo-proxy` tinha um
 * teste exigindo 422 que nunca rodou no CI, ao lado deste teste verde.
 *
 * Agora a detecção é pelo RAMO, não pela forma da resposta, então qualquer
 * jeito de montar a resposta é coberto — inclusive os que ainda não existem.
 *
 * `createErrorResponse(<validador>.error, 400, ...)` NÃO conta como violação:
 * o helper intercepta mensagens com `Contract Violation` — que é exatamente o
 * que `validatePayload` emite — e delega para `createValidationErrorResponse`,
 * devolvendo 422 e ignorando o argumento de status. Nessas 25 chamadas o `400`
 * é literal morto: enganoso de ler, correto no fio.
 */
const DIVIDA_400_CONHECIDA: readonly string[] = [
  'aceitar-convite',
  'api-keys-manage',
  'comparar-benchmark-setorial',
  'consulta-tributaria',
  'convidar-usuario',
  'enviar-convite-organizacao',
  'enviar-digest-conformidade',
  'executar-regua-cobranca',
  'gerar-dre-tributaria',
  'gerar-heatmap-tributario',
  'gerar-snapshots-conformidade',
  'mcp-query',
  'overlay-rejeicoes-auditoria',
  'prever-carga-tributaria',
  'processar-nf-ocr',
  'sefaz-manifestar',
  'sso-generate-metadata',
  'sso-initiate',
  'sso-validate-config',
];

function endpointsComSchemaEm400(source: string): boolean {
  // `success` é o discriminante de todos os validadores do projeto
  // (`validatePayload`, `validateContract`, `safeParse`).
  for (const m of source.matchAll(/!\s*\(?\s*(\w+)\.success\s*\)/g)) {
    const corpo = corpoDoRamo(source, (m.index ?? 0) + m[0].length);
    if (!/\b400\b/.test(corpo)) continue;
    if (corpo.includes('createErrorResponse(')) continue;
    return true;
  }
  return false;
}

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

Deno.test('a dívida de 400 para falha de schema não cresce', async () => {
  // Catraca, não asserção de lista vazia: a asserção limpa seria uma mentira
  // com 19 violações no disco, e a saída honesta não é apagar o teste nem
  // afrouxar o regex — é declarar a dívida e travá-la. Comparar conjuntos nos
  // dois sentidos faz o teste ficar vermelho tanto quando alguém ADICIONA uma
  // violação quanto quando alguém CORRIGE uma sem tirar da lista, que é o que
  // impede a lista de virar folclore.
  const encontrados: string[] = [];

  for await (const entry of Deno.readDir(FUNCTIONS_ROOT)) {
    if (!entry.isDirectory || entry.name === '_shared') continue;
    try {
      const source = await Deno.readTextFile(new URL(`${entry.name}/index.ts`, FUNCTIONS_ROOT));
      if (endpointsComSchemaEm400(source)) encontrados.push(entry.name);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }

  const novos = encontrados.filter((e) => !DIVIDA_400_CONHECIDA.includes(e));
  const jaCorrigidos = DIVIDA_400_CONHECIDA.filter((e) => !encontrados.includes(e));

  assertEquals(
    novos,
    [],
    `Falha de schema deve devolver 422 com {code,message,fields}. Novos em 400: ${novos.join(', ')}`
  );
  assertEquals(
    jaCorrigidos,
    [],
    `Já migrados para 422 — remova de DIVIDA_400_CONHECIDA: ${jaCorrigidos.join(', ')}`
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
