/**
 * Parser de código de barras de boletos brasileiros
 * Suporta:
 * - Código de barras (44 dígitos)
 * - Linha digitável (47 dígitos para boletos bancários, 48 para convênio/concessionárias)
 */

export interface DadosBoleto {
  codigoBarras: string;
  linhaDigitavel: string;
  valor: number;
  dataVencimento: Date | null;
  banco: string;
  codigoBanco: string;
  tipo: 'bancario' | 'convenio';
  valido: boolean;
  erros: string[];
}

// Mapeamento dos principais bancos brasileiros
const BANCOS: Record<string, string> = {
  '001': 'Banco do Brasil',
  '033': 'Santander',
  '104': 'Caixa Econômica Federal',
  '237': 'Bradesco',
  '341': 'Itaú',
  '356': 'Banco Real',
  '389': 'Banco Mercantil do Brasil',
  '399': 'HSBC',
  '422': 'Safra',
  '453': 'Banco Rural',
  '633': 'Banco Rendimento',
  '652': 'Itaú Unibanco',
  '745': 'Citibank',
  '756': 'Sicoob',
  '748': 'Sicredi',
  '041': 'Banrisul',
  '070': 'BRB',
  '077': 'Inter',
  '260': 'Nubank',
  '212': 'Banco Original',
  '336': 'C6 Bank',
  '323': 'Mercado Pago',
};

/**
 * Remove caracteres não numéricos
 */
function limparCodigo(codigo: string): string {
  return codigo.replace(/\D/g, '');
}

/**
 * Calcula o dígito verificador módulo 10
 */
function calculaModulo10(bloco: string): number {
  let soma = 0;
  let peso = 2;
  
  for (let i = bloco.length - 1; i >= 0; i--) {
    let resultado = parseInt(bloco[i]) * peso;
    if (resultado > 9) {
      resultado = Math.floor(resultado / 10) + (resultado % 10);
    }
    soma += resultado;
    peso = peso === 2 ? 1 : 2;
  }
  
  const resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}

/**
 * Calcula o dígito verificador módulo 11
 */
