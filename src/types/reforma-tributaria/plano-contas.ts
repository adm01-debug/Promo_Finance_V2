export interface ContaContabilReforma {
  codigo: string;
  descricao: string;
  natureza: 'devedora' | 'credora';
  tipo: 'ativo' | 'passivo' | 'resultado';
  grupo: 'tributos_recuperar' | 'tributos_recolher' | 'despesas_tributarias' | 'provisoes';
}

export const PLANO_CONTAS_REFORMA: ContaContabilReforma[] = [
  { codigo: '1.1.5.01.001', descricao: 'CBS a Recuperar', natureza: 'devedora', tipo: 'ativo', grupo: 'tributos_recuperar' },
  { codigo: '1.1.5.01.002', descricao: 'IBS a Recuperar', natureza: 'devedora', tipo: 'ativo', grupo: 'tributos_recuperar' },
  { codigo: '1.1.5.01.003', descricao: 'Créditos de CBS - Split Payment', natureza: 'devedora', tipo: 'ativo', grupo: 'tributos_recuperar' },
  { codigo: '1.1.5.01.004', descricao: 'Créditos de IBS - Split Payment', natureza: 'devedora', tipo: 'ativo', grupo: 'tributos_recuperar' },
  { codigo: '2.1.4.01.001', descricao: 'CBS a Recolher', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  { codigo: '2.1.4.01.002', descricao: 'IBS a Recolher', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  { codigo: '2.1.4.01.003', descricao: 'Imposto Seletivo a Recolher', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  { codigo: '2.1.4.01.004', descricao: 'CBS Retido Split Payment a Repassar', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  { codigo: '2.1.4.01.005', descricao: 'IBS Retido Split Payment a Repassar', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  { codigo: '3.1.2.01.001', descricao: '(-) CBS sobre Vendas', natureza: 'devedora', tipo: 'resultado', grupo: 'despesas_tributarias' },
  { codigo: '3.1.2.01.002', descricao: '(-) IBS sobre Vendas', natureza: 'devedora', tipo: 'resultado', grupo: 'despesas_tributarias' },
  { codigo: '3.1.2.01.003', descricao: '(-) Imposto Seletivo sobre Vendas', natureza: 'devedora', tipo: 'resultado', grupo: 'despesas_tributarias' },
  { codigo: '2.1.4.02.001', descricao: 'Provisão para Tributos - Transição', natureza: 'credora', tipo: 'passivo', grupo: 'provisoes' },
  { codigo: '2.1.4.02.002', descricao: 'Créditos a Homologar - Transição', natureza: 'credora', tipo: 'passivo', grupo: 'provisoes' },
];
