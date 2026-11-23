import { describe, it, expect } from 'vitest';
import { gerarEFD_Contribuicoes, validarArquivoSPED } from '../sped-generator';


describe('SPED Generator', () => {
  const empresa = {
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'Empresa Teste LTDA',
    inscricaoEstadual: '123456789',
    uf: 'SP',
    codMunicipio: '3550308',
  };

  const operacoes = [
    {
      id: '1',
      tipo_operacao: 'venda',
      documento_numero: '000001',
      documento_chave: '35240112345678000190550010000000011000000011',
      data_operacao: '2024-01-15',
      valor_operacao: 10000,
      cbs_aliquota: 8.8,
      cbs_valor: 880,
      ibs_aliquota: 17.7,
      ibs_valor: 1770,
      is_aliquota: 0,
      is_valor: 0,
      participante_cnpj: '98765432000199',
      participante_nome: 'Cliente Teste',
      cfop: '5102',
    },
  ];

  const creditos = [
    {
      id: 'c1',
      tipo_tributo: 'CBS',
      tipo_credito: 'normal',
      competencia_origem: '2024-01',
      valor_base: 5000,
      aliquota: 0.088,
      valor_credito: 440,
      status: 'ativo',
      fornecedor_cnpj: '11222333000144',
      documento_numero: 'NF001',
    },
    {
      id: 'c2',
      tipo_tributo: 'IBS',
      tipo_credito: 'normal',
      competencia_origem: '2024-01',
      valor_base: 5000,
      aliquota: 0.177,
      valor_credito: 885,
      status: 'ativo',
    },
  ];

  describe('gerarEFD_Contribuicoes', () => {
    it('gera arquivo válido', () => {
      const sped = gerarEFD_Contribuicoes(empresa, '2024-01', operacoes, creditos);
      expect(sped).toContain('|0000|');
      expect(sped).toContain('|9999|');
    });
  });

  describe('validarArquivoSPED', () => {
    it('arquivo válido retorna sucesso', () => {
      const sped = gerarEFD_Contribuicoes(empresa, '2024-01', operacoes, creditos);
      const resultado = validarArquivoSPED(sped);
      expect(resultado.valido).toBe(true);
      expect(resultado.erros.length).toBe(0);
    });

    it('arquivo sem 0000 retorna erro', () => {
      const resultado = validarArquivoSPED('|C001|0|\r\n|9999|10|');
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.includes('0000'))).toBe(true);
    });

    it('arquivo sem 9999 retorna erro', () => {
      const resultado = validarArquivoSPED('|0000|dados|\r\n|C001|0|');
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.includes('9999'))).toBe(true);
    });

    it('linhas com formato inválido geram erro', () => {
      const resultado = validarArquivoSPED('|0000|dados|\r\nlinha sem pipe\r\n|9999|2|');
      expect(resultado.valido).toBe(false);
    });
  });
});
