import { describe, it, expect } from "vitest";
import {
  buildBundle,
  parseBundle,
  SharedFilterBundleParseError,
  SHARED_FILTERS_BUNDLE_VERSION,
} from "../sharedFiltersExport";

describe("sharedFiltersExport > buildBundle", () => {
  it("constrói bundle limpo, ignorando papéis inválidos", () => {
    const b = buildBundle({
      rows: [
        {
          entity_type: "contas_pagar",
          name: "Atrasadas",
          filters: { status: "vencido" },
          // @ts-expect-error testando entrada suja
          shared_with_roles: ["admin", "garbage", "FINANCEIRO"],
          empresa_id: "e1",
          user_id: "u1",
        },
      ],
      ownersById: { u1: { email: "owner@x.com" } },
      exportedBy: { id: "u9", email: "admin@x.com" },
      fromEmpresaId: "e1",
    });
    expect(b.schemaVersion).toBe(SHARED_FILTERS_BUNDLE_VERSION);
    expect(b.items).toHaveLength(1);
    expect(b.items[0].shared_with_roles).toEqual(["admin"]);
    expect(b.items[0].source_owner_email).toBe("owner@x.com");
    expect(b.exportedFromEmpresaId).toBe("e1");
  });
});

describe("sharedFiltersExport > parseBundle", () => {
  const valid = JSON.stringify({
    schemaVersion: SHARED_FILTERS_BUNDLE_VERSION,
    exportedAt: "2025-01-01T00:00:00Z",
    exportedBy: { id: "u9", email: "admin@x.com" },
    exportedFromEmpresaId: "e1",
    items: [
      {
        entity_type: "contas_pagar",
        name: "Atrasadas",
        filters: { status: "vencido" },
        shared_with_roles: ["admin", "garbage"],
      },
    ],
  });

  it("aceita bundle válido e higieniza papéis", () => {
    const b = parseBundle(valid);
    expect(b.items[0].shared_with_roles).toEqual(["admin"]);
  });

  it("rejeita JSON inválido", () => {
    expect(() => parseBundle("{not json")).toThrow(SharedFilterBundleParseError);
  });

  it("rejeita versão diferente", () => {
    const bad = JSON.stringify({ schemaVersion: 999, items: [] });
    try {
      parseBundle(bad);
      throw new Error("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(SharedFilterBundleParseError);
      expect((e as SharedFilterBundleParseError).code).toBe(
        "UNSUPPORTED_VERSION",
      );
    }
  });

  it("rejeita items ausente", () => {
    const bad = JSON.stringify({
      schemaVersion: SHARED_FILTERS_BUNDLE_VERSION,
    });
    try {
      parseBundle(bad);
      throw new Error("deveria ter lançado");
    } catch (e) {
      expect((e as SharedFilterBundleParseError).code).toBe("INVALID_SHAPE");
    }
  });

  it("rejeita lista vazia (após filtragem)", () => {
    const bad = JSON.stringify({
      schemaVersion: SHARED_FILTERS_BUNDLE_VERSION,
      items: [{ foo: "bar" }, null, 42],
    });
    try {
      parseBundle(bad);
      throw new Error("deveria ter lançado");
    } catch (e) {
      expect((e as SharedFilterBundleParseError).code).toBe("EMPTY_ITEMS");
    }
  });

  it("ignora itens malformados mas mantém os bons", () => {
    const mixed = JSON.stringify({
      schemaVersion: SHARED_FILTERS_BUNDLE_VERSION,
      items: [
        { entity_type: "x", name: "ok", shared_with_roles: ["admin"] },
        { entity_type: 42, name: "bad" },
        null,
      ],
    });
    const b = parseBundle(mixed);
    expect(b.items).toHaveLength(1);
    expect(b.items[0].name).toBe("ok");
  });
});
