import { describe, it, expect } from "vitest";
import {
  validateAnomaliaPreferencesPatch,
  assertValidAnomaliaPreferencesPatch,
  SEVERIDADES_VALIDAS,
} from "../anomaliaPreferencesValidation";
import { shouldNotify, type AnomaliaPreferences } from "../useAnomaliaPreferences";

const basePrefs: AnomaliaPreferences = {
  id: "p1",
  user_id: "u1",
  toast_enabled: true,
  toast_min_severidade: "critica",
  toast_severidades_ativas: ["critica", "alta"],
  toast_duracao_segundos: 12,
  toast_acoes: {
    drill_down: true,
    abrir_pagina: true,
    copiar_id: false,
    marcar_lida: false,
  },
  drawer_acoes: {
    abrir_entidade: true,
    pagina_completa: true,
    copiar_id: false,
    marcar_lida: false,
  },
  silenciar_ate: null,
  centros_custo_silenciados: [],
  tipos_silenciados: [],
};

describe("validateAnomaliaPreferencesPatch — duração", () => {
  it("aceita range válido", () => {
    expect(
      validateAnomaliaPreferencesPatch({ toast_duracao_segundos: 12 }).ok,
    ).toBe(true);
    expect(
      validateAnomaliaPreferencesPatch({ toast_duracao_segundos: 3 }).ok,
    ).toBe(true);
    expect(
      validateAnomaliaPreferencesPatch({ toast_duracao_segundos: 30 }).ok,
    ).toBe(true);
  });

  it.each([2, 0, -5, 31, 9999])("rejeita fora do range: %s", (d) => {
    const r = validateAnomaliaPreferencesPatch({ toast_duracao_segundos: d });
    expect(r.ok).toBe(false);
    expect(r.issues[0].code).toBe("DURACAO_FORA_DO_RANGE");
  });

  it.each([3.5, 12.0001, NaN, Infinity])("rejeita não-inteiro: %s", (d) => {
    const r = validateAnomaliaPreferencesPatch({ toast_duracao_segundos: d });
    expect(r.ok).toBe(false);
    expect(r.issues[0].code).toBe("DURACAO_NAO_INTEIRA");
  });
});

describe("validateAnomaliaPreferencesPatch — severidades", () => {
  it("aceita lista com valores conhecidos", () => {
    const r = validateAnomaliaPreferencesPatch({
      toast_severidades_ativas: ["critica", "alta", "media", "baixa"],
    });
    expect(r.ok).toBe(true);
  });

  it("rejeita severidade desconhecida", () => {
    const r = validateAnomaliaPreferencesPatch({
      // @ts-expect-error — testando entrada inválida em runtime
      toast_severidades_ativas: ["critica", "extrema"],
    });
    expect(r.ok).toBe(false);
    expect(r.issues.find((i) => i.code === "SEVERIDADE_INVALIDA")).toBeTruthy();
  });

  it("rejeita lista vazia quando toast_enabled (default true)", () => {
    const r = validateAnomaliaPreferencesPatch({
      toast_severidades_ativas: [],
    });
    expect(r.ok).toBe(false);
    expect(
      r.issues.find((i) => i.code === "SEVERIDADES_VAZIAS_COM_TOAST_ATIVO"),
    ).toBeTruthy();
  });

  it("aceita lista vazia se toast_enabled=false no mesmo patch", () => {
    const r = validateAnomaliaPreferencesPatch({
      toast_severidades_ativas: [],
      toast_enabled: false,
    });
    expect(r.ok).toBe(true);
  });

  it("cobre todas as severidades exportadas", () => {
    expect(SEVERIDADES_VALIDAS).toEqual(["baixa", "media", "alta", "critica"]);
  });
});

