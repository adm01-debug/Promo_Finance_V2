import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { gunzipBase64, gzipBase64, corruptedGzipBase64 } from "../gunzip.ts";
import { installSefazSoapMock } from "./soap-mock.ts";

const PROC_NFE_OK = await Deno.readTextFile(
  new URL("../__fixtures__/procNFe-ok.xml", import.meta.url),
);
const PROC_EVENTO = await Deno.readTextFile(
  new URL("../__fixtures__/procEventoNFe-ciencia.xml", import.meta.url),
);

Deno.test("gzip round-trip bit-a-bit igual ao XML original", async () => {
  const b64 = await gzipBase64(PROC_NFE_OK);
  const back = await gunzipBase64(b64);
  assertEquals(back, PROC_NFE_OK);
});

Deno.test("gzip corrompido lança ao descomprimir", async () => {
  await assertRejects(() => gunzipBase64(corruptedGzipBase64()));
});

Deno.test("mock SEFAZ: batch consome fila e responde 138 com docZip", async () => {
  const handle = installSefazSoapMock([
    {
      cnpj: "11222333000181",
      responses: [
        {
          kind: "batch",
          docs: [{ xml: PROC_NFE_OK, nsu: 101 }, { xml: PROC_EVENTO, nsu: 102 }],
          ultNSU: 102,
          maxNSU: 250,
        },
      ],
    },
  ]);
  try {
    const soap = `<?xml version="1.0"?><Env><CNPJ>11222333000181</CNPJ><ultNSU>000000000000100</ultNSU></Env>`;
    const res = await fetch("https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx", {
      method: "POST",
      body: soap,
      headers: { "Content-Type": "application/soap+xml" },
    });
    const body = await res.text();
    assertEquals(res.status, 200);
    assertEquals(body.includes("<cStat>138</cStat>"), true);
    assertEquals(body.includes("<ultNSU>000000000000102</ultNSU>"), true);
    assertEquals(handle.calls.length, 1);
    assertEquals(handle.calls[0].cnpj, "11222333000181");
    assertEquals(handle.remaining("11222333000181"), 0);
  } finally {
    handle.restore();
  }
});

Deno.test("mock SEFAZ: fila esgotada lança erro claro", async () => {
  const handle = installSefazSoapMock([
    { cnpj: "11222333000181", responses: [{ kind: "empty" }] },
  ]);
  try {
    const soap = `<Env><CNPJ>11222333000181</CNPJ></Env>`;
    await fetch("https://www1.nfe.fazenda.gov.br/x", { method: "POST", body: soap });
    await assertRejects(
      () => fetch("https://www1.nfe.fazenda.gov.br/x", { method: "POST", body: soap }),
      Error,
      "Fila esgotada",
    );
  } finally {
    handle.restore();
  }
});

Deno.test("mock SEFAZ: kind=empty devolve cStat=137", async () => {
  const handle = installSefazSoapMock([
    { cnpj: "11222333000181", responses: [{ kind: "empty" }] },
  ]);
  try {
    const res = await fetch("https://www1.nfe.fazenda.gov.br/x", {
      method: "POST",
      body: "<Env><CNPJ>11222333000181</CNPJ></Env>",
    });
    const body = await res.text();
    assertEquals(body.includes("<cStat>137</cStat>"), true);
  } finally {
    handle.restore();
  }
});

Deno.test("mock SEFAZ: kind=network_error rejeita a chamada", async () => {
  const handle = installSefazSoapMock([
    { cnpj: "11222333000181", responses: [{ kind: "network_error" }] },
  ]);
  try {
    await assertRejects(() =>
      fetch("https://www1.nfe.fazenda.gov.br/x", {
        method: "POST",
        body: "<Env><CNPJ>11222333000181</CNPJ></Env>",
      }),
    );
  } finally {
    handle.restore();
  }
});

Deno.test("mock SEFAZ: kind=gzip_corrupt entrega envelope com docZip inválido", async () => {
  const handle = installSefazSoapMock([
    {
      cnpj: "11222333000181",
      responses: [{ kind: "gzip_corrupt", docs: [{ xml: PROC_NFE_OK, nsu: 200 }] }],
    },
  ]);
  try {
    const res = await fetch("https://www1.nfe.fazenda.gov.br/x", {
      method: "POST",
      body: "<Env><CNPJ>11222333000181</CNPJ></Env>",
    });
    const body = await res.text();
    const m = body.match(/<docZip[^>]*>([^<]+)<\/docZip>/);
    assertEquals(!!m, true);
    await assertRejects(() => gunzipBase64(m![1]));
  } finally {
    handle.restore();
  }
});

Deno.test("mock SEFAZ: kind=nsu_gap salta ultNSU >1 em relação ao anterior", async () => {
  const handle = installSefazSoapMock([
    {
      cnpj: "11222333000181",
      responses: [
        { kind: "batch", docs: [{ xml: PROC_NFE_OK, nsu: 100 }], ultNSU: 100, maxNSU: 100 },
        { kind: "nsu_gap", docs: [{ xml: PROC_NFE_OK }], ultNSU: 600, maxNSU: 600 },
      ],
    },
  ]);
  try {
    await (await fetch("https://www1.nfe.fazenda.gov.br/x", {
      method: "POST",
      body: "<Env><CNPJ>11222333000181</CNPJ></Env>",
    })).text();
    const res2 = await fetch("https://www1.nfe.fazenda.gov.br/x", {
      method: "POST",
      body: "<Env><CNPJ>11222333000181</CNPJ></Env>",
    });
    const body = await res2.text();
    assertEquals(body.includes("<ultNSU>000000000000600</ultNSU>"), true);
  } finally {
    handle.restore();
  }
});

Deno.test("mock SEFAZ: kind=malformed_envelope devolve XML truncado", async () => {
  const handle = installSefazSoapMock([
    { cnpj: "11222333000181", responses: [{ kind: "malformed_envelope" }] },
  ]);
  try {
    const res = await fetch("https://www1.nfe.fazenda.gov.br/x", {
      method: "POST",
      body: "<Env><CNPJ>11222333000181</CNPJ></Env>",
    });
    const body = await res.text();
    assertEquals(body.includes("</retDistDFeInt>"), false);
  } finally {
    handle.restore();
  }
});
