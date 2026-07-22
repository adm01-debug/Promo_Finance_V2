import { format } from 'date-fns';
import {
  formatarCNPJ,
  formatarDataSPED,
  formatarValorSPED,
  gerarLinhaSPED,
  type ApuracaoTributaria,
  type CreditoTributario,
  type DadosEmpresa,
  type OperacaoTributavel,
} from './core';

export function gerarEFD_IBS_CBS(
  empresa: DadosEmpresa,
  competencia: string,
  operacoes: OperacaoTributavel[],
  creditos: CreditoTributario[],
  apuracao: ApuracaoTributaria,
): string {
  const linhas: string[] = [];
  const [ano, mes] = competencia.split('-');
  const dataInicio = `01${mes}${ano}`;
  const dataFim = format(new Date(Number(ano), Number(mes), 0), 'ddMMyyyy');

  linhas.push(
    gerarLinhaSPED({
      tipo: '0000',
      campos: [
        '018',
        '0',
        dataInicio,
        dataFim,
        empresa.razaoSocial.substring(0, 100),
        formatarCNPJ(empresa.cnpj),
        empresa.uf || 'SP',
        empresa.inscricaoEstadual || '',
        empresa.codMunicipio || '',
        empresa.inscricaoMunicipal || '',
        '0',
      ],
    }),
  );

  linhas.push(gerarLinhaSPED({ tipo: '0001', campos: ['0'] }));
  linhas.push(gerarLinhaSPED({ tipo: '0990', campos: ['3'] }));

  linhas.push(
    gerarLinhaSPED({
      tipo: 'C001',
      campos: [
        operacoes.filter((o) => o.tipo_operacao === 'venda' || o.tipo_operacao === 'compra')
          .length > 0
          ? '0'
          : '1',
      ],
    }),
  );

  let contadorBlocoC = 1;

  operacoes
    .filter((o) => ['venda', 'compra', 'importacao', 'exportacao'].includes(o.tipo_operacao))
    .forEach((op, index) => {
      const indOper =
        op.tipo_operacao === 'venda' || op.tipo_operacao === 'exportacao' ? '1' : '0';

      linhas.push(
        gerarLinhaSPED({
          tipo: 'C100',
          campos: [
            indOper,
            '0',
            formatarCNPJ(op.participante_cnpj || ''),
            '55',
            '0',
            '001',
            op.documento_numero || String(index + 1).padStart(9, '0'),
            op.documento_chave || '',
            formatarDataSPED(op.data_operacao),
            formatarDataSPED(op.data_operacao),
            formatarValorSPED(op.valor_operacao),
            '0',
            formatarValorSPED(0),
            formatarValorSPED(0),
            formatarValorSPED(op.valor_operacao),
            formatarValorSPED(0),
            formatarValorSPED(0),
            formatarValorSPED(0),
            formatarValorSPED(op.cbs_valor),
            formatarValorSPED(op.ibs_valor),
            formatarValorSPED(op.is_valor),
          ],
        }),
      );
      contadorBlocoC++;

      linhas.push(
        gerarLinhaSPED({
          tipo: 'C190',
          campos: [
            '00',
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
        }),
      );
      contadorBlocoC++;
    });

  linhas.push(gerarLinhaSPED({ tipo: 'C990', campos: [String(contadorBlocoC + 1)] }));

  linhas.push(
    gerarLinhaSPED({
      tipo: 'D001',
      campos: [operacoes.filter((o) => o.tipo_operacao.includes('servico')).length > 0 ? '0' : '1'],
    }),
  );

  let contadorBlocoD = 1;

  operacoes
    .filter((o) => ['servico_prestado', 'servico_tomado'].includes(o.tipo_operacao))
    .forEach((op, index) => {
      linhas.push(
        gerarLinhaSPED({
          tipo: 'D100',
          campos: [
            op.tipo_operacao === 'servico_prestado' ? '1' : '0',
            '0',
            formatarCNPJ(op.participante_cnpj || ''),
            'SE',
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
        }),
      );
      contadorBlocoD++;
    });

  linhas.push(gerarLinhaSPED({ tipo: 'D990', campos: [String(contadorBlocoD + 1)] }));

  linhas.push(gerarLinhaSPED({ tipo: 'M001', campos: ['0'] }));

  creditos
    .filter((c) => c.tipo_tributo === 'CBS')
    .forEach((credito) => {
      linhas.push(
        gerarLinhaSPED({
          tipo: 'M100',
          campos: [
            credito.tipo_credito === 'normal' ? '01' : '04',
            '0',
            formatarValorSPED(credito.valor_base),
            formatarValorSPED(credito.aliquota * 100, 2),
            formatarValorSPED(credito.valor_credito),
          ],
        }),
      );
    });

  const totalCreditosCBS = creditos
    .filter((c) => c.tipo_tributo === 'CBS')
    .reduce((sum, c) => sum + c.valor_credito, 0);

  linhas.push(
    gerarLinhaSPED({
      tipo: 'M200',
      campos: [
        formatarValorSPED(0),
        formatarValorSPED(totalCreditosCBS),
        formatarValorSPED(0),
        formatarValorSPED(totalCreditosCBS),
        formatarValorSPED(apuracao.cbs_creditos),
        formatarValorSPED(totalCreditosCBS - apuracao.cbs_creditos),
      ],
    }),
  );

  creditos
    .filter((c) => c.tipo_tributo === 'IBS')
    .forEach((credito) => {
      linhas.push(
        gerarLinhaSPED({
          tipo: 'M500',
          campos: [
            credito.tipo_credito === 'normal' ? '01' : '04',
            '0',
            formatarValorSPED(credito.valor_base),
            formatarValorSPED(credito.aliquota * 100, 2),
            formatarValorSPED(credito.valor_credito),
          ],
        }),
      );
    });

  const totalCreditosIBS = creditos
    .filter((c) => c.tipo_tributo === 'IBS')
    .reduce((sum, c) => sum + c.valor_credito, 0);

  linhas.push(
    gerarLinhaSPED({
      tipo: 'M600',
      campos: [
        formatarValorSPED(0),
        formatarValorSPED(totalCreditosIBS),
        formatarValorSPED(0),
        formatarValorSPED(totalCreditosIBS),
        formatarValorSPED(apuracao.ibs_creditos),
        formatarValorSPED(totalCreditosIBS - apuracao.ibs_creditos),
      ],
    }),
  );

  linhas.push(
    gerarLinhaSPED({
      tipo: 'M800',
      campos: [
        formatarValorSPED(apuracao.cbs_debitos),
        formatarValorSPED(apuracao.cbs_creditos),
        formatarValorSPED(0),
        formatarValorSPED(apuracao.cbs_a_pagar),
        formatarValorSPED(0),
      ],
    }),
  );

  linhas.push(
    gerarLinhaSPED({
      tipo: 'M810',
      campos: [
        formatarValorSPED(apuracao.ibs_debitos),
        formatarValorSPED(apuracao.ibs_creditos),
        formatarValorSPED(0),
        formatarValorSPED(apuracao.ibs_a_pagar),
        formatarValorSPED(0),
      ],
    }),
  );

  linhas.push(
    gerarLinhaSPED({
      tipo: 'M820',
      campos: [
        formatarValorSPED(apuracao.is_debitos),
        formatarValorSPED(0),
        formatarValorSPED(apuracao.is_a_pagar),
      ],
    }),
  );

  linhas.push(gerarLinhaSPED({ tipo: 'M990', campos: ['12'] }));

  linhas.push(gerarLinhaSPED({ tipo: '9001', campos: ['0'] }));
  linhas.push(gerarLinhaSPED({ tipo: '9900', campos: ['0000', '1'] }));
  linhas.push(gerarLinhaSPED({ tipo: '9999', campos: [String(linhas.length + 2)] }));

  return linhas.join('\r\n');
}
