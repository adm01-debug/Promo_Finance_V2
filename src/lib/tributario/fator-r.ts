// ============================================
// FATOR R — Define se atividade vai para Anexo III ou V
// LC 123/2006, art. 18, §5º-M
// ============================================

import type { FolhaMes } from './types';
import type { AnexoSimples } from './types';

/**
 * Calcula o Fator R = Folha de pagamento (12m) / RBT12
 * 
 * Se Fator R ≥ 0,28 → Anexo III (alíquotas menores)
 * Se Fator R < 0,28 → Anexo V (alíquotas maiores)
 * 
 * Aplicável apenas para atividades de serviço listadas no §5º-M.
 */
export function calcularFatorR(folha12m: number, rbt12: number): number {
  if (!rbt12 || rbt12 <= 0) return 0;
  return folha12m / rbt12;
}

/**
 * Soma a folha dos últimos 12 meses (mesma janela do RBT12).
 */
export function calcularFolha12m(
  folhaHistorico: FolhaMes[],
  anoReferencia: number,
  mesReferencia: number,
): number {
  if (!folhaHistorico || folhaHistorico.length === 0) return 0;

  const ordenado = [...folhaHistorico].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });

  const anteriores = ordenado.filter((f) => {
    if (f.ano < anoReferencia) return true;
    if (f.ano === anoReferencia && f.mes < mesReferencia) return true;
    return false;
  });

  const ultimos12 = anteriores.slice(0, 12);
  const soma = ultimos12.reduce((acc, f) => acc + (f.total_folha || 0), 0);

  if (ultimos12.length < 12 && ultimos12.length > 0) {
    return (soma / ultimos12.length) * 12;
  }

  return soma;
}

/**
 * Determina o anexo aplicável para atividade de serviço sujeita a Fator R.
 */
export function determinarAnexoPorFatorR(fatorR: number): AnexoSimples {
  return fatorR >= 0.28 ? 'III' : 'V';
}
