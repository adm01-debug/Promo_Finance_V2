/**
 * Helper de storage para XMLs de NF-e.
 *
 * Layout ÚNICO (bucket privado):
 *   nfe-xml/{empresa_id UUID}/{chave 44 dígitos}.xml
 *
 * Eventos (Fase 4) reservam o padrão:
 *   nfe-xml/{empresa_id UUID}/{chave 44 dígitos}-ev-{seq}.xml
 *
 * O puller (Fase 2) DEVE chamar `uploadNfeXml` antes de comitar
 * `nfe_recebidas` e usar o `path` retornado em `xml_path`.
 *
 * Escritas exigem `service_role` (Edge Function). Leituras autenticadas
 * são restritas por `user_empresas` via policy em `storage.objects`.
 */

// deno-lint-ignore no-explicit-any
type SupabaseLike = any;

export const NFE_XML_BUCKET = "nfe-xml" as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHAVE_RE = /^[0-9]{44}$/;

export class NfeXmlPathError extends Error {
  code: "invalid_empresa" | "invalid_chave" | "invalid_path";
  constructor(code: NfeXmlPathError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "NfeXmlPathError";
  }
}

export interface XmlPathParts {
  empresaId: string;
  chave: string;
  eventoSeq?: number;
}

export function buildXmlPath(empresaId: string, chave: string): string {
  if (!UUID_RE.test(empresaId)) {
    throw new NfeXmlPathError("invalid_empresa", `empresa_id inválido: ${empresaId}`);
  }
  if (!CHAVE_RE.test(chave)) {
    throw new NfeXmlPathError("invalid_chave", `chave de acesso inválida: ${chave}`);
  }
  return `${empresaId.toLowerCase()}/${chave}.xml`;
}

export function buildEventoXmlPath(
  empresaId: string,
  chave: string,
  seq: number,
): string {
  if (!Number.isInteger(seq) || seq < 1 || seq > 999) {
    throw new NfeXmlPathError("invalid_path", `sequencial de evento inválido: ${seq}`);
  }
  if (!UUID_RE.test(empresaId) || !CHAVE_RE.test(chave)) {
    throw new NfeXmlPathError("invalid_path", "empresa_id ou chave inválidos");
  }
  return `${empresaId.toLowerCase()}/${chave}-ev-${seq}.xml`;
}

export function parseXmlPath(path: string): XmlPathParts {
  const m = path.match(
    /^([0-9a-f-]{36})\/([0-9]{44})(?:-ev-([0-9]+))?\.xml$/i,
  );
  if (!m) throw new NfeXmlPathError("invalid_path", `path fora do layout: ${path}`);
  return {
    empresaId: m[1].toLowerCase(),
    chave: m[2],
    eventoSeq: m[3] ? Number(m[3]) : undefined,
  };
}

export interface UploadArgs {
  empresaId: string;
  chave: string;
  xml: string | Uint8Array;
  contentType?: string;
  eventoSeq?: number;
}

export async function uploadNfeXml(
  admin: SupabaseLike,
  args: UploadArgs,
): Promise<{ path: string }> {
  const path = args.eventoSeq
    ? buildEventoXmlPath(args.empresaId, args.chave, args.eventoSeq)
    : buildXmlPath(args.empresaId, args.chave);

  const body =
    typeof args.xml === "string" ? new TextEncoder().encode(args.xml) : args.xml;

  const { error } = await admin.storage.from(NFE_XML_BUCKET).upload(path, body, {
    contentType: args.contentType ?? "application/xml",
    cacheControl: "private, max-age=0",
    upsert: true,
  });
  if (error) throw new Error(`upload nfe-xml falhou (${path}): ${error.message}`);
  return { path };
}

export async function downloadNfeXmlSignedUrl(
  client: SupabaseLike,
  args: { empresaId: string; chave: string; eventoSeq?: number; expiresIn?: number },
): Promise<string> {
  const path = args.eventoSeq
    ? buildEventoXmlPath(args.empresaId, args.chave, args.eventoSeq)
    : buildXmlPath(args.empresaId, args.chave);
  const { data, error } = await client.storage
    .from(NFE_XML_BUCKET)
    .createSignedUrl(path, args.expiresIn ?? 60);
  if (error || !data?.signedUrl) {
    throw new Error(`signed url nfe-xml falhou (${path}): ${error?.message ?? "sem url"}`);
  }
  return data.signedUrl;
}

export async function deleteNfeXml(
  admin: SupabaseLike,
  args: { empresaId: string; chave: string; eventoSeq?: number },
): Promise<void> {
  const path = args.eventoSeq
    ? buildEventoXmlPath(args.empresaId, args.chave, args.eventoSeq)
    : buildXmlPath(args.empresaId, args.chave);
  const { error } = await admin.storage.from(NFE_XML_BUCKET).remove([path]);
  if (error) throw new Error(`delete nfe-xml falhou (${path}): ${error.message}`);
}
