/**
 * Utilitário para validar consistência entre NCM e CST/CSOSN
 * Baseado em regras de incidência monofásica, substituição tributária e isenções.
 */

export interface ValidacaoNCM {
  score: number;
  divergencias: Array<{ campo: string; mensagem: string }>;
}

export function validarConsistenciaNcmCst(ncm: string, cst: string): ValidacaoNCM {
  let score = 100;
  const divergencias = [];

  const ncmLimpo = ncm.replace(/\D/g, '');
  
  // Regras de exemplo para incidência monofásica (PIS/COFINS)
  // Ex: 3004 (Medicamentos), 4011 (Pneus), 2203 (Cervejas)
  const isMonofasico = ['3004', '4011', '2203', '3808'].some(prefix => ncmLimpo.startsWith(prefix));
  
  if (isMonofasico) {
    // Para monofásicos, o CST de saída deveria ser 04 ou 06
    // E o CST de entrada (crédito) deveria ser consistente
    if (cst !== '060' && cst !== '04' && cst !== '06' && cst !== '60') {
      score -= 25;
      divergencias.push({
        campo: 'CST/CSOSN',
        mensagem: `NCM ${ncm} indica produto monofásico, mas CST ${cst} foi utilizado.`
      });
    }
  }

  // Regra de Substituição Tributária (ST)
  // CSTs de ST: 10, 30, 60, 70
  const isST = ['10', '30', '60', '70'].includes(cst);
  
  // Exemplo: NCMs de eletrônicos costumam ter ST em alguns estados
  if (ncmLimpo.startsWith('8517') && !isST) {
    score -= 15;
    divergencias.push({
      campo: 'CST/CSOSN',
      mensagem: `NCM ${ncm} (Eletrônicos) frequentemente exige Substituição Tributária (CST 60/10).`
    });
  }

  // Validação básica de tamanho de NCM
  if (ncmLimpo.length !== 8) {
    score -= 10;
    divergencias.push({
      campo: 'NCM',
      mensagem: 'NCM com tamanho inválido (esperado 8 dígitos).'
    });
  }

  return {
    score: Math.max(0, score),
    divergencias
  };
}