describe("validateAnomaliaPreferencesPatch — combinações de ações", () => {
  it("rejeita drawer sem nenhuma ação", () => {
    const r = validateAnomaliaPreferencesPatch({
      drawer_acoes: {
        abrir_entidade: false,
        pagina_completa: false,
        copiar_id: false,
        marcar_lida: false,
      },
    });
    expect(r.ok).toBe(false);
    expect(r.issues[0].code).toBe("DRAWER_SEM_ACOES");
  });

  it("rejeita combinação inválida: toast e drawer ambos vazios", () => {
    const r = validateAnomaliaPreferencesPatch({
      toast_acoes: {
        drill_down: false,
        abrir_pagina: false,
        copiar_id: false,
        marcar_lida: false,
      },
      drawer_acoes: {
        abrir_entidade: false,
        pagina_completa: false,
        copiar_id: false,
        marcar_lida: false,
      },
    });
    expect(r.ok).toBe(false);
    // Vai disparar 2 issues: DRAWER_SEM_ACOES + a combinação
    const codes = r.issues.map((i) => i.code);
    expect(codes).toContain("DRAWER_SEM_ACOES");
    expect(codes).toContain("TOAST_SEM_ACOES_COM_DRILL_DOWN_OBRIGATORIO");
  });

  it("aceita toast sem ações se drawer tem ao menos 1", () => {
    const r = validateAnomaliaPreferencesPatch({
      toast_acoes: {
        drill_down: false,
        abrir_pagina: false,
        copiar_id: false,
        marcar_lida: false,
      },
      drawer_acoes: {
        abrir_entidade: true,
        pagina_completa: false,
        copiar_id: false,
        marcar_lida: false,
      },
    });
    expect(r.ok).toBe(true);
  });
});

describe("assertValidAnomaliaPreferencesPatch", () => {
  it("não lança em patch válido", () => {
    expect(() =>
      assertValidAnomaliaPreferencesPatch({
        toast_duracao_segundos: 10,
        toast_severidades_ativas: ["critica"],
      }),
    ).not.toThrow();
  });

  it("lança Error com mensagens concatenadas em patch inválido", () => {
    expect(() =>
      assertValidAnomaliaPreferencesPatch({
        toast_duracao_segundos: 999,
        toast_severidades_ativas: [],
      }),
    ).toThrow(/duração do toast/i);
  });
});

describe("shouldNotify — proteção contra prefs corrompidas", () => {
  it("notifica quando prefs é null (fail-open)", () => {
    expect(shouldNotify(null, { severidade: "critica" })).toBe(true);
  });

  it("não notifica quando toast_enabled=false", () => {
    expect(
      shouldNotify(
        { ...basePrefs, toast_enabled: false },
        { severidade: "critica" },
      ),
    ).toBe(false);
  });

  it("não notifica quando severidade não está em toast_severidades_ativas", () => {
    expect(
      shouldNotify(
        { ...basePrefs, toast_severidades_ativas: ["critica"] },
        { severidade: "baixa" },
      ),
    ).toBe(false);
  });

  it("não notifica durante soneca ativa", () => {
    const futuro = new Date(Date.now() + 3600_000).toISOString();
    expect(
      shouldNotify(
        { ...basePrefs, silenciar_ate: futuro },
        { severidade: "critica" },
      ),
    ).toBe(false);
  });

  it("ignora soneca expirada", () => {
    const passado = new Date(Date.now() - 3600_000).toISOString();
    expect(
      shouldNotify(
        { ...basePrefs, silenciar_ate: passado },
        { severidade: "critica" },
      ),
    ).toBe(true);
  });

  it("respeita centros de custo silenciados", () => {
    expect(
      shouldNotify(
        { ...basePrefs, centros_custo_silenciados: ["cc1"] },
        { severidade: "critica", centro_custo_id: "cc1" },
      ),
    ).toBe(false);
  });

  it("respeita tipos silenciados", () => {
    expect(
      shouldNotify(
        { ...basePrefs, tipos_silenciados: ["pagamento_duplicado"] },
        { severidade: "critica", tipo_anomalia: "pagamento_duplicado" },
      ),
    ).toBe(false);
  });

  it("trata severidade ausente como 'baixa' e bloqueia se não estiver na lista", () => {
    expect(
      shouldNotify(
        { ...basePrefs, toast_severidades_ativas: ["critica", "alta"] },
        { severidade: null },
      ),
    ).toBe(false);
  });
});