function calculaModulo11(bloco: string): number {
  let soma = 0;
  let peso = 2;
  
  for (let i = bloco.length - 1; i >= 0; i--) {
    soma += parseInt(bloco[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  const resto = soma % 11;
  if (resto === 0 || resto === 1 || resto === 10) return 1;
  return 11 - resto;
}

/**
 * Converte fator de vencimento para data
 * O fator 1000 = 03/07/2000
 */
function fatorParaData(fator: number): Date | null {
  if (fator === 0) return null;
  
  const dataBase = new Date(2000, 6, 3); // 03/07/2000
  const diasDesdeBase = fator - 1000;
  
  const dataVencimento = new Date(dataBase);
  dataVencimento.setDate(dataVencimento.getDate() + diasDesdeBase);
  
  // Validação básica - se a data for muito antiga ou futura demais
  const hoje = new Date();
  const anoMinimo = hoje.getFullYear() - 10;
  const anoMaximo = hoje.getFullYear() + 5;
  
  if (dataVencimento.getFullYear() < anoMinimo || dataVencimento.getFullYear() > anoMaximo) {
    return null;
  }
  
  return dataVencimento;
}

/**
 * Converte linha digitável (47 dígitos) para código de barras (44 dígitos)
 */
function linhaDigitavelParaCodigoBarras(linha: string): string {
  const limpo = limparCodigo(linha);
  
  if (limpo.length !== 47) {
    throw new Error('Linha digitável deve ter 47 dígitos');
  }
  
  // Estrutura da linha digitável:
  // Campo 1: BBBMC.CCCCD (10 dígitos, D = dígito verificador)
  // Campo 2: CCCCC.CCCCCD (11 dígitos)
  // Campo 3: CCCCC.CCCCCD (11 dígitos)
  // Campo 4: D (1 dígito - dígito verificador geral)
  // Campo 5: FFFFVVVVVVVVVV (14 dígitos - fator vencimento + valor)
  
  const campo1 = limpo.substring(0, 9);     // Sem DV
  const campo2 = limpo.substring(10, 20);   // Sem DV
  const campo3 = limpo.substring(21, 31);   // Sem DV
  const dvGeral = limpo.substring(32, 33);
  const campo5 = limpo.substring(33, 47);
  
  // Código de barras: BBB M DVGERAL FFFF VVVVVVVVVV CCCCCCCCCCCCCCC
  return campo1.substring(0, 4) + dvGeral + campo5 + campo1.substring(4) + campo2 + campo3;
}

/**
 * Converte código de barras (44 dígitos) para linha digitável (47 dígitos)
 */
function codigoBarrasParaLinhaDigitavel(codigo: string): string {
  const limpo = limparCodigo(codigo);
  
  if (limpo.length !== 44) {
    throw new Error('Código de barras deve ter 44 dígitos');
  }
  
  // Estrutura do código de barras:
  // Posição 1-3: Código do banco
  // Posição 4: Código da moeda (9 = Real)
  // Posição 5: Dígito verificador geral
  // Posição 6-9: Fator de vencimento
  // Posição 10-19: Valor
  // Posição 20-44: Campo livre
  
  const banco = limpo.substring(0, 3);
  const moeda = limpo.substring(3, 4);
  const fatorVenc = limpo.substring(5, 9);
  const valor = limpo.substring(9, 19);
  const campoLivre = limpo.substring(19, 44);
  
  // Campo 1: BBBM + primeiros 5 do campo livre + DV mod10
  const campo1Sem = banco + moeda + campoLivre.substring(0, 5);
  const dv1 = calculaModulo10(campo1Sem);
  const campo1 = campo1Sem + dv1;
  
  // Campo 2: próximos 10 do campo livre + DV mod10
  const campo2Sem = campoLivre.substring(5, 15);
  const dv2 = calculaModulo10(campo2Sem);
  const campo2 = campo2Sem + dv2;
  
  // Campo 3: últimos 10 do campo livre + DV mod10
  const campo3Sem = campoLivre.substring(15, 25);
  const dv3 = calculaModulo10(campo3Sem);
  const campo3 = campo3Sem + dv3;
  
  // Campo 4: DV geral (já está no código de barras)
  const dvGeral = limpo.substring(4, 5);
  
  // Campo 5: Fator + Valor
  const campo5 = fatorVenc + valor;
  
  // Formatar com pontos
  return `${campo1.substring(0, 5)}.${campo1.substring(5)} ${campo2.substring(0, 5)}.${campo2.substring(5)} ${campo3.substring(0, 5)}.${campo3.substring(5)} ${dvGeral} ${campo5}`;
}

/**
 * Valida e extrai dados de um boleto bancário
 */
export function parseBoleto(codigo: string): DadosBoleto {
  const limpo = limparCodigo(codigo);
  const erros: string[] = [];
  
  let codigoBarras = '';
  let linhaDigitavel = '';
  let tipo: 'bancario' | 'convenio' = 'bancario';
  
  // Detectar tipo de código
  if (limpo.length === 44) {
    // Código de barras direto
    codigoBarras = limpo;
    try {
      linhaDigitavel = codigoBarrasParaLinhaDigitavel(limpo);
    } catch {
      erros.push('Não foi possível converter para linha digitável');
    }
  } else if (limpo.length === 47) {
    // Linha digitável de boleto bancário
    linhaDigitavel = codigo;
    try {
      codigoBarras = linhaDigitavelParaCodigoBarras(limpo);
    } catch {
      erros.push('Não foi possível converter para código de barras');
    }
  } else if (limpo.length === 48) {
    // Linha digitável de convênio/concessionária
    tipo = 'convenio';
    linhaDigitavel = codigo;
    codigoBarras = limpo; // Para convênio, tratamento diferente
  } else {
    erros.push(`Código inválido: esperado 44, 47 ou 48 dígitos, recebido ${limpo.length}`);
    return {
      codigoBarras: '',
      linhaDigitavel: '',
      valor: 0,
      dataVencimento: null,
      banco: '',
      codigoBanco: '',
      tipo: 'bancario',
      valido: false,
      erros,
    };
  }
  
  // Extrair dados do código de barras
  const codigoBanco = codigoBarras.substring(0, 3);
  const banco = BANCOS[codigoBanco] || `Banco ${codigoBanco}`;
  
  // Fator de vencimento (posições 6-9)
  const fatorVencimento = parseInt(codigoBarras.substring(5, 9));
  const dataVencimento = fatorParaData(fatorVencimento);
  
  // Valor (posições 10-19, dividir por 100)
  const valorCentavos = parseInt(codigoBarras.substring(9, 19));
  const valor = valorCentavos / 100;
  
  // Validar DV geral
  const dvInformado = parseInt(codigoBarras.substring(4, 5));
  const codigoSemDv = codigoBarras.substring(0, 4) + codigoBarras.substring(5);
  const dvCalculado = calculaModulo11(codigoSemDv);
  
  if (dvInformado !== dvCalculado) {
    erros.push('Dígito verificador inválido');
  }
  
  return {
    codigoBarras,
    linhaDigitavel: linhaDigitavel.replace(/\D/g, '').length > 44 ? linhaDigitavel : codigoBarrasParaLinhaDigitavel(codigoBarras),
    valor,
    dataVencimento,
    banco,
    codigoBanco,
    tipo,
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Formata linha digitável com pontos e espaços
 */
export function formatarLinhaDigitavel(linha: string): string {
  const limpo = limparCodigo(linha);
  
  if (limpo.length === 47) {
    return `${limpo.substring(0, 5)}.${limpo.substring(5, 10)} ${limpo.substring(10, 15)}.${limpo.substring(15, 21)} ${limpo.substring(21, 26)}.${limpo.substring(26, 32)} ${limpo.substring(32, 33)} ${limpo.substring(33, 47)}`;
  }
  
  return linha;
}

/**
 * Valida se o código é um código de barras válido
 */
export function validarCodigoBarras(codigo: string): boolean {
  const limpo = limparCodigo(codigo);
  return limpo.length === 44 || limpo.length === 47 || limpo.length === 48;
}
