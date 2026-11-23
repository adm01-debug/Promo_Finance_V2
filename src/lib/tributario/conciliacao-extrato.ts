/**
 * Etapa 89 — Lógica de conciliação contra extrato de apuração assistida.
 *
 * Parser de CSV (cabeçalho: chave_acesso,cbs_credito,ibs_credito) e diff
 * por chave de acesso contra os créditos do sistema (origem=xml_destacado).
 */

export interface LinhaExtrato {
  chave_acesso: string;
  cbs_credito: number;
  ibs_credito: number;
}

export type StatusLinha = 'ok' | 'divergencia' | 'nao_encontrada';

export interface LinhaDiff {
  chave_acesso: string;
  status: StatusLinha;
  cbs_sistema: number | null;
  ibs_sistema: number | null;
  cbs_extrato: number;
  ibs_extrato: number;
  diff_cbs: number;
  diff_ibs: number;
}

export const TOLERANCIA = 0.01;

export function parseCsv(raw: string): LinhaExtrato[] {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].toLowerCase().split(sep).map((h) => h.trim());
  const iChave = header.findIndex((h) => h.includes('chave'));
  const iCbs = header.findIndex((h) => h.includes('cbs'));
  const iIbs = header.findIndex((h) => h.includes('ibs'));
  if (iChave < 0 || iCbs < 0 || iIbs < 0) return [];
  return lines.slice(1).flatMap((line) => {
    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
    const chave = (cols[iChave] ?? '').replace(/\D/g, '');
    if (chave.length < 44) return [];
    return [{
      chave_acesso: chave,
      cbs_credito: parseFloat(cols[iCbs] ?? '0') || 0,
      ibs_credito: parseFloat(cols[iIbs] ?? '0') || 0,
    }];
  });
}

export function buildDiff(
  extrato: LinhaExtrato[],
  creditos: { documento_chave: string | null; tipo_tributo: string; valor_credito: number | null }[],
): LinhaDiff[] {
  const mapCbs = new Map<string, number>();
  const mapIbs = new Map<string, number>();
  for (const c of creditos) {
    if (!c.documento_chave) continue;
    const chave = c.documento_chave.replace(/\D/g, '');
    const val = c.valor_credito ?? 0;
    const t = c.tipo_tributo.toUpperCase();
    if (t === 'CBS') mapCbs.set(chave, (mapCbs.get(chave) ?? 0) + val);
    if (t === 'IBS') mapIbs.set(chave, (mapIbs.get(chave) ?? 0) + val);
  }
  return extrato.map((e) => {
    const cbs_sis = mapCbs.get(e.chave_acesso) ?? null;
    const ibs_sis = mapIbs.get(e.chave_acesso) ?? null;
    const diff_cbs = Math.abs((cbs_sis ?? 0) - e.cbs_credito);
    const diff_ibs = Math.abs((ibs_sis ?? 0) - e.ibs_credito);
    const naoEncontrada = cbs_sis === null && ibs_sis === null;
    const status: StatusLinha = naoEncontrada
      ? 'nao_encontrada'
      : diff_cbs > TOLERANCIA || diff_ibs > TOLERANCIA
      ? 'divergencia'
      : 'ok';
    return { chave_acesso: e.chave_acesso, status, cbs_sistema: cbs_sis, ibs_sistema: ibs_sis, cbs_extrato: e.cbs_credito, ibs_extrato: e.ibs_credito, diff_cbs, diff_ibs };
  });
}
