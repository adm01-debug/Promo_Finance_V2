import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Gate de segurança: toda Edge Function que instancia um cliente com
 * `SUPABASE_SERVICE_ROLE_KEY` (portanto ignora RLS) precisa provar a origem da
 * requisição antes de escrever no banco.
 *
 * Formas aceitas de prova:
 *  - validação de JWT do usuário (`getClaims` / `getUser` / header Authorization);
 *  - segredo de cron (`x-cron-secret` / `*_SECRET`);
 *  - autenticação de webhook (`authenticateWebhook`, HMAC ou token).
 *
 * Funções puramente informativas e sem escrita podem ser isentadas
 * explicitamente na lista abaixo — cada isenção precisa de justificativa.
 */

const FUNCTIONS_DIR = join(process.cwd(), 'supabase', 'functions');
const CONFIG_PATH = join(process.cwd(), 'supabase', 'config.toml');

/**
 * Endpoints privilegiados cobertos por esta rodada. A lista é explícita para
 * não transformar palavras presentes em CORS/comentários em falsa evidência de
 * autorização. Novos endpoints service_role devem entrar aqui junto ao teste.
 */
const FUNCOES_PRIVILEGIADAS_AUDITADAS: Record<string, RegExp> = {
  'bling-webhook': /authenticateWebhook\s*\(/,
  'compare-schemas': /exigirPapel\s*\(/,
  'send-push-notification': /exigirInternaOuUsuario\s*\(/,
  'send-device-alert': /exigirUsuario\s*\(/,
  'gerar-alertas': /exigirChamadaInterna\s*\(/,
  'mcp-query': /headers\.get\(\s*'x-mcp-secret'\s*\)/,
  // Resgatadas da branch fix/codex-h111911-preserva-c696391 (trabalho de outro
  // agente que nunca foi mergeado). Cada guarda abaixo foi reconferida no
  // código do `main`, não copiada: a branch apontava
  // `receivedToken !== WEBHOOK_TOKEN` em asaas-webhook (hoje é
  // `segredosIguais`, comparação em tempo constante),
  // `exigirInternaOuUsuario` em gerar-resumo-financeiro-diario e
  // processar-fila-cobrancas (hoje é `exigirInternaOuUsuarioComPapel`) e
  // isentava `health` (hoje tem `exigirUsuario` com degradação para probe).
  'asaas-webhook': /segredosIguais\s*\(/,
  'bitrix24-webhook': /authenticateWebhook\s*\(/,
  'whatsapp-webhook': /authenticateWebhook\s*\(/,
  'calcular-slo-metrics-diario': /exigirChamadaInterna\s*\(/,
  'webhook-retry-worker': /exigirChamadaInterna\s*\(/,
  'expert-agent': /exigirUsuario\s*\(/,
  health: /exigirUsuario\s*\(/,
  'webhook-simulator': /exigirPapel\s*\(/,
  'gerar-resumo-financeiro-diario': /exigirInternaOuUsuarioComPapel\s*\(/,
  'processar-fila-cobrancas': /exigirInternaOuUsuarioComPapel\s*\(/,
};

const PADROES_AUTORIZACAO: readonly RegExp[] = [
  /exigirUsuario\s*\(/,
  /exigirPapel\s*\(/,
  /exigirChamadaInterna\s*\(/,
  /exigirInternaOuUsuario\s*\(/,
  /authenticateWebhook\s*\(/,
  /auth\.get(?:Claims|User)\s*\(/,
  // Ancorado na leitura do header: a forma solta `/x-mcp-secret/` casava com o
  // nome citado em `Access-Control-Allow-Headers` e em comentário, aceitando
  // como prova de origem um arquivo que nunca compara o segredo.
  // mcp-query/index.ts:437 lê exatamente assim.
  /headers\.get\(\s*'x-mcp-secret'\s*\)/,
  // Provas de origem que já existiam no repo e não estavam na lista.
  // Propositalmente ancoradas na CHAMADA e não no nome do header: um
  // `x-cron-secret` citado só em `Access-Control-Allow-Headers` não é prova
  // de nada (ver o teste de falso positivo mais abaixo).
  /exigirInternaOuUsuarioComPapel\s*\(/,
  /exigirInternaOuPapel\s*\(/,
  /segredosIguais\s*\(/,
  /timingSafeEqual\s*\(/,
  /verifyJwt\s*\(/,
  /headers\.get\(\s*'x-cron-secret'\s*\)\s*!==/,
  /startsWith\(\s*'Bearer /,
];

/**
 * `supabase/config.toml` é a única fonte sobre o que a borda do Supabase
 * valida: `verify_jwt = false` significa que a requisição chega SEM nenhuma
 * checagem de JWT e a prova de origem precisa estar no código da função.
 * Devolve `null` quando a função não declara a chave (aí vale o padrão da
 * plataforma, `true`).
 */
function verifyJwtExplicito(nome: string): boolean | null {
  if (!existsSync(CONFIG_PATH)) return null;
  const config = readFileSync(CONFIG_PATH, 'utf8');
  const escapado = nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const achado = config.match(
    new RegExp(String.raw`\[functions\.${escapado}\][\s\S]{0,160}?verify_jwt\s*=\s*(true|false)`)
  );
  return achado ? achado[1] === 'true' : null;
}

function usaPrivilegioElevado(src: string): boolean {
  return /\bSUPABASE_SERVICE_ROLE_KEY\b|\bserviceClient\s*\(|\bclientDeServico\s*\(/.test(src);
}

function temProvaDeOrigem(src: string): boolean {
  return PADROES_AUTORIZACAO.some((padrao) => padrao.test(src));
}

/**
 * Dívida conhecida, não licença: estas três têm `verify_jwt = false` E
 * `service_role` E nenhuma prova de origem no código. Ficam listadas para o
 * gate abaixo ser verde hoje e só poder ENCOLHER — qualquer função nova nessa
 * situação reprova, e consertar uma destas obriga a tirá-la daqui (o teste
 * cobra que cada item da lista ainda esteja de fato sem prova).
 */
const PENDENTES_AUDITORIA_ORIGEM: Record<string, string> = {
  'sso-initiate': 'Início de SSO, anterior ao login; auditar se o service_role é necessário.',
  'validate-ip-geo': 'Chamada antes da sessão existir (allowlist de IP/país no login).',
  'whatsapp-ia-proativo': 'Consome IA paga com service_role e nenhuma prova de origem.',
};

function listarFuncoes(): string[] {
  if (!existsSync(FUNCTIONS_DIR)) return [];
  return readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .filter((nome) => existsSync(join(FUNCTIONS_DIR, nome, 'index.ts')));
}

describe('Edge Functions — superfície com service_role', () => {
  const funcoes = listarFuncoes();

  it('encontra as edge functions do projeto', () => {
    expect(funcoes.length).toBeGreaterThan(0);
  });

  it('as funções privilegiadas auditadas provam a origem antes da ação', () => {
    const desprotegidas = Object.entries(FUNCOES_PRIVILEGIADAS_AUDITADAS).filter(
      ([nome, padrao]) => {
        expect(funcoes).toContain(nome);
        const src = readFileSync(join(FUNCTIONS_DIR, nome, 'index.ts'), 'utf8');
        return (
          !padrao.test(src) || !PADROES_AUTORIZACAO.some((autorizacao) => autorizacao.test(src))
        );
      }
    );

    expect(
      desprotegidas,
      `Funções privilegiadas sem guarda concreta: ${desprotegidas.map(([nome]) => nome).join(', ')}`
    ).toEqual([]);
  });

  it('webhooks públicos autenticam a origem e falham fechados', () => {
    const webhooks = funcoes.filter((nome) => nome.endsWith('-webhook'));
    expect(webhooks.length).toBeGreaterThan(0);

    const semGuarda = webhooks.filter((nome) => {
      const src = readFileSync(join(FUNCTIONS_DIR, nome, 'index.ts'), 'utf8');
      return !/authenticateWebhook|hmac|signature|access-token|x-webhook-token/i.test(src);
    });

    expect(semGuarda, `Webhooks sem validação de origem: ${semGuarda.join(', ')}`).toEqual([]);
  });

  it('não aceita header citado só no CORS como prova de origem', () => {
    const falsoPositivo = `
      const corsHeaders = {
        'Access-Control-Allow-Headers': 'authorization, x-cron-secret, x-mcp-secret',
      };
    `;
    expect(temProvaDeOrigem(falsoPositivo)).toBe(false);
  });

  it('toda função com verify_jwt=false e service_role prova a origem no código', () => {
    const expostas = funcoes.filter((nome) => {
      if (verifyJwtExplicito(nome) !== false) return false;
      const src = readFileSync(join(FUNCTIONS_DIR, nome, 'index.ts'), 'utf8');
      return usaPrivilegioElevado(src) && !temProvaDeOrigem(src);
    });

    const novas = expostas.filter((nome) => !(nome in PENDENTES_AUDITORIA_ORIGEM));
    expect(
      novas,
      `Função com verify_jwt=false + service_role e sem prova de origem: ${novas.join(', ')}`
    ).toEqual([]);

    // O inverso: item da lista que já ganhou prova precisa sair dela, senão a
    // dívida "some" sem ninguém notar e a lista deixa de medir qualquer coisa.
    const jaResolvidas = Object.keys(PENDENTES_AUDITORIA_ORIGEM).filter(
      (nome) => !expostas.includes(nome)
    );
    expect(
      jaResolvidas,
      `Já têm prova de origem — remova de PENDENTES_AUDITORIA_ORIGEM: ${jaResolvidas.join(', ')}`
    ).toEqual([]);
  });

  it('o helper de webhook nunca aceita requisição sem segredo configurado', () => {
    const helper = readFileSync(join(FUNCTIONS_DIR, '_shared', 'webhook-auth.ts'), 'utf8');
    // Segredo ausente precisa resultar em rejeição explícita, não em bypass.
    expect(helper).toMatch(/secret_not_configured/);
    expect(helper).toMatch(/503/);
  });
});
