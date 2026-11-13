// Definição das obrigações acessórias
export const OBRIGACOES = [
  // Federais
  {
    codigo: 'EFD-CONTRIBUICOES',
    nome: 'EFD-Contribuições',
    esfera: 'federal',
    periodicidade: 'mensal',
    diaVencimento: 10,
    descricao: 'PIS/COFINS',
  },
  {
    codigo: 'EFD-REINF',
    nome: 'EFD-Reinf',
    esfera: 'federal',
    periodicidade: 'mensal',
    diaVencimento: 15,
    descricao: 'Retenções e informações fiscais',
  },
  {
    codigo: 'DCTF',
    nome: 'DCTF',
    esfera: 'federal',
    periodicidade: 'mensal',
    diaVencimento: 15,
    descricao: 'Declaração de Débitos e Créditos Tributários',
  },
  {
    codigo: 'ECF',
    nome: 'ECF',
    esfera: 'federal',
    periodicidade: 'anual',
    mesVencimento: 7,
    diaVencimento: 31,
    descricao: 'Escrituração Contábil Fiscal',
  },
  {
    codigo: 'ECD',
    nome: 'ECD',
    esfera: 'federal',
    periodicidade: 'anual',
    mesVencimento: 5,
    diaVencimento: 31,
    descricao: 'Escrituração Contábil Digital',
  },
  {
    codigo: 'DIRF',
    nome: 'DIRF',
    esfera: 'federal',
    periodicidade: 'anual',
    mesVencimento: 2,
    diaVencimento: 28,
    descricao: 'Declaração de IR Retido na Fonte',
  },
  {
    codigo: 'PERDCOMP',
    nome: 'PER/DCOMP',
    esfera: 'federal',
    periodicidade: 'eventual',
    descricao: 'Pedido de Restituição ou Compensação',
  },

  // Estaduais
  {
    codigo: 'EFD-ICMS-IPI',
    nome: 'EFD ICMS/IPI',
    esfera: 'estadual',
    periodicidade: 'mensal',
    diaVencimento: 25,
    descricao: 'SPED Fiscal',
  },
  {
    codigo: 'GIA',
    nome: 'GIA',
    esfera: 'estadual',
    periodicidade: 'mensal',
    diaVencimento: 15,
    descricao: 'Guia de Informação e Apuração',
  },
  {
    codigo: 'DESTDA',
    nome: 'DeSTDA',
    esfera: 'estadual',
    periodicidade: 'mensal',
    diaVencimento: 28,
    descricao: 'Diferencial de Alíquota - Simples',
  },

  // Municipais
  {
    codigo: 'NFE-SERVICO',
    nome: 'NF-e de Serviço',
    esfera: 'municipal',
    periodicidade: 'mensal',
    diaVencimento: 10,
    descricao: 'Declaração de serviços prestados',
  },

  // Novas obrigações da Reforma Tributária (a partir de 2026)
  {
    codigo: 'EFD-IBS-CBS',
    nome: 'EFD-IBS/CBS',
    esfera: 'federal',
    periodicidade: 'mensal',
    diaVencimento: 20,
    descricao: 'Escrituração IBS e CBS',
    vigenciaInicio: 2026,
  },
  {
    codigo: 'DARF-UNIFICADO',
    nome: 'DARF Unificado',
    esfera: 'federal',
    periodicidade: 'mensal',
    diaVencimento: 25,
    descricao: 'Recolhimento IBS + CBS',
    vigenciaInicio: 2026,
  },
];
