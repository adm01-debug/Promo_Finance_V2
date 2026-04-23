import { describe, it, expect } from "vitest";
import {
  ALL_APP_ROLES,
  isAppRole,
  normalizeRoles,
  validateSharing,
  SavedFilterSharingError,
} from "../savedFiltersValidation";

describe("savedFiltersValidation > isAppRole", () => {
  it("aceita os 4 papéis canônicos", () => {
    for (const role of ALL_APP_ROLES) {
      expect(isAppRole(role)).toBe(true);
    }
  });
  it.each(["", " ", "ADMIN", "owner", "root", null, undefined, 42, {}])(
    "rejeita valor inválido %p",
    (value) => {
      expect(isAppRole(value)).toBe(false);
    },
  );
});

describe("savedFiltersValidation > normalizeRoles", () => {
  it("faz trim, lowercase e dedupe", () => {
    expect(normalizeRoles([" Admin ", "admin", "FINANCEIRO"])).toEqual([
      "admin",
      "financeiro",
    ]);
  });
  it("ignora não-strings e vazios", () => {
    expect(
      normalizeRoles([
        "admin",
        "",
        "  ",
        // @ts-expect-error testando entrada suja
        null,
        // @ts-expect-error testando entrada suja
        123,
      ]),
    ).toEqual(["admin"]);
  });
  it("ordena estável", () => {
    expect(normalizeRoles(["visualizador", "admin", "financeiro"])).toEqual([
      "admin",
      "financeiro",
      "visualizador",
    ]);
  });
});

describe("savedFiltersValidation > validateSharing (off)", () => {
  it("ignora qualquer payload quando isShared=false", () => {
    expect(
      validateSharing({
        isShared: false,
        sharedWithRoles: ["admin", "garbage"],
        empresaId: "e1",
        tenantRoles: ["admin"],
      }),
    ).toEqual({
      isShared: false,
      sharedWithRoles: [],
      empresaId: null,
    });
  });
});

describe("savedFiltersValidation > validateSharing (on)", () => {
  const tenant = ["admin", "financeiro", "operacional"];

  it("exige empresa_id", () => {
    expect(() =>
      validateSharing({
        isShared: true,
        sharedWithRoles: ["admin"],
        empresaId: null,
        tenantRoles: tenant,
      }),
    ).toThrowError(SavedFilterSharingError);
  });

  it("aceita lista vazia (= todos do tenant)", () => {
    const r = validateSharing({
      isShared: true,
      sharedWithRoles: [],
      empresaId: "e1",
      tenantRoles: tenant,
    });
    expect(r).toEqual({
      isShared: true,
      sharedWithRoles: [],
      empresaId: "e1",
    });
  });

  it("rejeita quando o tenant não tem papéis ativos", () => {
    expect(() =>
      validateSharing({
        isShared: true,
        sharedWithRoles: [],
        empresaId: "e1",
        tenantRoles: [],
      }),
    ).toThrow(/papéis ativos/i);
  });

  it("rejeita papel fora do enum AppRole (defesa básica)", () => {
    try {
      validateSharing({
        isShared: true,
        sharedWithRoles: ["root"],
        empresaId: "e1",
        tenantRoles: tenant,
      });
      throw new Error("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(SavedFilterSharingError);
      expect((e as SavedFilterSharingError).code).toBe("INVALID_APP_ROLE");
    }
  });

  it("rejeita AppRole válido global, mas inexistente no tenant", () => {
    try {
      validateSharing({
        isShared: true,
        sharedWithRoles: ["visualizador"],
        empresaId: "e1",
        tenantRoles: tenant, // não inclui visualizador
      });
      throw new Error("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(SavedFilterSharingError);
      expect((e as SavedFilterSharingError).code).toBe("ROLE_OUT_OF_TENANT");
    }
  });

  it("normaliza, dedupa e aceita combinação válida", () => {
    const r = validateSharing({
      isShared: true,
      sharedWithRoles: [" Admin ", "admin", "FINANCEIRO"],
      empresaId: "e1",
      tenantRoles: tenant,
    });
    expect(r.sharedWithRoles).toEqual(["admin", "financeiro"]);
    expect(r.empresaId).toBe("e1");
    expect(r.isShared).toBe(true);
  });

  it("o tenant também é higienizado (ignora roles inválidos vindos do BD)", () => {
    expect(() =>
      validateSharing({
        isShared: true,
        sharedWithRoles: ["admin"],
        empresaId: "e1",
        // 'legacy' não é AppRole — ele é descartado, mas 'admin' permanece válido
        tenantRoles: ["admin", "legacy", ""],
      }),
    ).not.toThrow();
  });
});
