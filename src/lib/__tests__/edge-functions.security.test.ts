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

/** Isenções conscientes: nome → motivo. */
const ISENCOES: Record<string, string> = {
  // Healthcheck público: só devolve status agregado, não escreve nada e é
  // consumido pela página de status pública.
  health: "somente leitura de status agregado, sem escrita e sem dado sensível",
};

const PADRAO_AUTORIZACAO =
  /getClaims|getUser\s*\(|authorization|authenticateWebhook|x-cron-secret|CRON_[A-Z_]*SECRET|WEBHOOK_SECRET|hmac|signature|api_key|apiKey/i;

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

  it("nenhuma função usa service_role sem prova de origem", () => {
    const desprotegidas = funcoes.filter((nome) => {
      if (nome in ISENCOES) return false;
      const src = readFileSync(join(FUNCTIONS_DIR, nome, "index.ts"), "utf8");
      if (!/SERVICE_ROLE/.test(src)) return false;
      return !PADRAO_AUTORIZACAO.test(src);
    });

    expect(
      desprotegidas,
      `Edge Functions com service_role e sem autenticação: ${desprotegidas.join(", ")}`,
    ).toEqual([]);
  });

  it("webhooks públicos autenticam a origem e falham fechados", () => {
    const webhooks = funcoes.filter((nome) => nome.endsWith("-webhook"));
    expect(webhooks.length).toBeGreaterThan(0);

    const semGuarda = webhooks.filter((nome) => {
      const src = readFileSync(join(FUNCTIONS_DIR, nome, "index.ts"), "utf8");
      return !/authenticateWebhook|hmac|signature/i.test(src);
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
