import { assertEquals, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildDistDFeEnvelope,
  classifyCStat,
  parseDistDFeResponse,
} from "../../_shared/sefaz/soap.ts";

Deno.test("buildDistDFeEnvelope inclui CNPJ, tpAmb e ultNSU 15 dígitos", () => {
  const env = buildDistDFeEnvelope({
    ambiente: "homologacao",
    uf: "SP",
    cnpj: "12345678000199",
    ultNSU: 42,
  });
  assertMatch(env, /<CNPJ>12345678000199<\/CNPJ>/);
  assertMatch(env, /<tpAmb>2<\/tpAmb>/);
  assertMatch(env, /<cUFAutor>35<\/cUFAutor>/);
  assertMatch(env, /<ultNSU>000000000000042<\/ultNSU>/);
});

Deno.test("parseDistDFeResponse extrai cStat/ultNSU/maxNSU e docs", async () => {
  const xml = await Deno.readTextFile(
    new URL("../../_shared/sefaz/__fixtures__/retDistDFeInt-137.xml", import.meta.url),
  );
  const parsed = parseDistDFeResponse(xml);
  assertEquals(parsed.cStat, "137");
  assertEquals(parsed.docs.length, 0);
});

Deno.test("classifyCStat mapeia códigos corretamente", () => {
  assertEquals(classifyCStat("138"), "ok");
  assertEquals(classifyCStat("137"), "empty");
  assertEquals(classifyCStat("108"), "retry");
  assertEquals(classifyCStat("109"), "retry");
  assertEquals(classifyCStat("656"), "rate_limit");
  assertEquals(classifyCStat("999"), "fatal");
});

Deno.test("parseDistDFeResponse lança em envelope malformado", () => {
  let threw = false;
  try {
    parseDistDFeResponse("<html>oops</html>");
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});
