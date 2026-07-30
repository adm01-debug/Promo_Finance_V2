import type { Manifest } from "./types";

export async function sha256OfBytes(bytes: Uint8Array): Promise<string> {
  // Cópia para ArrayBuffer "puro" — evita o erro de SharedArrayBuffer no TS
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const buf = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isManifest(obj: unknown): obj is Manifest {
  if (!obj || typeof obj !== "object") return false;
  const m = obj as { arquivos?: unknown };
  if (!m.arquivos || typeof m.arquivos !== "object") return false;
  return Object.values(m.arquivos as Record<string, unknown>).every((v) => {
    if (!v || typeof v !== "object") return false;
    const a = v as { sha256?: unknown; linhas?: unknown };
    return typeof a.sha256 === "string" && typeof a.linhas === "number";
  });
}
