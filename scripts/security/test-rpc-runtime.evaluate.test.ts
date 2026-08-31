import { describe, expect, it } from "bun:test";
import { evaluate } from "./test-rpc-runtime";

describe("evaluate", () => {
  it("aceita 404/PGRST202 para anon e authenticated", () => {
    expect(evaluate("anon", "confirmar_conciliacao", { status: 404, code: "PGRST202" })).toBe(true);
    expect(evaluate("authenticated", "confirmar_conciliacao", { status: 404, code: "PGRST202" })).toBe(true);
  });

  it("aceita 401 apenas para anon", () => {
    expect(evaluate("anon", "confirmar_conciliacao", { status: 401 })).toBe(true);
    expect(evaluate("authenticated", "confirmar_conciliacao", { status: 401 })).toBe(false);
  });

  it("aceita 403 apenas quando for ACL da função alvo", () => {
    expect(
      evaluate("authenticated", "desfazer_conciliacao", {
        status: 403,
        code: "42501",
        message: "permission denied for function desfazer_conciliacao",
      }),
    ).toBe(true);
  });

  it("rejeita 403 genérico ou de função diferente", () => {
    expect(
      evaluate("authenticated", "desfazer_conciliacao", {
        status: 403,
        code: "42501",
        message: "permission denied for table contas_pagar",
      }),
    ).toBe(false);

    expect(
      evaluate("authenticated", "desfazer_conciliacao", {
        status: 403,
        code: "42501",
        message: "permission denied for function confirmar_conciliacao",
      }),
    ).toBe(false);

    expect(
      evaluate("authenticated", "desfazer_conciliacao", {
        status: 403,
        code: "PGRST301",
        message: "JWT expired",
      }),
    ).toBe(false);
  });
});
