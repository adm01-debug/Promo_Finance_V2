// Testes Deno (unit) — módulo de manifestação SEFAZ (Fase 4 NFe).
import { assert, assertEquals, assertStringIncludes, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildEnvEvento,
  buildInfEvento,
  MANIF_DESCRICAO,
  parseRetEnvEvento,
  recepcaoEventoEndpoint,
  tipoToStatus,
} from "../manifestacao.ts";

Deno.test("buildInfEvento gera Id ID<tipo><chave><seq2>", () => {
  const chave = "3".padEnd(44, "0");
  const { infEvento, id } = buildInfEvento({
    tipo: "210210",
    chaveAcesso: chave,
    cnpjAutor: "12345678000199",
    ambiente: "homologacao",
    sequencial: 1,
    dataEvento: new Date("2026-01-15T12:00:00Z"),
  });
  assertEquals(id, `ID210210${chave}01`);
  assertStringIncludes(infEvento, `Id="${id}"`);
  assertStringIncludes(infEvento, "<tpEvento>210210</tpEvento>");
  assertStringIncludes(infEvento, "<tpAmb>2</tpAmb>");
  assertStringIncludes(infEvento, `<descEvento>${MANIF_DESCRICAO["210210"]}</descEvento>`);
});

Deno.test("buildInfEvento inclui xJust apenas em 210240", () => {
  const chave = "5".padEnd(44, "0");
  const semJust = buildInfEvento({
    tipo: "210220",
    chaveAcesso: chave,
    cnpjAutor: "12345678000199",
    ambiente: "producao",
    justificativa: "não deveria aparecer aqui",
  });
  assert(!semJust.infEvento.includes("<xJust>"));

  const comJust = buildInfEvento({
    tipo: "210240",
    chaveAcesso: chave,
    cnpjAutor: "12345678000199",
    ambiente: "producao",
    justificativa: "compra cancelada pelo comprador oficial",
  });
  assertStringIncludes(comJust.infEvento, "<xJust>compra cancelada pelo comprador oficial</xJust>");
});

Deno.test("buildEnvEvento serializa envelope SOAP", () => {
  const env = buildEnvEvento("<evento>x</evento>", "999");
  assertStringIncludes(env, "<soap:Envelope");
  assertStringIncludes(env, "<idLote>999</idLote>");
  assertStringIncludes(env, "<envEvento");
  assertStringIncludes(env, "<evento>x</evento>");
});

Deno.test("recepcaoEventoEndpoint distingue produção/homologação", () => {
  assert(recepcaoEventoEndpoint("producao").startsWith("https://www1.nfe.fazenda.gov.br"));
  assert(recepcaoEventoEndpoint("homologacao").startsWith("https://hom.nfe.fazenda.gov.br"));
});

Deno.test("parseRetEnvEvento extrai cStat/nProt do retEvento", () => {
  const xml = `
    <retEnvEvento versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">
      <idLote>123</idLote>
      <tpAmb>2</tpAmb>
      <cStat>128</cStat>
      <xMotivo>Lote de Evento Processado</xMotivo>
      <retEvento versao="1.00">
        <infEvento>
          <tpAmb>2</tpAmb>
          <cStat>135</cStat>
          <xMotivo>Evento registrado e vinculado a NF-e</xMotivo>
          <nProt>135240000000001</nProt>
          <dhRegEvento>2026-01-15T09:00:00-03:00</dhRegEvento>
        </infEvento>
      </retEvento>
    </retEnvEvento>`;
  const r = parseRetEnvEvento(xml);
  assertEquals(r.cStatLote, "128");
  assertEquals(r.cStatEvento, "135");
  assertEquals(r.nProt, "135240000000001");
  assertEquals(r.tpAmb, "2");
});

Deno.test("tipoToStatus mapeia todos os 4 eventos", () => {
  assertEquals(tipoToStatus("210210"), "ciencia");
  assertEquals(tipoToStatus("210200"), "confirmada");
  assertEquals(tipoToStatus("210220"), "desconhecida");
  assertEquals(tipoToStatus("210240"), "nao_realizada");
});
