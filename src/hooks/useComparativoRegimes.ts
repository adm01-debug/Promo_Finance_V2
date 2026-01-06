// ============================================
// HOOK: COMPARATIVO DE REGIMES TRIBUTÁRIOS
// Lucro Real vs Presumido vs Simples Nacional
// ============================================

import { useState, useMemo } from 'react';
import { ALIQUOTAS_TRANSICAO } from '@/types/reforma-tributaria';

export interface ParametrosSimulacao {
  faturamentoAnual: number;
  folhaPagamento: number;
  despesasOperacionais: number;
  comprasCredito: number; // Compras que geram crédito
  servicosCredito: number;
  atividadePrincipal: 'comercio' | 'industria' | 'servicos';
  percentualServicos: number; // % do faturamento em serviços
  ano: number;
}

export interface ResultadoRegime {
  regime: 'lucro_real' | 'lucro_presumido' | 'simples_nacional';
  nome: string;
  // Tributos federais
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  cpp?: number; // Contribuição Previdenciária Patronal
  // Novos tributos
  cbs: number;
  ibs: number;
  // Tributos estaduais/municipais
  icms: number;
  iss: number;
  // Créditos
  creditosRecuperaveis: number;
  // Totais
  totalTributos: number;
  cargaEfetiva: number;
  // Detalhes
  baseCalculoIR: number;
  observacoes: string[];
}

export interface ComparativoResult {
  parametros: ParametrosSimulacao;
  resultados: ResultadoRegime[];
  melhorOpcao: ResultadoRegime;
  economiaMelhorOpcao: number;
  economiaVsAtual?: number;
}

// Tabela do Simples Nacional - Anexo I (Comércio)
const SIMPLES_ANEXO_I = [
  { faixa: 1, ate: 180000, aliquota: 4.0, deducao: 0 },
  { faixa: 2, ate: 360000, aliquota: 7.3, deducao: 5940 },
  { faixa: 3, ate: 720000, aliquota: 9.5, deducao: 13860 },
  { faixa: 4, ate: 1800000, aliquota: 10.7, deducao: 22500 },
  { faixa: 5, ate: 3600000, aliquota: 14.3, deducao: 87300 },
  { faixa: 6, ate: 4800000, aliquota: 19.0, deducao: 378000 },
];

// Tabela do Simples Nacional - Anexo III (Serviços)
const SIMPLES_ANEXO_III = [
  { faixa: 1, ate: 180000, aliquota: 6.0, deducao: 0 },
  { faixa: 2, ate: 360000, aliquota: 11.2, deducao: 9360 },
  { faixa: 3, ate: 720000, aliquota: 13.5, deducao: 17640 },
  { faixa: 4, ate: 1800000, aliquota: 16.0, deducao: 35640 },
  { faixa: 5, ate: 3600000, aliquota: 21.0, deducao: 125640 },
  { faixa: 6, ate: 4800000, aliquota: 33.0, deducao: 648000 },
];

