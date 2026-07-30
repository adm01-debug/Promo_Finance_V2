// OVERLAY DE CATÁLOGO — Permite que as alíquotas do banco (fonte de verdade
// versionada) sobreponham as constantes do motor em tempo de execução, sem
// jamais deixar o cálculo inconsistente: qualquer registro inválido é
// rejeitado e reportado, mantendo-se o valor canônico do código.

import { ALIQUOTAS_UF, isUF } from './tabelas';
import type { AliquotaUf, UF } from './types';

/** Registro cru vindo do catálogo `ufs` do banco. */
export interface RegistroUfBanco {
  sigla: string;
  aliquota_interna_padrao: number | string | null;
  aliquota_fcp?: number | string | null;
}

export type MotivoRejeicao =
  | 'uf_desconhecida'
  | 'interna_invalida'
  | 'fcp_invalido'
  | 'duplicado';

export interface RejeicaoOverlay {
  sigla: string;
  motivo: MotivoRejeicao;
  valor: number | string | null;
}

export interface AplicacaoOverlay {
  uf: UF;
  campo: 'interna' | 'fcp';
  valorCodigo: number;
  valorBanco: number;
}

export interface ResultadoOverlay {
  /** Tabela final a ser usada pelo motor (cópia; nunca muta a constante). */
  tabela: Record<UF, AliquotaUf>;
  /** Sobreposições efetivamente aplicadas (banco ≠ código). */
  aplicadas: AplicacaoOverlay[];
  /** Registros descartados por inconsistência, com o motivo. */
  rejeitadas: RejeicaoOverlay[];
}

/** Limite superior defensivo: nenhuma alíquota interna de ICMS chega a 40%. */
const INTERNA_MAX = 0.4;
const INTERNA_MIN = 0.01;
const FCP_MAX = 0.05;

/**
 * Normaliza um valor que pode vir como fração (0.19), percentual (19) ou
 * string numérica ('19.00'). Retorna `null` quando não é numérico finito.
 */
export function normalizarAliquota(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const bruto = typeof valor === 'string' ? Number(valor.replace(',', '.')) : valor;
  if (!Number.isFinite(bruto)) return null;
  if (bruto < 0) return null;
  // Heurística: valores > 1 estão em pontos percentuais.
  return bruto > 1 ? bruto / 100 : bruto;
}

function arredondar(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

/**
 * Constrói a tabela de alíquotas efetiva combinando o código (base canônica)
 * com o catálogo do banco. Função pura: não realiza I/O e não muta entradas.
 */
export function aplicarOverlayUfs(
  registros: readonly RegistroUfBanco[],
  base: Record<UF, AliquotaUf> = ALIQUOTAS_UF,
): ResultadoOverlay {
  const tabela = Object.fromEntries(
    Object.entries(base).map(([uf, dados]) => [uf, { ...dados }]),
  ) as Record<UF, AliquotaUf>;

  const aplicadas: AplicacaoOverlay[] = [];
  const rejeitadas: RejeicaoOverlay[] = [];
  const vistos = new Set<string>();

  for (const registro of registros) {
    const sigla = (registro?.sigla ?? '').toString().trim().toUpperCase();

    if (!isUF(sigla)) {
      rejeitadas.push({ sigla, motivo: 'uf_desconhecida', valor: registro?.aliquota_interna_padrao ?? null });
      continue;
    }
    if (vistos.has(sigla)) {
      rejeitadas.push({ sigla, motivo: 'duplicado', valor: registro.aliquota_interna_padrao });
      continue;
    }
    vistos.add(sigla);

    const uf = sigla as UF;
    const interna = normalizarAliquota(registro.aliquota_interna_padrao);
    if (interna === null || interna < INTERNA_MIN || interna > INTERNA_MAX) {
      rejeitadas.push({ sigla, motivo: 'interna_invalida', valor: registro.aliquota_interna_padrao });
    } else {
      const atual = tabela[uf].interna;
      const novo = arredondar(interna);
      if (novo !== arredondar(atual)) {
        aplicadas.push({ uf, campo: 'interna', valorCodigo: atual, valorBanco: novo });
        tabela[uf] = { ...tabela[uf], interna: novo };
      }
    }

    if (registro.aliquota_fcp !== undefined) {
      const fcp = normalizarAliquota(registro.aliquota_fcp);
      if (fcp === null || fcp > FCP_MAX) {
        rejeitadas.push({ sigla, motivo: 'fcp_invalido', valor: registro.aliquota_fcp ?? null });
      } else {
        const atual = tabela[uf].fcp;
        const novo = arredondar(fcp);
        if (novo !== arredondar(atual)) {
          aplicadas.push({ uf, campo: 'fcp', valorCodigo: atual, valorBanco: novo });
          tabela[uf] = { ...tabela[uf], fcp: novo };
        }
      }
    }
  }

  return { tabela, aplicadas, rejeitadas };
}

/** UFs presentes no código e ausentes no catálogo do banco. */
export function ufsAusentesNoBanco(
  registros: readonly RegistroUfBanco[],
  base: Record<UF, AliquotaUf> = ALIQUOTAS_UF,
): UF[] {
  const presentes = new Set(
    registros.map((r) => (r?.sigla ?? '').toString().trim().toUpperCase()),
  );
  return (Object.keys(base) as UF[]).filter((uf) => !presentes.has(uf)).sort();
}
