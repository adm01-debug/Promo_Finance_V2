/**
 * Carregamento de certificado A1 (PFX) para uso em mTLS via Deno.
 *
 * Fluxo:
 *   1. Baixa PFX do bucket privado `nfe-certificados`.
 *   2. Descriptografa a senha via RPC `certificado_get_password`
 *      (que usa `pgcrypto` + `NFE_CERT_MASTER_KEY`).
 *   3. Converte PFX → PEM (cert + chave privada) usando `node-forge`.
 *   4. Devolve tudo pronto para `Deno.createHttpClient({ cert, key })`.
 *
 * Este módulo NÃO cria o `HttpClient` — apenas devolve os PEMs, para
 * manter testabilidade pura (o consumidor injeta o factory).
 */

// deno-lint-ignore-file no-explicit-any
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
// `node-forge` é carregado dinamicamente em `pfxToPem` para não exigir a
// dependência em testes locais que só exercitam parsing/soap.

export interface CertificadoRow {
  id: string;
  empresa_id: string;
  cnpj: string;
  razao_social: string;
  uf: string;
  ambiente: "homologacao" | "producao";
  valido_de: string;
  valido_ate: string;
  pfx_storage_path: string;
}

export interface CertificadoPem {
  certPem: string;
  keyPem: string;
  caPem: string | null;
  cnpj: string;
  uf: string;
  ambiente: "homologacao" | "producao";
  empresaId: string;
}

export function makeAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchPfxBytes(
  admin: SupabaseClient,
  storagePath: string,
): Promise<Uint8Array> {
  const { data, error } = await admin.storage.from("nfe-certificados").download(storagePath);
  if (error || !data) throw new Error(`storage_download_failed: ${error?.message ?? "unknown"}`);
  return new Uint8Array(await data.arrayBuffer());
}

async function fetchPfxPassword(
  admin: SupabaseClient,
  certId: string,
): Promise<string> {
  const masterKey = Deno.env.get("NFE_CERT_MASTER_KEY");
  if (!masterKey) throw new Error("NFE_CERT_MASTER_KEY ausente");
  const { data, error } = await admin.rpc("certificado_get_password", {
    p_cert_id: certId,
    p_master_key: masterKey,
  });
  if (error || typeof data !== "string" || !data) {
    throw new Error(`password_decrypt_failed: ${error?.message ?? "empty"}`);
  }
  return data;
}

/** Converte bytes PFX + senha em PEM (cert + key). */
export async function pfxToPem(pfxBytes: Uint8Array, password: string): Promise<{
  certPem: string;
  keyPem: string;
  caPem: string | null;
}> {
  const forgeSpecifier = "npm:node-forge@1.3.1";
  const forgeMod: any = await import(forgeSpecifier);


  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < pfxBytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(pfxBytes.subarray(i, i + chunk)) as unknown as number[],
    );
  }
  const asn1 = forge.asn1.fromDer(binary);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag }).certBag ?? [];
  const keyBags =
    p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag }).pkcs8ShroudedKeyBag ??
    p12.getBags({ bagType: forge.pki.oids.keyBag }).keyBag ??
    [];

  if (certBags.length === 0 || keyBags.length === 0) {
    throw new Error("pfx_missing_cert_or_key");
  }

  const [leaf, ...rest] = certBags.map((b: any) => b.cert);
  const key = keyBags[0].key;

  const certPem = forge.pki.certificateToPem(leaf);
  const keyPem = forge.pki.privateKeyToPem(key);
  const caPem = rest.length > 0
    ? rest.map((c: any) => forge.pki.certificateToPem(c)).join("")
    : null;

  return { certPem, keyPem, caPem };
}


export async function loadCertificado(
  admin: SupabaseClient,
  cert: CertificadoRow,
): Promise<CertificadoPem> {
  const [pfxBytes, password] = await Promise.all([
    fetchPfxBytes(admin, cert.pfx_storage_path),
    fetchPfxPassword(admin, cert.id),
  ]);
  const pem = await pfxToPem(pfxBytes, password);
  return {
    ...pem,
    cnpj: cert.cnpj,
    uf: cert.uf,
    ambiente: cert.ambiente,
    empresaId: cert.empresa_id,
  };
}
