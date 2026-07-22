import type { NFEData } from './types';

export function getCodigoUF(uf: string): string {
  const ufs: Record<string, string> = {
    AC: '12', AL: '27', AM: '13', AP: '16', BA: '29',
    CE: '23', DF: '53', ES: '32', GO: '52', MA: '21',
    MG: '31', MS: '50', MT: '51', PA: '15', PB: '25',
    PE: '26', PI: '22', PR: '41', RJ: '33', RN: '24',
    RO: '11', RR: '14', RS: '43', SC: '42', SE: '28',
    SP: '35', TO: '17',
  };
  return ufs[uf] || '35';
}

export function calcularDV(chave: string): string {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let pesoIndex = 0;
  for (let i = chave.length - 1; i >= 0; i--) {
    soma += parseInt(chave[i]) * pesos[pesoIndex % 8];
    pesoIndex++;
  }
  const resto = soma % 11;
  return resto < 2 ? '0' : String(11 - resto);
}

export function gerarChaveAcesso(dados: NFEData): string {
  const uf = getCodigoUF(dados.emitente.uf);
  const dataEmissao = new Date(dados.dataEmissao);
  const aamm = `${String(dataEmissao.getFullYear()).slice(2)}${String(dataEmissao.getMonth() + 1).padStart(2, '0')}`;
  const cnpj = dados.emitente.cnpj.replace(/\D/g, '');
  const mod = '55';
  const serie = String(dados.serie).padStart(3, '0');
  const numero = String(dados.numero).padStart(9, '0');
  const tpEmis = '1';
  const cNF = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');
  const chaveBase = `${uf}${aamm}${cnpj}${mod}${serie}${numero}${tpEmis}${cNF}`;
  return `${chaveBase}${calcularDV(chaveBase)}`;
}

export function gerarProtocolo(uf: string): string {
  const codigoUF = getCodigoUF(uf);
  const ano = new Date().getFullYear().toString().slice(2);
  const sequencial = String(Math.floor(Math.random() * 9999999999)).padStart(10, '0');
  return `${codigoUF}${ano}${sequencial}`;
}

export function gerarRecibo(uf: string): string {
  const codigoUF = getCodigoUF(uf);
  const sequencial = String(Math.floor(Math.random() * 999999999999999)).padStart(15, '0');
  return `${codigoUF}${sequencial}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
