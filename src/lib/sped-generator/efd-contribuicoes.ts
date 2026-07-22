import { format } from 'date-fns';
import {
  formatarCNPJ,
  gerarLinhaSPED,
  type CreditoTributario,
  type DadosEmpresa,
  type OperacaoTributavel,
} from './core';

export function gerarEFD_Contribuicoes(
  empresa: DadosEmpresa,
  competencia: string,
  _operacoes: OperacaoTributavel[],
  _creditos: CreditoTributario[],
): string {
  const linhas: string[] = [];
  const [ano, mes] = competencia.split('-');
  const dataInicio = `01${mes}${ano}`;
  const dataFim = format(new Date(Number(ano), Number(mes), 0), 'ddMMyyyy');

  linhas.push(
    gerarLinhaSPED({
      tipo: '0000',
      campos: [
        '006',
        '0',
        dataInicio,
        dataFim,
        empresa.razaoSocial.substring(0, 100),
        formatarCNPJ(empresa.cnpj),
        empresa.uf || 'SP',
        empresa.codMunicipio || '',
        '',
        '1',
        '1',
      ],
    }),
  );

  linhas.push(gerarLinhaSPED({ tipo: '0001', campos: ['0'] }));
  linhas.push(gerarLinhaSPED({ tipo: '0990', campos: ['3'] }));

  linhas.push(gerarLinhaSPED({ tipo: 'A001', campos: ['1'] }));
  linhas.push(gerarLinhaSPED({ tipo: 'A990', campos: ['2'] }));

  linhas.push(gerarLinhaSPED({ tipo: 'C001', campos: ['1'] }));
  linhas.push(gerarLinhaSPED({ tipo: 'C990', campos: ['2'] }));

  linhas.push(gerarLinhaSPED({ tipo: 'D001', campos: ['1'] }));
  linhas.push(gerarLinhaSPED({ tipo: 'D990', campos: ['2'] }));

  linhas.push(gerarLinhaSPED({ tipo: 'F001', campos: ['1'] }));
  linhas.push(gerarLinhaSPED({ tipo: 'F990', campos: ['2'] }));

  linhas.push(gerarLinhaSPED({ tipo: 'M001', campos: ['1'] }));
  linhas.push(gerarLinhaSPED({ tipo: 'M990', campos: ['2'] }));

  linhas.push(gerarLinhaSPED({ tipo: '9001', campos: ['0'] }));
  linhas.push(gerarLinhaSPED({ tipo: '9900', campos: ['0000', '1'] }));
  linhas.push(gerarLinhaSPED({ tipo: '9999', campos: [String(linhas.length + 2)] }));

  return linhas.join('\r\n');
}
