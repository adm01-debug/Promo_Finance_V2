import type { DiffField, DiffResult } from '@/lib/audit-diff';
import { formatValue } from './format';

interface Args {
  action?: string | null;
  tipoLabel: string;
  camposChave: Array<{ key: string; value: unknown }>;
  changedKeyFields: Map<string, DiffField>;
  isInsert: boolean;
  isDelete: boolean;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  diff: DiffResult;
}

export function buildResumo({
  action,
  tipoLabel,
  camposChave,
  changedKeyFields,
  isInsert,
  isDelete,
  oldData,
  newData,
  diff,
}: Args): string {
  const lines: string[] = [];
  lines.push(`Auditoria: ${tipoLabel}`);
  if (action) lines.push(`Ação: ${action}`);

  if (camposChave.length > 0) {
    lines.push('');
    lines.push('Campos-chave:');
    for (const c of camposChave) {
      const ch = changedKeyFields.get(c.key);
      if (ch && ch.kind === 'changed') {
        lines.push(`  • ${c.key}: ${formatValue(ch.before)} → ${formatValue(ch.after)} (alterado)`);
      } else if (ch && ch.kind === 'added') {
        lines.push(`  • ${c.key}: ${formatValue(ch.after)} (adicionado)`);
      } else if (ch && ch.kind === 'removed') {
        lines.push(`  • ${c.key}: ${formatValue(ch.before)} (removido)`);
      } else {
        lines.push(`  • ${c.key}: ${formatValue(c.value)}`);
      }
    }
  }

  if (isInsert && newData) {
    lines.push('');
    lines.push('Valores criados:');
    for (const [k, v] of Object.entries(newData)) lines.push(`  + ${k}: ${formatValue(v)}`);
  } else if (isDelete && oldData) {
    lines.push('');
    lines.push('Valores excluídos:');
    for (const [k, v] of Object.entries(oldData)) lines.push(`  - ${k}: ${formatValue(v)}`);
  } else {
    if (diff.changed.length > 0) {
      lines.push('');
      lines.push(`Alterações (${diff.changed.length}):`);
      for (const f of diff.changed) lines.push(`  ~ ${f.key}: ${formatValue(f.before)} → ${formatValue(f.after)}`);
    }
    if (diff.added.length > 0) {
      lines.push('');
      lines.push(`Adicionados (${diff.added.length}):`);
      for (const f of diff.added) lines.push(`  + ${f.key}: ${formatValue(f.after)}`);
    }
    if (diff.removed.length > 0) {
      lines.push('');
      lines.push(`Removidos (${diff.removed.length}):`);
      for (const f of diff.removed) lines.push(`  - ${f.key}: ${formatValue(f.before)}`);
    }
  }
  return lines.join('\n');
}
