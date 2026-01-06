// ============================================
// UTILITÁRIO: EXPORTAÇÃO SPED/EFD
// Gera arquivos no formato oficial SPED
// ============================================

import { format, parseISO } from 'date-fns';

// Tipos
interface RegistroSPED {
  tipo: string;
  campos: string[];
}

interface DadosEmpresa {
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  uf?: string;
  codMunicipio?: string;
}

interface OperacaoTributavel {
  id: string;
  tipo_operacao: string;
  documento_numero?: string;
  documento_chave?: string;
  data_operacao: string;
  valor_operacao: number;
  cbs_aliquota: number;
  cbs_valor: number;
  ibs_aliquota: number;
  ibs_valor: number;
  is_aliquota: number;
  is_valor: number;
  participante_cnpj?: string;
  participante_nome?: string;
  cfop?: string;
  ncm?: string;
  descricao?: string;
}

interface CreditoTributario {
  id: string;
  tipo_tributo: string;
  tipo_credito: string;
  competencia_origem: string;
  valor_base: number;
  aliquota: number;
  valor_credito: number;
  status: string;
  fornecedor_cnpj?: string;
  documento_numero?: string;
}

interface ApuracaoTributaria {
  competencia: string;
  cbs_debitos: number;
  cbs_creditos: number;
  cbs_a_pagar: number;
  ibs_debitos: number;
  ibs_creditos: number;
  ibs_a_pagar: number;
  is_debitos: number;
  is_a_pagar: number;
}

// Formata valor numérico para SPED (sem separador de milhar, vírgula como decimal)
function formatarValorSPED(valor: number, casasDecimais: number = 2): string {
  return valor.toFixed(casasDecimais).replace('.', ',');
}

// Formata data para SPED (ddmmaaaa)
function formatarDataSPED(data: string | Date): string {
  const d = typeof data === 'string' ? parseISO(data) : data;
  return format(d, 'ddMMyyyy');
}

// Formata CNPJ sem pontuação
function formatarCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '').padStart(14, '0');
}

// Gera linha do SPED
function gerarLinhaSPED(registro: RegistroSPED): string {
  return `|${registro.tipo}|${registro.campos.join('|')}|`;
}

// ============================================
// EFD-IBS/CBS (Novo formato pós-reforma)
// ============================================

