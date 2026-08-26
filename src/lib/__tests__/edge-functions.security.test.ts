import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const FUNCTIONS_DIR = join(REPO_ROOT, "supabase", "functions");
const CONFIG_PATH = join(REPO_ROOT, "supabase", "config.toml");

type GuardExpectation =
  | {
      kind: "guard";
      tokens: string[];
      reason: string;
    }
  | {
      kind: "exemption";
      reason: string;
    };

const MATRIZ_EXPLICITA: Record<string, GuardExpectation> = {
  "asaas-webhook": {
    kind: "guard",
    tokens: ["receivedToken !== WEBHOOK_TOKEN"],
    reason: "Webhook público; a origem é autenticada por token compartilhado do provedor.",
  },
  "bitrix24-webhook": {
    kind: "guard",
    tokens: ["authenticateWebhook("],
    reason: "Webhook público; a origem precisa ser autenticada antes de qualquer escrita.",
  },
  "bling-webhook": {
    kind: "guard",
    tokens: ["authenticateWebhook("],
    reason: "Webhook público; a origem precisa ser autenticada antes de qualquer escrita.",
  },
  "calcular-slo-metrics-diario": {
    kind: "guard",
    tokens: ["exigirChamadaInterna("],
    reason: "Job interno com service_role; jamais pode ficar aberto para internet.",
  },
  "expert-agent": {
    kind: "guard",
    tokens: ["exigirUsuario("],
    reason: "Consome IA paga e usa service_role; precisa de sessão real do usuário.",
  },
  "gerar-resumo-financeiro-diario": {
    kind: "guard",
    tokens: ["exigirInternaOuUsuario("],
    reason: "Aceita automação interna e execução sob demanda do app autenticado.",
  },
  health: {
    kind: "exemption",
    reason: "Endpoint público de leitura agregada; não grava dados nem expõe payload sensível.",
  },
  "processar-fila-cobrancas": {
    kind: "guard",
    tokens: ["exigirInternaOuUsuario("],
    reason: "Fila sensível com service_role; aceita cron interno e acionamento autenticado.",
  },
  "webhook-retry-worker": {
    kind: "guard",
    tokens: ["exigirChamadaInterna("],
    reason: "Worker de retry reenvia webhooks com privilégios elevados; só automação interna.",
  },
  "webhook-simulator": {
    kind: "guard",
    tokens: ["exigirPapel("],
    reason: "Ferramenta administrativa de simulação; restrita a admins autenticados.",
  },
  "whatsapp-webhook": {
    kind: "guard",
    tokens: ["authenticateWebhook("],
    reason: "Webhook público; a origem precisa ser autenticada antes de qualquer escrita.",
  },
};

const GUARD_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: "usuário autenticado", pattern: /\bexigirUsuario\s*\(/ },
  { label: "papel explícito", pattern: /\bexigirPapel\s*\(/ },
  { label: "chamada interna", pattern: /\bexigirChamadaInterna\s*\(/ },
  { label: "interna ou usuário", pattern: /\bexigirInternaOuUsuario\s*\(/ },
  { label: "interna ou papel", pattern: /\bexigirInternaOuPapel\s*\(/ },
  { label: "autenticação de webhook", pattern: /\bauthenticateWebhook\s*\(/ },
  {
    label: "token compartilhado do Asaas",
    pattern: /receivedToken\s*!==\s*WEBHOOK_TOKEN/,
  },
];

function listarFuncoes(): string[] {
  if (!existsSync(FUNCTIONS_DIR)) return [];

  return readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(FUNCTIONS_DIR, name, "index.ts")));
}

function lerFonte(nome: string): string {
  return readFileSync(join(FUNCTIONS_DIR, nome, "index.ts"), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function verifyJwtExplícito(nome: string): boolean | null {
  if (!existsSync(CONFIG_PATH)) return null;
  const config = readFileSync(CONFIG_PATH, "utf8");
  const pattern = new RegExp(
    String.raw`\[functions\.${escapeRegExp(nome)}\][\s\S]{0,160}?verify_jwt\s*=\s*(true|false)`,
  );
  const match = config.match(pattern);
  if (!match) return null;
  return match[1] === "true";
}

function usaPrivilegioElevado(source: string): boolean {
  return /\bSUPABASE_SERVICE_ROLE_KEY\b|\bserviceClient\s*\(|\bclientDeServico\s*\(/.test(source);
}

function temProvaConcretaDeOrigem(source: string): boolean {
  return GUARD_RULES.some(({ pattern }) => pattern.test(source));
}

describe("Edge Functions — superfície pública com privilégios elevados", () => {
  const funcoes = listarFuncoes();

  it("encontra as edge functions do projeto", () => {
    expect(funcoes.length).toBeGreaterThan(0);
  });

  it("não considera header Authorization apenas em CORS como prova de origem", () => {
    const falsoPositivo = `
      const cors = {
        "Access-Control-Allow-Headers": "authorization, x-cron-secret"
      };
    `;
    expect(temProvaConcretaDeOrigem(falsoPositivo)).toBe(false);
  });

  it("mantém a matriz explícita de guards e isenções justificadas", () => {
    for (const [nome, regra] of Object.entries(MATRIZ_EXPLICITA)) {
      const source = lerFonte(nome);

      if (regra.kind === "exemption") {
        expect(
          usaPrivilegioElevado(source),
          `${nome} foi isenta, mas não usa service_role; remova a isenção obsoleta.`,
        ).toBe(true);
        continue;
      }

      for (const token of regra.tokens) {
        expect(
          source.includes(token),
          `${nome} perdeu o guard explícito "${token}". Motivo: ${regra.reason}`,
        ).toBe(true);
      }
    }
  });

  it("nenhuma função crítica/publicada nesta rodada fica sem guard concreto", () => {
    const auditadas = Object.entries(MATRIZ_EXPLICITA)
      .filter(([, regra]) => regra.kind === "guard")
      .map(([nome]) => nome);

    const desprotegidas = auditadas.filter((nome) => {
      const source = lerFonte(nome);
      if (!usaPrivilegioElevado(source)) return false;
      if (verifyJwtExplícito(nome) !== false) return false;

      const regra = MATRIZ_EXPLICITA[nome];
      if (!regra || regra.kind !== "guard") return false;
      return !regra.tokens.every((token) => source.includes(token));
    });

    expect(
      desprotegidas,
      [
        "Funções críticas/publicadas nesta rodada com `verify_jwt = false` e",
        "`service_role` precisam provar a origem da requisição no código.",
        "As seguintes continuam sem guard concreto:",
        desprotegidas.join(", "),
      ].join(" "),
    ).toEqual([]);
  });
});
