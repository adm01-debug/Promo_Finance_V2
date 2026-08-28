import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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

const FUNCTIONS_DIR = join(process.cwd(), "supabase", "functions");

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
  'mcp-query': /x-mcp-secret/,
};

const PADROES_AUTORIZACAO: readonly RegExp[] = [
  /exigirUsuario\s*\(/,
  /exigirPapel\s*\(/,
  /exigirChamadaInterna\s*\(/,
  /exigirInternaOuUsuario\s*\(/,
  /authenticateWebhook\s*\(/,
  /auth\.get(?:Claims|User)\s*\(/,
  /x-mcp-secret/,
];

function listarFuncoes(): string[] {
  if (!existsSync(FUNCTIONS_DIR)) return [];
  return readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name)
    .filter((nome) => existsSync(join(FUNCTIONS_DIR, nome, "index.ts")));
}

describe("Edge Functions — superfície com service_role", () => {
  const funcoes = listarFuncoes();

  it("encontra as edge functions do projeto", () => {
    expect(funcoes.length).toBeGreaterThan(0);
  });

  it("as funções privilegiadas auditadas provam a origem antes da ação", () => {
    const desprotegidas = Object.entries(FUNCOES_PRIVILEGIADAS_AUDITADAS).filter(([nome, padrao]) => {
      expect(funcoes).toContain(nome);
      const src = readFileSync(join(FUNCTIONS_DIR, nome, "index.ts"), "utf8");
      return !padrao.test(src) || !PADROES_AUTORIZACAO.some((autorizacao) => autorizacao.test(src));
    });

    expect(
      desprotegidas,
      `Funções privilegiadas sem guarda concreta: ${desprotegidas.map(([nome]) => nome).join(", ")}`,
    ).toEqual([]);
  });

  it("webhooks públicos autenticam a origem e falham fechados", () => {
    const webhooks = funcoes.filter((nome) => nome.endsWith("-webhook"));
    expect(webhooks.length).toBeGreaterThan(0);

    const semGuarda = webhooks.filter((nome) => {
      const src = readFileSync(join(FUNCTIONS_DIR, nome, "index.ts"), "utf8");
      return !/authenticateWebhook|hmac|signature|access-token|x-webhook-token/i.test(src);
    });

    expect(
      semGuarda,
      `Webhooks sem validação de origem: ${semGuarda.join(", ")}`,
    ).toEqual([]);
  });

  it("o helper de webhook nunca aceita requisição sem segredo configurado", () => {
    const helper = readFileSync(
      join(FUNCTIONS_DIR, "_shared", "webhook-auth.ts"),
      "utf8",
    );
    // Segredo ausente precisa resultar em rejeição explícita, não em bypass.
    expect(helper).toMatch(/secret_not_configured/);
    expect(helper).toMatch(/503/);
  });
});