export function gerarEFD_IBS_CBS(
  empresa: DadosEmpresa,
  competencia: string, // YYYY-MM
  operacoes: OperacaoTributavel[],
  creditos: CreditoTributario[],
  apuracao: ApuracaoTributaria
): string {
  const linhas: string[] = [];
  const [ano, mes] = competencia.split('-');
  const dataInicio = `01${mes}${ano}`;
  const dataFim = format(new Date(Number(ano), Number(mes), 0), 'ddMMyyyy');

  // BLOCO 0 - Abertura, Identificação e Referências
  // Registro 0000 - Abertura do Arquivo Digital
  linhas.push(gerarLinhaSPED({
    tipo: '0000',
    campos: [
      '018', // Código versão layout
      '0', // Tipo escrituração (0 = original)
      dataInicio,
      dataFim,
      empresa.razaoSocial.substring(0, 100),
      formatarCNPJ(empresa.cnpj),
      empresa.uf || 'SP',
      empresa.inscricaoEstadual || '',
      empresa.codMunicipio || '',
      empresa.inscricaoMunicipal || '',
      '0', // Indicador atividade (0 = industrial)
    ],
  }));

  // Registro 0001 - Abertura Bloco 0
  linhas.push(gerarLinhaSPED({
    tipo: '0001',
    campos: ['0'], // 0 = com dados
  }));

  // Registro 0990 - Encerramento Bloco 0
  linhas.push(gerarLinhaSPED({
    tipo: '0990',
    campos: ['3'], // Quantidade de linhas do bloco
  }));

  // BLOCO C - Documentos Fiscais (Mercadorias)
  linhas.push(gerarLinhaSPED({
    tipo: 'C001',
    campos: [operacoes.filter(o => o.tipo_operacao === 'venda' || o.tipo_operacao === 'compra').length > 0 ? '0' : '1'],
  }));

  let contadorBlocoC = 1;
  
  // Registro C100 - Notas Fiscais de Entrada/Saída
  operacoes
    .filter(o => ['venda', 'compra', 'importacao', 'exportacao'].includes(o.tipo_operacao))
    .forEach((op, index) => {
      const indOper = op.tipo_operacao === 'venda' || op.tipo_operacao === 'exportacao' ? '1' : '0';
      
      linhas.push(gerarLinhaSPED({
        tipo: 'C100',
        campos: [
          indOper, // Indicador operação (0=entrada, 1=saída)
          '0', // Indicador emitente (0=próprio)
          formatarCNPJ(op.participante_cnpj || ''),
          '55', // Modelo documento (NF-e)
          '0', // Situação documento
          '001', // Série
          op.documento_numero || String(index + 1).padStart(9, '0'),
          op.documento_chave || '',
          formatarDataSPED(op.data_operacao),
          formatarDataSPED(op.data_operacao),
          formatarValorSPED(op.valor_operacao),
          '0', // Indicador pagamento
          formatarValorSPED(0), // Desconto
          formatarValorSPED(0), // Abatimento
          formatarValorSPED(op.valor_operacao), // Valor mercadorias
          formatarValorSPED(0), // Frete
          formatarValorSPED(0), // Seguro
          formatarValorSPED(0), // Outras despesas
          formatarValorSPED(op.cbs_valor), // CBS
          formatarValorSPED(op.ibs_valor), // IBS
          formatarValorSPED(op.is_valor), // IS
        ],
      }));
      contadorBlocoC++;

      // Registro C190 - Resumo por CFOP/CST
      linhas.push(gerarLinhaSPED({
        tipo: 'C190',
        campos: [
          '00', // CST CBS
          op.cfop || (indOper === '1' ? '5102' : '1102'),
          formatarValorSPED((op.cbs_aliquota + op.ibs_aliquota) * 100, 2),
          formatarValorSPED(op.valor_operacao),
          formatarValorSPED(op.valor_operacao),
          formatarValorSPED(0),
          formatarValorSPED(op.cbs_valor),
          formatarValorSPED(op.ibs_valor),
          formatarValorSPED(op.is_valor),
          '',
          '0',
        ],
      }));
      contadorBlocoC++;
    });

  linhas.push(gerarLinhaSPED({
    tipo: 'C990',
    campos: [String(contadorBlocoC + 1)],
  }));

  // BLOCO D - Documentos Fiscais (Serviços - ISSQN)
  linhas.push(gerarLinhaSPED({
    tipo: 'D001',
    campos: [operacoes.filter(o => o.tipo_operacao.includes('servico')).length > 0 ? '0' : '1'],
  }));

  let contadorBlocoD = 1;

  operacoes
    .filter(o => ['servico_prestado', 'servico_tomado'].includes(o.tipo_operacao))
    .forEach((op, index) => {
      linhas.push(gerarLinhaSPED({
        tipo: 'D100',
        campos: [
          op.tipo_operacao === 'servico_prestado' ? '1' : '0',
          '0',
          formatarCNPJ(op.participante_cnpj || ''),
          'SE', // Modelo NFS-e
          '0',
          '001',
          op.documento_numero || String(index + 1).padStart(9, '0'),
          formatarDataSPED(op.data_operacao),
          formatarValorSPED(op.valor_operacao),
          formatarValorSPED(0),
          formatarValorSPED(op.valor_operacao),
          formatarValorSPED(op.cbs_valor),
          formatarValorSPED(op.ibs_valor),
        ],
      }));
      contadorBlocoD++;
    });

  linhas.push(gerarLinhaSPED({
    tipo: 'D990',
    campos: [String(contadorBlocoD + 1)],
  }));

  // BLOCO M - Apuração da Contribuição e Créditos
  linhas.push(gerarLinhaSPED({
    tipo: 'M001',
    campos: ['0'],
  }));

  // Registro M100 - Créditos de CBS
  creditos
    .filter(c => c.tipo_tributo === 'CBS')
    .forEach(credito => {
      linhas.push(gerarLinhaSPED({
        tipo: 'M100',
        campos: [
          credito.tipo_credito === 'normal' ? '01' : '04',
          '0',
          formatarValorSPED(credito.valor_base),
          formatarValorSPED(credito.aliquota * 100, 2),
          formatarValorSPED(credito.valor_credito),
        ],
      }));
    });

  // Registro M200 - Consolidação Créditos CBS
  const totalCreditosCBS = creditos
    .filter(c => c.tipo_tributo === 'CBS')
    .reduce((sum, c) => sum + c.valor_credito, 0);

  linhas.push(gerarLinhaSPED({
    tipo: 'M200',
    campos: [
      formatarValorSPED(0), // Saldo anterior
      formatarValorSPED(totalCreditosCBS), // Créditos período
      formatarValorSPED(0), // Ajustes
      formatarValorSPED(totalCreditosCBS), // Total disponível
      formatarValorSPED(apuracao.cbs_creditos), // Utilizado
      formatarValorSPED(totalCreditosCBS - apuracao.cbs_creditos), // Saldo final
    ],
  }));

  // Registro M500 - Créditos de IBS
  creditos
    .filter(c => c.tipo_tributo === 'IBS')
    .forEach(credito => {
      linhas.push(gerarLinhaSPED({
        tipo: 'M500',
        campos: [
          credito.tipo_credito === 'normal' ? '01' : '04',
          '0',
          formatarValorSPED(credito.valor_base),
          formatarValorSPED(credito.aliquota * 100, 2),
          formatarValorSPED(credito.valor_credito),
        ],
      }));
    });

  // Registro M600 - Consolidação Créditos IBS
  const totalCreditosIBS = creditos
    .filter(c => c.tipo_tributo === 'IBS')
    .reduce((sum, c) => sum + c.valor_credito, 0);

  linhas.push(gerarLinhaSPED({
    tipo: 'M600',
    campos: [
      formatarValorSPED(0),
      formatarValorSPED(totalCreditosIBS),
      formatarValorSPED(0),
      formatarValorSPED(totalCreditosIBS),
      formatarValorSPED(apuracao.ibs_creditos),
      formatarValorSPED(totalCreditosIBS - apuracao.ibs_creditos),
    ],
  }));

  // Registro M800 - Apuração CBS
  linhas.push(gerarLinhaSPED({
    tipo: 'M800',
    campos: [
      formatarValorSPED(apuracao.cbs_debitos), // Débitos
      formatarValorSPED(apuracao.cbs_creditos), // Créditos
      formatarValorSPED(0), // Ajustes
      formatarValorSPED(apuracao.cbs_a_pagar), // A pagar
      formatarValorSPED(0), // Saldo credor
    ],
  }));

  // Registro M810 - Apuração IBS
  linhas.push(gerarLinhaSPED({
    tipo: 'M810',
    campos: [
      formatarValorSPED(apuracao.ibs_debitos),
      formatarValorSPED(apuracao.ibs_creditos),
      formatarValorSPED(0),
      formatarValorSPED(apuracao.ibs_a_pagar),
      formatarValorSPED(0),
    ],
  }));

  // Registro M820 - Apuração IS
  linhas.push(gerarLinhaSPED({
    tipo: 'M820',
    campos: [
      formatarValorSPED(apuracao.is_debitos),
      formatarValorSPED(0), // IS não tem crédito
      formatarValorSPED(apuracao.is_a_pagar),
    ],
  }));

  linhas.push(gerarLinhaSPED({
    tipo: 'M990',
    campos: ['12'], // Quantidade linhas bloco M
  }));

  // BLOCO 9 - Encerramento
  linhas.push(gerarLinhaSPED({
    tipo: '9001',
    campos: ['0'],
  }));

  linhas.push(gerarLinhaSPED({
    tipo: '9900',
    campos: ['0000', '1'],
  }));

  linhas.push(gerarLinhaSPED({
    tipo: '9999',
    campos: [String(linhas.length + 2)], // Total de registros
  }));

  return linhas.join('\r\n');
}

