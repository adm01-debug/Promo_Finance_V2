// Utilitário puro para diff de registros de auditoria.
// Compara apenas o 1º nível das chaves; objetos/arrays aninhados são
// serializados como JSON para a comparação textual.

export type DiffKind = "added" | "removed" | "changed" | "unchanged";

export interface DiffField {
  key: string;
  before: unknown;
  after: unknown;
  kind: DiffKind;
}

export interface DiffResult {
  added: DiffField[];
  removed: DiffField[];
  changed: DiffField[];
  unchanged: DiffField[];
}

const TECHNICAL_KEYS = new Set([
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "user_id",
  "tenant_id",
]);

function normalize(v: unknown): string {
  if (v === null || v === undefined) return "__null__";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function computeDiff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): DiffResult {
  const a = before ?? {};
  const b = after ?? {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const result: DiffResult = { added: [], removed: [], changed: [], unchanged: [] };

  for (const key of keys) {
    const inA = key in a;
    const inB = key in b;
    const va = a[key];
    const vb = b[key];

    if (inA && !inB) {
      result.removed.push({ key, before: va, after: undefined, kind: "removed" });
    } else if (!inA && inB) {
      result.added.push({ key, before: undefined, after: vb, kind: "added" });
    } else if (normalize(va) !== normalize(vb)) {
      result.changed.push({ key, before: va, after: vb, kind: "changed" });
    } else {
      result.unchanged.push({ key, before: va, after: vb, kind: "unchanged" });
    }
  }

  // Ordena: chaves técnicas no final
  const sortFn = (x: DiffField, y: DiffField) => {
    const xt = TECHNICAL_KEYS.has(x.key) ? 1 : 0;
    const yt = TECHNICAL_KEYS.has(y.key) ? 1 : 0;
    if (xt !== yt) return xt - yt;
    return x.key.localeCompare(y.key);
  };
  result.added.sort(sortFn);
  result.removed.sort(sortFn);
  result.changed.sort(sortFn);
  result.unchanged.sort(sortFn);

  return result;
}

// Campos que costumam justificar/identificar a operação
const PRIORITY_KEYS = [
  "valor",
  "valor_total",
  "valor_pago",
  "status",
  "situacao",
  "descricao",
  "titulo",
  "numero",
  "numero_documento",
  "competencia",
  "data_vencimento",
  "data_pagamento",
  "empresa_id",
  "cliente_nome",
  "fornecedor_nome",
  "user_email",
];

export interface CampoChave {
  key: string;
  value: unknown;
}

export function extractCamposChave(
  record: Record<string, unknown> | null | undefined,
): CampoChave[] {
  if (!record) return [];
  const out: CampoChave[] = [];
  for (const k of PRIORITY_KEYS) {
    if (k in record && record[k] !== null && record[k] !== undefined && record[k] !== "") {
      out.push({ key: k, value: record[k] });
    }
  }
  return out;
}

export function isEmptyDiff(d: DiffResult): boolean {
  return d.added.length === 0 && d.removed.length === 0 && d.changed.length === 0;
}
