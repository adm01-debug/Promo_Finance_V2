import { runPuxador } from "./sefaz-dfe-puxar/index.ts";
import { installSefazSoapMock } from "./_shared/sefaz/__mocks__/soap-mock.ts";

const nfeXml = await Deno.readTextFile(new URL("./_shared/sefaz/__fixtures__/procNFe-ok.xml", import.meta.url));
const CNPJ = "11222333000181";
const mock = installSefazSoapMock([{
  cnpj: CNPJ,
  responses: [
    { kind: "batch", docs: [{ xml: nfeXml, nsu: 10 }], ultNSU: 10, maxNSU: 10 },
    { kind: "empty" },
  ],
}]);
const telemetry: any[] = [];
const cursor = { ultimo_nsu: 0, circuit_open: false, next_run_at: null };
const chain = (table: string): any => ({
  select() { return this; }, eq() { return this; }, gte() { return this; },
  maybeSingle: async () => table === "sefaz_dfe_cursor" ? { data: cursor, error: null } : { data: null, error: null },
  insert: async (row: any) => { console.error("INSERT", table); if (table==="query_telemetry") telemetry.push(row); return {data:null,error:null}; },
  upsert: () => ({ select: () => ({ maybeSingle: async () => ({data:{id:"x"},error:null}) }) }),
});
const stub: any = {
  from: chain,
  rpc: async (n: string, args: any) => {
    if (n === "sefaz_process_batch") {
      const novo = Number(args.p_novo_nsu);
      if (novo > cursor.ultimo_nsu) cursor.ultimo_nsu = novo;
      return { data: { cursor_antes: 0, cursor_depois: cursor.ultimo_nsu, novos: 1, eventos: 0, ignorados: 0 }, error: null };
    }
    return { data: null, error: null };
  },
  storage: { from: () => ({ upload: async () => ({data:{path:"x"},error:null}) }) },
};
const s = await runPuxador(stub, { id:"1", empresa_id:"e", cnpj:CNPJ, razao_social:"X", uf:"SP", ambiente:"homologacao" as const, valido_de:"", valido_ate:"2099-01-01", pfx_storage_path:"x" }, async (url, env) => {
  const r = await fetch(url, { method: "POST", body: env });
  return await r.text();
});
console.error("SUMMARY", s.docs, s.novos, "TELEMETRY LEN", telemetry.length);
mock.restore();
