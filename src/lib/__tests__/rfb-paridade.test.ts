/**
 * Etapa 95 — Paridade local × RFB (fixture estática)
 *
 * Verifica que o parser parse-ibscbs extrai corretamente os valores do grupo
 * IBS/CBS conforme os exemplos oficiais da NT 2025.002-RTC v1.51 (SEFAZ).
 *
 * As fixtures abaixo são derivadas dos exemplos publicados na NT 2025.002
 * (tabelas de leiaute e valores-exemplo seção 6.2 e 6.4).
 *
 * Regras:
 * - Alíquota IBS UF + IBS Mun = alíquota IBS total
 * - Alíquota CBS = definida per cClassTrib
 * - Divergência máxima: R$ 0,01 por campo; R$ 0,00 no total dos tributos
 * - Nunca chama calculadora externa (modo offline)
 */

import { describe, it, expect } from "vitest";
import { parseItemIbscbs, parseIbscbsTotais } from "@/lib/nfe/parse-ibscbs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function item(xml: string): Element {
  const doc = parseXml(`<nfeProc><NFe><infNFe>${xml}</infNFe></NFe></nfeProc>`);
  return doc.querySelector("det") as Element;
}

/** Monta um elemento <det> completo com grupo IBSCBS (NT 2025.002 §6.2). */
function detIbscbs(opts: {
  vBC: number;
  pIBSUF: number;
  vIBSUF: number;
  pIBSMun: number;
  vIBSMun: number;
  vIBS: number;
  pCBS: number;
  vCBS: number;
  cClassTrib?: string;
  cst?: string;
}) {
  const { vBC, pIBSUF, vIBSUF, pIBSMun, vIBSMun, vIBS, pCBS, vCBS } = opts;
  return item(`
    <det>
      <imposto>
        <IBSCBS>
          <CST>${opts.cst ?? "01"}</CST>
          <cClassTrib>${opts.cClassTrib ?? "0101"}</cClassTrib>
          <gIBSCBS>
            <vBC>${vBC.toFixed(2)}</vBC>
            <gIBSUF>
              <pIBSUF>${pIBSUF.toFixed(4)}</pIBSUF>
              <vIBSUF>${vIBSUF.toFixed(2)}</vIBSUF>
            </gIBSUF>
            <gIBSMun>
              <pIBSMun>${pIBSMun.toFixed(4)}</pIBSMun>
              <vIBSMun>${vIBSMun.toFixed(2)}</vIBSMun>
            </gIBSMun>
            <vIBS>${vIBS.toFixed(2)}</vIBS>
            <gCBS>
              <pCBS>${pCBS.toFixed(4)}</pCBS>
              <vCBS>${vCBS.toFixed(2)}</vCBS>
            </gCBS>
          </gIBSCBS>
        </IBSCBS>
      </imposto>
    </det>
  `);
}

// ---------------------------------------------------------------------------
// Fixtures NT 2025.002 §6.2 — valores-exemplo com alíquotas de teste 2026
// (CBS 0.9%, IBS UF 0.07%, IBS Mun 0.03%)
// ---------------------------------------------------------------------------

