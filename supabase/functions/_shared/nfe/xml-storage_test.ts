import { assertEquals, assertThrows, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  buildEventoXmlPath,
  buildXmlPath,
  downloadNfeXmlSignedUrl,
  NfeXmlPathError,
  parseXmlPath,
  uploadNfeXml,
} from "./xml-storage.ts";

const EMP = "11111111-2222-3333-4444-555555555555";
const CHAVE = "35260600000000000000550010000000011000000001";

Deno.test("buildXmlPath monta layout {empresa}/{chave}.xml", () => {
  assertEquals(buildXmlPath(EMP, CHAVE), `${EMP}/${CHAVE}.xml`);
});

Deno.test("buildXmlPath rejeita empresa não-UUID", () => {
  assertThrows(() => buildXmlPath("emp-1", CHAVE), NfeXmlPathError);
});

Deno.test("buildXmlPath rejeita chave != 44 dígitos", () => {
  assertThrows(() => buildXmlPath(EMP, "123"), NfeXmlPathError);
  assertThrows(() => buildXmlPath(EMP, CHAVE + "X"), NfeXmlPathError);
});

Deno.test("buildEventoXmlPath valida sequencial", () => {
  assertEquals(buildEventoXmlPath(EMP, CHAVE, 1), `${EMP}/${CHAVE}-ev-1.xml`);
  assertThrows(() => buildEventoXmlPath(EMP, CHAVE, 0), NfeXmlPathError);
  assertThrows(() => buildEventoXmlPath(EMP, CHAVE, 1000), NfeXmlPathError);
});

Deno.test("parseXmlPath inverte buildXmlPath", () => {
  const p = buildXmlPath(EMP, CHAVE);
  const parts = parseXmlPath(p);
  assertEquals(parts.empresaId, EMP);
  assertEquals(parts.chave, CHAVE);
  assertEquals(parts.eventoSeq, undefined);
});

Deno.test("parseXmlPath extrai evento", () => {
  const parts = parseXmlPath(`${EMP}/${CHAVE}-ev-3.xml`);
  assertEquals(parts.eventoSeq, 3);
});

Deno.test("parseXmlPath rejeita path fora do layout", () => {
  assertThrows(() => parseXmlPath(`${EMP}/2026-01/${CHAVE}.xml`), NfeXmlPathError);
  assertThrows(() => parseXmlPath(`${EMP}/foo.xml`), NfeXmlPathError);
});

// Fake client mimicking supabase-js storage
function fakeAdmin(recorder: { calls: unknown[]; fail?: string }) {
  return {
    storage: {
      from(bucket: string) {
        return {
          upload(path: string, body: Uint8Array, opts: unknown) {
            recorder.calls.push({ op: "upload", bucket, path, size: body.length, opts });
            return Promise.resolve(
              recorder.fail
                ? { error: { message: recorder.fail } }
                : { data: { path }, error: null },
            );
          },
          createSignedUrl(path: string, expiresIn: number) {
            recorder.calls.push({ op: "sign", bucket, path, expiresIn });
            return Promise.resolve({
              data: { signedUrl: `https://x/${path}?exp=${expiresIn}` },
              error: null,
            });
          },
          remove(paths: string[]) {
            recorder.calls.push({ op: "remove", bucket, paths });
            return Promise.resolve({ data: null, error: null });
          },
        };
      },
    },
  };
}

Deno.test("uploadNfeXml usa layout correto, bucket nfe-xml e upsert idempotente", async () => {
  const rec = { calls: [] as unknown[] };
  const admin = fakeAdmin(rec);
  const r1 = await uploadNfeXml(admin, { empresaId: EMP, chave: CHAVE, xml: "<x/>" });
  const r2 = await uploadNfeXml(admin, { empresaId: EMP, chave: CHAVE, xml: "<x/>" });
  assertEquals(r1.path, `${EMP}/${CHAVE}.xml`);
  assertEquals(r1.path, r2.path);
  const first = rec.calls[0] as { bucket: string; opts: { upsert: boolean; contentType: string } };
  assertEquals(first.bucket, "nfe-xml");
  assertEquals(first.opts.upsert, true);
  assertEquals(first.opts.contentType, "application/xml");
});

Deno.test("uploadNfeXml propaga erro do storage", async () => {
  const admin = fakeAdmin({ calls: [], fail: "bucket not found" });
  await assertRejects(
    () => uploadNfeXml(admin, { empresaId: EMP, chave: CHAVE, xml: "<x/>" }),
    Error,
    "bucket not found",
  );
});

Deno.test("uploadNfeXml rejeita chave inválida antes de tocar storage", async () => {
  const rec = { calls: [] as unknown[] };
  const admin = fakeAdmin(rec);
  await assertRejects(
    () => uploadNfeXml(admin, { empresaId: EMP, chave: "curta", xml: "<x/>" }),
    NfeXmlPathError,
  );
  assertEquals(rec.calls.length, 0);
});

Deno.test("downloadNfeXmlSignedUrl usa expires 60 por padrão", async () => {
  const rec = { calls: [] as unknown[] };
  const url = await downloadNfeXmlSignedUrl(fakeAdmin(rec), {
    empresaId: EMP,
    chave: CHAVE,
  });
  assertEquals(url.includes("exp=60"), true);
});