// ============================================
// EFD-Contribuições (PIS/COFINS residual)
// ============================================

export function gerarEFD_Contribuicoes(
  empresa: DadosEmpresa,
  competencia: string,
  operacoes: OperacaoTributavel[],
  creditos: CreditoTributario[]
): string {
  const linhas: string[] = [];
  const [ano, mes] = competencia.split('-');
  const dataInicio = `01${mes}${ano}`;
  const dataFim = format(new Date(Number(ano), Number(mes), 0), 'ddMMyyyy');

  // Registro 0000 - Abertura
  linhas.push(gerarLinhaSPED({
    tipo: '0000',
    campos: [
      '006', // Versão layout
      '0', // Tipo escrituração
      dataInicio,
      dataFim,
      empresa.razaoSocial.substring(0, 100),
      formatarCNPJ(empresa.cnpj),
      empresa.uf || 'SP',
      empresa.codMunicipio || '',
      '', // Suframa
      '1', // Natureza jurídica
      '1', // Atividade preponderante
    ],
  }));

  linhas.push(gerarLinhaSPED({
    tipo: '0001',
    campos: ['0'],
  }));

  linhas.push(gerarLinhaSPED({
    tipo: '0990',
    campos: ['3'],
  }));

  // Blocos simplificados
  linhas.push(gerarLinhaSPED({ tipo: 'A001', campos: ['1'] })); // Serviços - sem dados
  linhas.push(gerarLinhaSPED({ tipo: 'A990', campos: ['2'] }));

  linhas.push(gerarLinhaSPED({ tipo: 'C001', campos: ['1'] })); // Mercadorias - sem dados
  linhas.push(gerarLinhaSPED({ tipo: 'C990', campos: ['2'] }));

  linhas.push(gerarLinhaSPED({ tipo: 'D001', campos: ['1'] })); // Serviços ISSQN
  linhas.push(gerarLinhaSPED({ tipo: 'D990', campos: ['2'] }));

  linhas.push(gerarLinhaSPED({ tipo: 'F001', campos: ['1'] })); // Demais documentos
  linhas.push(gerarLinhaSPED({ tipo: 'F990', campos: ['2'] }));

  linhas.push(gerarLinhaSPED({ tipo: 'M001', campos: ['1'] })); // Apuração
  linhas.push(gerarLinhaSPED({ tipo: 'M990', campos: ['2'] }));

  // Bloco 9 - Encerramento
  linhas.push(gerarLinhaSPED({ tipo: '9001', campos: ['0'] }));
  linhas.push(gerarLinhaSPED({ tipo: '9900', campos: ['0000', '1'] }));
  linhas.push(gerarLinhaSPED({ tipo: '9999', campos: [String(linhas.length + 2)] }));

  return linhas.join('\r\n');
}

// ============================================
// Geração de arquivo para download
// ============================================

export function downloadArquivoSPED(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Validador básico de SPED
export function validarArquivoSPED(conteudo: string): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const linhas = conteudo.split('\r\n');

  // Verificar registro inicial
  if (!linhas[0]?.startsWith('|0000|')) {
    erros.push('Arquivo deve iniciar com registro 0000');
  }

  // Verificar registro final
  if (!linhas[linhas.length - 1]?.startsWith('|9999|')) {
    erros.push('Arquivo deve terminar com registro 9999');
  }

  // Verificar formato das linhas
  linhas.forEach((linha, index) => {
    if (linha && !linha.startsWith('|')) {
      erros.push(`Linha ${index + 1}: formato inválido`);
    }
  });

  return {
    valido: erros.length === 0,
    erros,
  };
}