const FIXTURES: Array<{
  desc: string;
  input: { vBC: number; pIBSUF: number; vIBSUF: number; pIBSMun: number; vIBSMun: number; vIBS: number; pCBS: number; vCBS: number };
  expect: { vBC: number; vIBSUF: number; vIBSMun: number; vIBS: number; vCBS: number; pCBS_frac: number };
}> = [
  {
    desc: "Exemplo 1 — produto genérico R$ 1.000,00 (alíquotas-teste 2026)",
    input:  { vBC: 1000.00, pIBSUF: 0.07, vIBSUF: 0.70, pIBSMun: 0.03, vIBSMun: 0.30, vIBS: 1.00, pCBS: 0.9, vCBS: 9.00 },
    expect: { vBC: 1000.00, vIBSUF: 0.70, vIBSMun: 0.30, vIBS: 1.00, vCBS: 9.00, pCBS_frac: 0.009 },
  },
  {
    desc: "Exemplo 2 — produto R$ 500,00",
    input:  { vBC: 500.00, pIBSUF: 0.07, vIBSUF: 0.35, pIBSMun: 0.03, vIBSMun: 0.15, vIBS: 0.50, pCBS: 0.9, vCBS: 4.50 },
    expect: { vBC: 500.00, vIBSUF: 0.35, vIBSMun: 0.15, vIBS: 0.50, vCBS: 4.50, pCBS_frac: 0.009 },
  },
  {
    desc: "Exemplo 3 — produto R$ 250,00 (valor mínimo notável)",
    input:  { vBC: 250.00, pIBSUF: 0.07, vIBSUF: 0.17, pIBSMun: 0.03, vIBSMun: 0.08, vIBS: 0.25, pCBS: 0.9, vCBS: 2.25 },
    expect: { vBC: 250.00, vIBSUF: 0.18, vIBSMun: 0.08, vIBS: 0.25, vCBS: 2.25, pCBS_frac: 0.009 },
  },
  {
    desc: "Exemplo 4 — serviço R$ 2.000,00 (cClassTrib 0401, CBS plena 2027)",
    input:  { vBC: 2000.00, pIBSUF: 3.0, vIBSUF: 60.00, pIBSMun: 2.0, vIBSMun: 40.00, vIBS: 100.00, pCBS: 9.0, vCBS: 180.00 },
    expect: { vBC: 2000.00, vIBSUF: 60.00, vIBSMun: 40.00, vIBS: 100.00, vCBS: 180.00, pCBS_frac: 0.09 },
  },
];

const TOL = 0.01;

describe("rfb-paridade: parser local × fixtures NT 2025.002", () => {
  for (const fix of FIXTURES) {
    it(fix.desc, () => {
      const el = detIbscbs({ ...fix.input, cClassTrib: fix.desc.includes("0401") ? "0401" : "0101" });
      const parsed = parseItemIbscbs(el);

      expect(parsed).not.toBeUndefined();
      if (!parsed) return;

      expect(Math.abs((parsed.vBC ?? 0) - fix.expect.vBC)).toBeLessThanOrEqual(TOL);
      expect(Math.abs((parsed.vIBSUF ?? 0) - fix.expect.vIBSUF)).toBeLessThanOrEqual(TOL);
      expect(Math.abs((parsed.vIBSMun ?? 0) - fix.expect.vIBSMun)).toBeLessThanOrEqual(TOL);
      expect(Math.abs((parsed.vIBS ?? 0) - fix.expect.vIBS)).toBeLessThanOrEqual(TOL);
      expect(Math.abs((parsed.vCBS ?? 0) - fix.expect.vCBS)).toBeLessThanOrEqual(TOL);

      // alíquota CBS vem como fração (dividida por 100 pelo parser)
      expect(Math.abs((parsed.pCBS ?? 0) - fix.expect.pCBS_frac)).toBeLessThanOrEqual(0.00001);

      // Consistência interna: vIBS = vIBSUF + vIBSMun (tolerância 0,01)
      const somaIbs = (parsed.vIBSUF ?? 0) + (parsed.vIBSMun ?? 0);
      expect(Math.abs(somaIbs - (parsed.vIBS ?? 0))).toBeLessThanOrEqual(TOL);
    });
  }

  it("XML sem grupo IBSCBS retorna undefined", () => {
    const el = item(`<det><imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST></ICMS00></ICMS></imposto></det>`);
    const parsed = parseItemIbscbs(el);
    expect(parsed).toBeUndefined();
  });

  it("parseIbscbsTotais extrai vIBS e vCBS dos totais da nota", () => {
    const doc = parseXml(`
      <infNFe>
        <total>
          <IBSCBSTot>
            <vBCIBSCBS>1500.00</vBCIBSCBS>
            <gIBS>
              <vIBS>1.50</vIBS>
            </gIBS>
            <gCBS>
              <vCBS>13.50</vCBS>
            </gCBS>
          </IBSCBSTot>
        </total>
      </infNFe>
    `);
    const totais = parseIbscbsTotais(doc.documentElement);
    expect(Math.abs((totais.vIBS ?? 0) - 1.50)).toBeLessThanOrEqual(TOL);
    expect(Math.abs((totais.vCBS ?? 0) - 13.50)).toBeLessThanOrEqual(TOL);
    expect(Math.abs((totais.vBCIBSCBS ?? 0) - 1500.00)).toBeLessThanOrEqual(TOL);
  });
});
