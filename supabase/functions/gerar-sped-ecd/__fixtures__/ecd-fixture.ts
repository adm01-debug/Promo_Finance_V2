import type { EcdInput } from '../layout.ts';

/**
 * Cenário fixo para o teste de golden file + invariantes do ECD.
 *
 * Cobre, deliberadamente: conta analítica com e sem código referencial
 * (para provar que `I051` não vaza entre contas), uma conta sintética (só
 * aparece em `I050`, nunca em `I155`/`J100`), e movimento em cada natureza
 * (ativo, passivo, patrimônio parado, receita, despesa) para que blocos
 * I150/I200/I250/J100/J150 tenham pelo menos uma linha cada.
 */
export const ECD_FIXTURE: EcdInput = {
  empresa: {
    cnpj: '12.345.678/0001-99',
    razao_social: 'Empresa Teste ECD LTDA',
    estado: 'SP',
    inscricao_estadual: '110042490114',
  },
  ano_calendario: 2026,
  periodo_inicio: '2026-01-01',
  periodo_fim: '2026-12-31',
  plano: [
    {
      id: 'c-caixa',
      codigo: '1.01.01',
      nome: 'Caixa',
      descricao: 'Caixa',
      natureza: 'ativo',
      tipo: 'analitica',
      codigo_referencial: '1.01.01.001',
    },
    {
      id: 'c-bancos',
      codigo: '1.01.02',
      nome: 'Bancos',
      descricao: 'Bancos',
      natureza: 'ativo',
      tipo: 'analitica',
      codigo_referencial: null,
    },
    {
      id: 'c-fornec',
      codigo: '2.01.01',
      nome: 'Fornecedores',
      descricao: 'Fornecedores',
      natureza: 'passivo',
      tipo: 'analitica',
      codigo_referencial: '2.01.01.001',
    },
    {
      id: 'c-capital',
      codigo: '3.01',
      nome: 'Capital Social',
      descricao: 'Capital Social',
      natureza: 'patrimonio',
      tipo: 'sintetica',
      codigo_referencial: null,
    },
    {
      id: 'c-receita',
      codigo: '4.01.01',
      nome: 'Receita de Vendas',
      descricao: 'Receita de Vendas',
      natureza: 'receita',
      tipo: 'analitica',
      codigo_referencial: '4.01.01.001',
    },
    {
      id: 'c-despesa',
      codigo: '4.02.01',
      nome: 'Despesas Administrativas',
      descricao: 'Despesas Administrativas',
      natureza: 'despesa',
      tipo: 'analitica',
      codigo_referencial: null,
    },
  ],
  lancamentos: [
    {
      id: 'l1',
      numero_lancamento: 1,
      data_lancamento: '2026-01-05',
      historico: 'Venda a vista',
      valor_total: 1000,
      partidas: [
        { conta_id: 'c-caixa', tipo: 'D', valor: 1000 },
        { conta_id: 'c-receita', tipo: 'C', valor: 1000 },
      ],
    },
    {
      id: 'l2',
      numero_lancamento: 2,
      data_lancamento: '2026-01-10',
      historico: 'Pagamento a fornecedor',
      valor_total: 400,
      partidas: [
        { conta_id: 'c-fornec', tipo: 'D', valor: 400 },
        { conta_id: 'c-caixa', tipo: 'C', valor: 400 },
      ],
    },
    {
      id: 'l3',
      numero_lancamento: 3,
      data_lancamento: '2026-01-15',
      historico: 'Despesa administrativa paga via banco',
      valor_total: 250,
      partidas: [
        { conta_id: 'c-despesa', tipo: 'D', valor: 250 },
        { conta_id: 'c-bancos', tipo: 'C', valor: 250 },
      ],
    },
  ],
};
