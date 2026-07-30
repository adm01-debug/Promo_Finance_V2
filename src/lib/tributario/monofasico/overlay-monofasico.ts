/**
 * OVERLAY MONOFÁSICO — Camada defensiva entre o catálogo versionado no banco
 * (`ncms.monofasico_pis_cofins`) e o classificador do regime monofásico.
 *
 * Racional (mesmo desenho já adotado para ICMS/UF e ISS municipal): o catálogo
 * do banco é a fonte de verdade versionada e pode refletir uma alteração legal
 * (inclusão/exclusão de NCM da tributação concentrada) antes do próximo deploy.
 * O catálogo embarcado em `grupos.ts` permanece como base canônica de grupos e
 * alíquotas — o banco decide apenas o MARCADOR (é ou não monofásico), jamais as
 * alíquotas, que dependem de base legal específica por grupo.
 *
 * Regras de aceitação (um registro inválido nunca derruba o cálculo):
 *  - código deve ter exatamente 8 dígitos (NCM/SH — Decreto 11.158/2022);
 *  - códigos duplicados são rejeitados (prevalece a primeira ocorrência);
 *  - registro que apenas confirma o código canônico não gera override (ruído).
 *
 * Módulo puro: sem I/O, sem React, sem Supabase, sem mutação das entradas.
 */

import { classificarNcmMonofasicoCanonico, normalizarNcm } from './classificar';

/** Recorte do registro de `ncms` relevante para o marcador monofásico. */
export interface RegistroNcmMonofasicoBanco {
  codigo: string | null;
  descricao?: string | null;
  monofasico_pis_cofins?: boolean | null;
}

export type MotivoRejeicaoMonofasico = 'codigo_invalido' | 'duplicado';

export interface RejeicaoMonofasico {
  ncm: string;
  motivo: MotivoRejeicaoMonofasico;
  valor: string | number | null;
}

export interface InclusaoMonofasica {
  ncm: string;
  descricao: string;
}

export interface ExclusaoMonofasica {
  ncm: string;
  /** Grupo canônico que deixa de ser aplicado por decisão do catálogo. */
  grupo: string;
}

export interface ResultadoOverlayMonofasico {
  /** Mapa efetivo consumido pelo classificador: NCM (8 dígitos) → é monofásico. */
  override: Record<string, boolean>;
  /** NCMs marcados no banco que o catálogo embarcado não reconhecia. */
  inclusoes: InclusaoMonofasica[];
  /** NCMs desmarcados no banco que o catálogo embarcado classificava. */
  exclusoes: ExclusaoMonofasica[];
  /** Registros descartados por inconsistência, com o motivo. */
  rejeitadas: RejeicaoMonofasico[];
  /** Descrições vindas do banco, usadas para rotular inclusões na UI. */
  descricoes: Record<string, string>;
}

/**
 * Constrói o override efetivo do marcador monofásico a partir do catálogo do
 * banco. Só registra divergências reais frente ao classificador canônico.
 */
export function aplicarOverlayMonofasico(
  registros: readonly RegistroNcmMonofasicoBanco[],
): ResultadoOverlayMonofasico {
  const override: Record<string, boolean> = {};
  const descricoes: Record<string, string> = {};
  const inclusoes: InclusaoMonofasica[] = [];
  const exclusoes: ExclusaoMonofasica[] = [];
  const rejeitadas: RejeicaoMonofasico[] = [];
  const vistos = new Set<string>();

  for (const registro of registros ?? []) {
    const bruto = (registro?.codigo ?? '').toString();
    const codigo = normalizarNcm(bruto);

    if (codigo.length !== 8) {
      rejeitadas.push({ ncm: bruto.trim(), motivo: 'codigo_invalido', valor: codigo.length });
      continue;
    }
    if (vistos.has(codigo)) {
      rejeitadas.push({ ncm: codigo, motivo: 'duplicado', valor: bruto.trim() });
      continue;
    }
    vistos.add(codigo);

    const doBanco = Boolean(registro.monofasico_pis_cofins);
    const canonico = classificarNcmMonofasicoCanonico(codigo);
    const descricao = (registro.descricao ?? '').toString().trim();
    if (descricao) descricoes[codigo] = descricao;

    // Sem divergência ⇒ nada a sobrepor: o motor segue com o catálogo embarcado.
    if (doBanco === (canonico !== null)) continue;

    override[codigo] = doBanco;
    if (doBanco) {
      inclusoes.push({ ncm: codigo, descricao: descricao || `NCM ${codigo}` });
    } else {
      exclusoes.push({ ncm: codigo, grupo: canonico?.grupo.nome ?? '—' });
    }
  }

  return { override, inclusoes, exclusoes, rejeitadas, descricoes };
}

/** Traduz as rejeições em mensagens legíveis para o painel administrativo. */
export function descreverRejeicoesMonofasico(
  rejeicoes: readonly RejeicaoMonofasico[],
): string[] {
  return rejeicoes.map((r) => {
    switch (r.motivo) {
      case 'codigo_invalido':
        return `NCM "${r.ncm}": código fora do formato de 8 dígitos — marcador monofásico ignorado`;
      case 'duplicado':
        return `NCM ${r.ncm}: código duplicado no catálogo — prevaleceu a primeira ocorrência`;
    }
  });
}
