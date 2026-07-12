import { describe, it, expect } from "vitest";
import {
  isSeverity,
  isIsoDate,
  readSeverityFromLocation,
  readWeekFromLocation,
  buildUrlWithParams,
} from "../performance-alerts-deeplink";

describe("performance-alerts-deeplink", () => {
  describe("isSeverity", () => {
    it("aceita valores válidos", () => {
      expect(isSeverity("all")).toBe(true);
      expect(isSeverity("critical")).toBe(true);
      expect(isSeverity("warning")).toBe(true);
      expect(isSeverity("info")).toBe(true);
    });
    it("rejeita valores inválidos", () => {
      expect(isSeverity("ALL")).toBe(false);
      expect(isSeverity("high")).toBe(false);
      expect(isSeverity("")).toBe(false);
      expect(isSeverity(null)).toBe(false);
      expect(isSeverity(undefined)).toBe(false);
    });
  });

  describe("isIsoDate", () => {
    it("aceita datas ISO válidas", () => {
      expect(isIsoDate("2024-01-01")).toBe(true);
      expect(isIsoDate("2024-12-31")).toBe(true);
      expect(isIsoDate("2024-02-29")).toBe(true); // ano bissexto
    });
    it("rejeita formatos inválidos", () => {
      expect(isIsoDate("2024-1-1")).toBe(false);
      expect(isIsoDate("24-01-01")).toBe(false);
      expect(isIsoDate("2024/01/01")).toBe(false);
      expect(isIsoDate("hoje")).toBe(false);
      expect(isIsoDate(null)).toBe(false);
    });
    it("rejeita datas inexistentes", () => {
      expect(isIsoDate("2023-02-29")).toBe(false); // não-bissexto
      expect(isIsoDate("2024-13-01")).toBe(false);
      expect(isIsoDate("2024-00-10")).toBe(false);
      expect(isIsoDate("2024-04-31")).toBe(false); // abril tem 30
    });
  });

  describe("readSeverityFromLocation", () => {
    it("URL tem prioridade sobre storage", () => {
      expect(readSeverityFromLocation("?severity=critical", "info")).toBe("critical");
    });
    it("cai para storage quando URL ausente", () => {
      expect(readSeverityFromLocation("", "warning")).toBe("warning");
    });
    it("fallback final para all", () => {
      expect(readSeverityFromLocation("", null)).toBe("all");
      expect(readSeverityFromLocation("?severity=invalid", "bad")).toBe("all");
    });
  });

  describe("readWeekFromLocation", () => {
    it("retorna week válida", () => {
      expect(readWeekFromLocation("?week=2024-06-10")).toBe("2024-06-10");
    });
    it("retorna null para week inválida ou ausente", () => {
      expect(readWeekFromLocation("")).toBeNull();
      expect(readWeekFromLocation("?week=hoje")).toBeNull();
      expect(readWeekFromLocation("?week=2024-13-01")).toBeNull();
    });
  });

  describe("buildUrlWithParams", () => {
    const base = "https://app.example.com/telemetry?other=keep";

    it("adiciona severity", () => {
      const out = buildUrlWithParams(base, { severity: "critical" });
      expect(out).toContain("severity=critical");
      expect(out).toContain("other=keep");
    });
    it("remove severity quando all/null", () => {
      const withParam = "https://app.example.com/?severity=info";
      expect(buildUrlWithParams(withParam, { severity: "all" })).not.toContain("severity=");
      expect(buildUrlWithParams(withParam, { severity: null })).not.toContain("severity=");
    });
    it("adiciona week válida e remove quando null", () => {
      expect(buildUrlWithParams(base, { week: "2024-06-10" })).toContain("week=2024-06-10");
      expect(buildUrlWithParams(base + "&week=2024-06-10", { week: null })).not.toContain("week=");
    });
    it("ignora week inválida silenciosamente", () => {
      const out = buildUrlWithParams(base, { week: "not-a-date" });
      expect(out).not.toContain("week=");
    });
    it("preserva params não relacionados", () => {
      const out = buildUrlWithParams(base, { severity: "warning", week: "2024-06-10" });
      expect(out).toContain("other=keep");
      expect(out).toContain("severity=warning");
      expect(out).toContain("week=2024-06-10");
    });
  });
});