export function useComparativoRegimes() {
  const [parametros, setParametros] = useState<ParametrosSimulacao>({
    faturamentoAnual: 1200000,
    folhaPagamento: 240000,
    despesasOperacionais: 360000,
    comprasCredito: 480000,
    servicosCredito: 60000,
    atividadePrincipal: 'comercio',
    percentualServicos: 10,
    ano: 2026,
  });

  const calcularLucroReal = (params: ParametrosSimulacao): ResultadoRegime => {
    const aliquotas = ALIQUOTAS_TRANSICAO.find(a => a.ano === params.ano) || ALIQUOTAS_TRANSICAO[0];
    
    // Base de cálculo do IRPJ/CSLL = Lucro Contábil
    const lucroContabil = params.faturamentoAnual - params.despesasOperacionais - params.folhaPagamento;
    const baseCalculoIR = Math.max(0, lucroContabil);
    
    // IRPJ: 15% + adicional 10% sobre excedente de R$ 240.000/ano
    const irpjNormal = baseCalculoIR * 0.15;
    const irpjAdicional = Math.max(0, baseCalculoIR - 240000) * 0.10;
    const irpj = irpjNormal + irpjAdicional;
    
    // CSLL: 9%
    const csll = baseCalculoIR * 0.09;
    
    // PIS/COFINS não-cumulativo (até 2026) - depois migra para CBS
    const pisAntigo = params.faturamentoAnual * 0.0165;
    const cofinsAntigo = params.faturamentoAnual * 0.076;
    const creditosPisCofins = (params.comprasCredito + params.servicosCredito) * 0.0925;
    const pisCofinsLiquido = Math.max(0, pisAntigo + cofinsAntigo - creditosPisCofins);
    
    // CBS/IBS (novos tributos)
    const cbsBruto = params.faturamentoAnual * (aliquotas.cbs / 100);
    const ibsBruto = params.faturamentoAnual * (aliquotas.ibs / 100);
    const creditosCBS = (params.comprasCredito + params.servicosCredito) * (aliquotas.cbs / 100);
    const creditosIBS = (params.comprasCredito + params.servicosCredito) * (aliquotas.ibs / 100);
    const cbs = Math.max(0, cbsBruto - creditosCBS);
    const ibs = Math.max(0, ibsBruto - creditosIBS);
    
    // ICMS/ISS residuais (período de transição)
    const faturamentoMercadorias = params.faturamentoAnual * (1 - params.percentualServicos / 100);
    const faturamentoServicos = params.faturamentoAnual * (params.percentualServicos / 100);
    const icmsResidual = faturamentoMercadorias * 0.18 * (aliquotas.icmsResidual / 100);
    const issResidual = faturamentoServicos * 0.05 * (aliquotas.issResidual / 100);
    
    // CPP: 20% sobre folha
    const cpp = params.folhaPagamento * 0.20;
    
    // Créditos totais recuperáveis
    const creditosRecuperaveis = creditosCBS + creditosIBS + creditosPisCofins;
    
    // Total de tributos
    const pis = pisCofinsLiquido * (aliquotas.pisResidual / 100);
    const cofins = 0; // Já incluído no PIS/COFINS combinado acima
    const totalTributos = irpj + csll + pis + cbs + ibs + icmsResidual + issResidual + cpp;
    const cargaEfetiva = (totalTributos / params.faturamentoAnual) * 100;

    return {
      regime: 'lucro_real',
      nome: 'Lucro Real',
      irpj,
      csll,
      pis,
      cofins,
      cpp,
      cbs,
      ibs,
      icms: icmsResidual,
      iss: issResidual,
      creditosRecuperaveis,
      totalTributos,
      cargaEfetiva,
      baseCalculoIR,
      observacoes: [
        'Não-cumulatividade plena de CBS/IBS',
        'Créditos integrais sobre aquisições',
        'IRPJ/CSLL sobre lucro efetivo',
      ],
    };
  };

  const calcularLucroPresumido = (params: ParametrosSimulacao): ResultadoRegime => {
    const aliquotas = ALIQUOTAS_TRANSICAO.find(a => a.ano === params.ano) || ALIQUOTAS_TRANSICAO[0];
    
    // Presunção de lucro: 8% comércio/indústria, 32% serviços
    const faturamentoMercadorias = params.faturamentoAnual * (1 - params.percentualServicos / 100);
    const faturamentoServicos = params.faturamentoAnual * (params.percentualServicos / 100);
    
    const basePresumidaMerc = faturamentoMercadorias * 0.08;
    const basePresumidaServ = faturamentoServicos * 0.32;
    const baseCalculoIR = basePresumidaMerc + basePresumidaServ;
    
    // IRPJ: 15% + adicional
    const irpjNormal = baseCalculoIR * 0.15;
    const irpjAdicional = Math.max(0, baseCalculoIR - 240000) * 0.10;
    const irpj = irpjNormal + irpjAdicional;
    
    // CSLL: Base diferente (12% merc, 32% serv)
    const baseCSLLMerc = faturamentoMercadorias * 0.12;
    const baseCSLLServ = faturamentoServicos * 0.32;
    const csll = (baseCSLLMerc + baseCSLLServ) * 0.09;
    
    // PIS/COFINS cumulativo
    const pis = params.faturamentoAnual * 0.0065 * (aliquotas.pisResidual / 100);
    const cofins = params.faturamentoAnual * 0.03 * (aliquotas.cofinsResidual / 100);
    
    // CBS/IBS - SEM direito a crédito no presumido
    const cbs = params.faturamentoAnual * (aliquotas.cbs / 100);
    const ibs = params.faturamentoAnual * (aliquotas.ibs / 100);
    
    // ICMS/ISS
    const icms = faturamentoMercadorias * 0.18 * (aliquotas.icmsResidual / 100);
    const iss = faturamentoServicos * 0.05 * (aliquotas.issResidual / 100);
    
    // CPP
    const cpp = params.folhaPagamento * 0.20;
    
    const totalTributos = irpj + csll + pis + cofins + cbs + ibs + icms + iss + cpp;
    const cargaEfetiva = (totalTributos / params.faturamentoAnual) * 100;

    return {
      regime: 'lucro_presumido',
      nome: 'Lucro Presumido',
      irpj,
      csll,
      pis,
      cofins,
      cpp,
      cbs,
      ibs,
      icms,
      iss,
      creditosRecuperaveis: 0,
      totalTributos,
      cargaEfetiva,
      baseCalculoIR,
      observacoes: [
        'Sem direito a créditos de CBS/IBS',
        'PIS/COFINS cumulativo',
        'Base de IR presumida (pode ser vantajoso se lucro real > presumido)',
      ],
    };
  };

  const calcularSimplesNacional = (params: ParametrosSimulacao): ResultadoRegime => {
    if (params.faturamentoAnual > 4800000) {
      return {
        regime: 'simples_nacional',
        nome: 'Simples Nacional',
        irpj: 0,
        csll: 0,
        pis: 0,
        cofins: 0,
        cbs: 0,
        ibs: 0,
        icms: 0,
        iss: 0,
        creditosRecuperaveis: 0,
        totalTributos: 0,
        cargaEfetiva: 0,
        baseCalculoIR: 0,
        observacoes: ['NÃO ELEGÍVEL - Faturamento acima de R$ 4,8 milhões'],
      };
    }

    const anexo = params.atividadePrincipal === 'servicos' ? SIMPLES_ANEXO_III : SIMPLES_ANEXO_I;
    const faixaAtual = anexo.find(f => params.faturamentoAnual <= f.ate) || anexo[anexo.length - 1];
    
    const aliquotaEfetiva = ((params.faturamentoAnual * faixaAtual.aliquota / 100) - faixaAtual.deducao) / params.faturamentoAnual * 100;
    const totalTributos = params.faturamentoAnual * (aliquotaEfetiva / 100);

    return {
      regime: 'simples_nacional',
      nome: 'Simples Nacional',
      irpj: totalTributos * 0.055, // Aproximação da partilha
      csll: totalTributos * 0.035,
      pis: totalTributos * 0.038,
      cofins: totalTributos * 0.112,
      cbs: 0, // Já incluído no DAS
      ibs: 0, // Já incluído no DAS
      icms: totalTributos * 0.34,
      iss: totalTributos * 0.42 * (params.percentualServicos / 100),
      creditosRecuperaveis: 0,
      totalTributos,
      cargaEfetiva: aliquotaEfetiva,
      baseCalculoIR: params.faturamentoAnual,
      observacoes: [
        `Faixa ${faixaAtual.faixa}: ${faixaAtual.aliquota}% nominal`,
        `Alíquota efetiva: ${aliquotaEfetiva.toFixed(2)}%`,
        'Sem direito a créditos de CBS/IBS',
        'Recolhimento unificado via DAS',
      ],
    };
  };

  const resultado = useMemo((): ComparativoResult => {
    const lucroReal = calcularLucroReal(parametros);
    const lucroPresumido = calcularLucroPresumido(parametros);
    const simplesNacional = calcularSimplesNacional(parametros);

    const resultados = [lucroReal, lucroPresumido, simplesNacional];
    const regimesValidos = resultados.filter(r => r.totalTributos > 0);
    const melhorOpcao = regimesValidos.reduce((prev, curr) => 
      curr.totalTributos < prev.totalTributos ? curr : prev
    );
    
    const piorOpcao = regimesValidos.reduce((prev, curr) => 
      curr.totalTributos > prev.totalTributos ? curr : prev
    );
    
    const economiaMelhorOpcao = piorOpcao.totalTributos - melhorOpcao.totalTributos;

    return {
      parametros,
      resultados,
      melhorOpcao,
      economiaMelhorOpcao,
    };
  }, [parametros]);

  return {
    parametros,
    setParametros,
    resultado,
    calcularLucroReal,
    calcularLucroPresumido,
    calcularSimplesNacional,
  };
}

export default useComparativoRegimes;
