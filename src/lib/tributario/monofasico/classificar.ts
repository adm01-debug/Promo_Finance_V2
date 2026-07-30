// REGIME MONOFÁSICO — Classificação de NCM
// Estratégia: normaliza o NCM (8 dígitos), tenta o match exato mais longo do catálogo
// e, na ausência, cai para o prefixo de grupo mais específico.

import { GRUPOS_MONOFASICOS, GRUPO_MONOFASICO_CATALOGO } from './grupos';
import type { ClassificacaoMonofasica, GrupoMonofasico, NcmMonofasico } from './types';

/** Remove pontos, espaços e caracteres não numéricos; limita a 8 dígitos. */
export function normalizarNcm(ncm: string): string {
  return (ncm ?? '').replace(/\D/g, '').slice(0, 8);
}

interface Candidato {
  grupo: GrupoMonofasico;
  item: NcmMonofasico | null;
  digitos: number;
  origem: 'ncm_exato' | 'prefixo_grupo';
}

function melhor(a: Candidato | null, b: Candidato): Candidato {
  if (!a) return b;
  // 1) mais dígitos casados vence; 2) match de NCM vence prefixo; 3) menor prioridade vence.
  if (b.digitos !== a.digitos) return b.digitos > a.digitos ? b : a;
  if (b.origem !== a.origem) return b.origem === 'ncm_exato' ? b : a;
  return b.grupo.prioridade < a.grupo.prioridade ? b : a;
}

/**
 * Classifica um NCM no catálogo monofásico.
 * Retorna `null` quando o NCM não está sujeito à tributação concentrada.
 */
export function classificarNcmMonofasicoCanonico(ncm: string): ClassificacaoMonofasica | null {
  const alvo = normalizarNcm(ncm);
  // NCM abaixo de 4 dígitos não permite classificação segura.
  if (alvo.length < 4) return null;

  let escolhido: Candidato | null = null;

  for (const grupo of GRUPOS_MONOFASICOS) {
    for (const item of grupo.ncms) {
      const codigo = normalizarNcm(item.ncm);
      if (codigo.length >= 4 && alvo.startsWith(codigo)) {
        escolhido = melhor(escolhido, { grupo, item, digitos: codigo.length, origem: 'ncm_exato' });
      }
    }
    for (const prefixo of grupo.prefixos) {
      const p = normalizarNcm(prefixo);
      if (p.length >= 4 && alvo.startsWith(p)) {
        escolhido = melhor(escolhido, { grupo, item: null, digitos: p.length, origem: 'prefixo_grupo' });
      }
    }
  }

  if (!escolhido) return null;

  return {
    monofasico: true,
    grupo: escolhido.grupo,
    ncmNormalizado: alvo,
    item: escolhido.item,
    digitosCasados: escolhido.digitos,
    origem: escolhido.origem,
  };
}


/**
 * OVERRIDE DE RUNTIME — marcador monofásico vindo do catálogo `ncms` do banco.
 * Preenchido apenas com registros já validados por `aplicarOverlayMonofasico`.
 * Chave: NCM normalizado com 8 dígitos. Valor: é (ou não) monofásico.
 */
let overrideMonofasico: Record<string, boolean> = {};

export function definirOverrideMonofasico(override: Record<string, boolean>): void {
  overrideMonofasico = { ...override };
}

export function resetarOverrideMonofasico(): void {
  overrideMonofasico = {};
}

export function obterOverrideMonofasico(): Record<string, boolean> {
  return { ...overrideMonofasico };
}

/**
 * Classifica um NCM aplicando, quando existir, o override do catálogo do banco.
 * Esta é a função consumida pelo motor de cálculo; a versão canônica permanece
 * exposta para as guardas de coerência (que precisam comparar banco × código).
 */
export function classificarNcmMonofasico(ncm: string): ClassificacaoMonofasica | null {
  const alvo = normalizarNcm(ncm);
  const canonico = classificarNcmMonofasicoCanonico(alvo);
  const marcado = alvo.length === 8 ? overrideMonofasico[alvo] : undefined;

  if (marcado === undefined) return canonico;
  // Banco desmarcou o NCM: prevalece o catálogo versionado.
  if (marcado === false) return null;
  // Banco marcou um NCM que o catálogo embarcado não cobre: classificamos no
  // grupo genérico, sem alíquota de indústria (o motor emite alerta e exige
  // informação manual em vez de inventar base legal).
  if (canonico) return canonico;
  return {
    monofasico: true,
    grupo: GRUPO_MONOFASICO_CATALOGO,
    ncmNormalizado: alvo,
    item: null,
    digitosCasados: 8,
    origem: 'ncm_exato',
  };
}

/** Conveniência booleana para validações e filtros (com override aplicado). */
export function isNcmMonofasico(ncm: string): boolean {
  return classificarNcmMonofasico(ncm) !== null;
}
