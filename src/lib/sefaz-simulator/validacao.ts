import type { NFEData } from './types';

export function validarNFE(
  dados: NFEData,
): { valid: boolean; errors: string[]; cStat?: string } {
  const errors: string[] = [];

  if (!dados.emitente.cnpj || dados.emitente.cnpj.replace(/\D/g, '').length !== 14) {
    errors.push('CNPJ do emitente inválido');
    return { valid: false, errors, cStat: '207' };
  }

  const docDest = dados.destinatario.cpfCnpj.replace(/\D/g, '');
  if (!docDest || (docDest.length !== 11 && docDest.length !== 14)) {
    errors.push('CPF/CNPJ do destinatário inválido');
    return { valid: false, errors, cStat: '208' };
  }

  if (!dados.emitente.inscricaoEstadual) {
    errors.push('Inscrição Estadual do emitente não informada');
    return { valid: false, errors, cStat: '209' };
  }

  if (!dados.itens || dados.itens.length === 0) {
    errors.push('NF-e sem itens');
    return { valid: false, errors, cStat: '225' };
  }

  for (const item of dados.itens) {
    if (!item.ncm || item.ncm.replace(/\D/g, '').length !== 8) {
      errors.push(`NCM inválido para o item: ${item.descricao}`);
      return { valid: false, errors, cStat: '225' };
    }
  }

  const diasAtras = Math.floor(
    (Date.now() - new Date(dados.dataEmissao).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diasAtras > 30) {
    errors.push('Data de emissão muito atrasada (mais de 30 dias)');
    return { valid: false, errors, cStat: '228' };
  }

  return { valid: true, errors: [] };
}
