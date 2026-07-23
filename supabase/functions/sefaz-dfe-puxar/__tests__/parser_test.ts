import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectSchema, parseDoc } from "../../_shared/sefaz/parser.ts";

Deno.test("detectSchema identifica procNFe, resNFe e procEventoNFe", async () => {
  const nfe = await Deno.readTextFile(
    new URL("../../_shared/sefaz/__fixtures__/procNFe-ok.xml", import.meta.url),
  );
  const res = await Deno.readTextFile(
    new URL("../../_shared/sefaz/__fixtures__/resNFe-resumo.xml", import.meta.url),
  );
  const ev = await Deno.readTextFile(
    new URL("../../_shared/sefaz/__fixtures__/procEventoNFe-ciencia.xml", import.meta.url),
  );
  assertEquals(detectSchema(nfe), "procNFe");
  assertEquals(detectSchema(res), "resNFe");
  assertEquals(detectSchema(ev), "procEventoNFe");
});

Deno.test("parseDoc extrai chave de 44 dígitos de procNFe", async () => {
  const xml = await Deno.readTextFile(
    new URL("../../_shared/sefaz/__fixtures__/procNFe-ok.xml", import.meta.url),
  );
  const parsed = parseDoc(xml);
  assertEquals(parsed?.kind, "nfe");
  if (parsed?.kind === "nfe") {
    assertEquals(parsed.chaveAcesso.length, 44);
    assertEquals(parsed.xmlCompleto, true);
    assertEquals(parsed.schemaTipo, "procNFe");
  }
});

Deno.test("parseDoc devolve null para XML sem schema conhecido", () => {
  assertEquals(parseDoc("<foo><bar/></foo>"), null);
});
