export interface ConfiguracaoCashback {
  percentualCBSCesta: number;
  percentualIBSCesta: number;
  percentualCBSEnergia: number;
  percentualIBSEnergia: number;
  percentualCBSGas: number;
  percentualIBSGas: number;
  percentualCBSTelecomunicacoes: number;
  percentualIBSTelecomunicacoes: number;
  percentualCBSDemais: number;
  percentualIBSDemais: number;
}

export const CASHBACK_PERCENTUAIS: ConfiguracaoCashback = {
  percentualCBSCesta: 100,
  percentualIBSCesta: 100,
  percentualCBSEnergia: 100,
  percentualIBSEnergia: 50,
  percentualCBSGas: 100,
  percentualIBSGas: 20,
  percentualCBSTelecomunicacoes: 20,
  percentualIBSTelecomunicacoes: 20,
  percentualCBSDemais: 20,
  percentualIBSDemais: 20,
};
