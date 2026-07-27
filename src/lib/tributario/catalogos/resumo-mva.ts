/**
 * RESUMO DE COBERTURA DO OVERLAY DE MVA/ST
 *
 * Módulo puro que agrega o resultado de `aplicarOverlayMvaSt` em indicadores
 * de cobertura para o painel administrativo: quantos protocolos produzem
 * efeito, quais NCMs estão amparados, a faixa de MVA praticada e quais UFs
 * ficam de fora (lacunas de carga).
 *
 * Não faz I/O e não conhece React — apenas transforma dados já validados.
 */

import type { ResultadoOverlayMva, EntradaMvaSt } from '@/lib/tributario/icms/overlay-mva';
import type { UF } from '@/lib/tributario/icms/types';
import { UFS } from '@/lib/tributario/icms/tabelas';

export interface ProtocoloResumido {
  protocoloId: string;
  protocoloCodigo: string;
  /** NCMs amparados pelo protocolo, ordenados. */
  ncms: string[];
  /** MVA mínima e máxima praticada no protocolo (fração). */
  mvaMinima: number;
  mvaMaxima: number;
  origens: UF[];
  destinos: UF[];
  /** UFs que não constam como remetentes nem destinatárias. */
  ufsAusentes: UF[];
}

export interface ResumoMvaSt {
  protocolos: ProtocoloResumido[];
  totalProtocolos: number;
  totalVinculos: number;
  totalNcms: number;
  totalRejeicoes: number;
  totalBloqueios: number;
  /** UFs cobertas por ao menos um protocolo, em qualquer papel. */
  ufsCobertas: UF[];
  /** UFs sem nenhum protocolo cadastrado — indicam carga incompleta. */
  ufsSemCobertura: UF[];
  situacao: 'ok' | 'parcial' | 'vazio';
}

function ordenarUfs(set: Set<UF>): UF[] {
  return UFS.filter((uf) => set.has(uf));
}

/** Agrega as entradas aplicadas do overlay por protocolo. */
export function resumirOverlayMvaSt(overlay: ResultadoOverlayMva): ResumoMvaSt {
  const porProtocolo = new Map<string, EntradaMvaSt[]>();
  for (const entrada of overlay.aplicadas) {
    const lista = porProtocolo.get(entrada.protocoloId) ?? [];
    lista.push(entrada);
    porProtocolo.set(entrada.protocoloId, lista);
  }

  const cobertas = new Set<UF>();
  const protocolos: ProtocoloResumido[] = [];

  for (const [protocoloId, entradas] of porProtocolo) {
    const origens = new Set<UF>();
    const destinos = new Set<UF>();
    const ncms = new Set<string>();
    let mvaMinima = Number.POSITIVE_INFINITY;
    let mvaMaxima = 0;

    for (const e of entradas) {
      ncms.add(e.ncm);
      e.origens.forEach((uf) => { origens.add(uf); cobertas.add(uf); });
      e.destinos.forEach((uf) => { destinos.add(uf); cobertas.add(uf); });
      mvaMinima = Math.min(mvaMinima, e.mvaOriginal);
      mvaMaxima = Math.max(mvaMaxima, e.mvaOriginal);
    }

    const presentes = new Set<UF>([...origens, ...destinos]);
    protocolos.push({
      protocoloId,
      protocoloCodigo: entradas[0]?.protocoloCodigo ?? protocoloId,
      ncms: [...ncms].sort(),
      mvaMinima: Number.isFinite(mvaMinima) ? mvaMinima : 0,
      mvaMaxima,
      origens: ordenarUfs(origens),
      destinos: ordenarUfs(destinos),
      ufsAusentes: UFS.filter((uf) => !presentes.has(uf)),
    });
  }

  protocolos.sort((a, b) => a.protocoloCodigo.localeCompare(b.protocoloCodigo, 'pt-BR'));

  const ncmsDistintos = new Set(overlay.aplicadas.map((e) => e.ncm));
  const ufsSemCobertura = UFS.filter((uf) => !cobertas.has(uf));

  const situacao: ResumoMvaSt['situacao'] = protocolos.length === 0
    ? 'vazio'
    : (overlay.rejeitadas.length > 0 || ufsSemCobertura.length > 0 ? 'parcial' : 'ok');

  return {
    protocolos,
    totalProtocolos: protocolos.length,
    totalVinculos: overlay.aplicadas.length,
    totalNcms: ncmsDistintos.size,
    totalRejeicoes: overlay.rejeitadas.length,
    totalBloqueios: overlay.bloqueadas.length,
    ufsCobertas: ordenarUfs(cobertas),
    ufsSemCobertura,
    situacao,
  };
}

/** Formata a faixa de MVA de um protocolo para exibição. */
export function formatarFaixaMva(protocolo: ProtocoloResumido): string {
  const min = (protocolo.mvaMinima * 100).toFixed(2);
  const max = (protocolo.mvaMaxima * 100).toFixed(2);
  return min === max ? `${min}%` : `${min}% a ${max}%`;
}
