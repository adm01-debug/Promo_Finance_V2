export interface EmpresaComparativo {
  id: string;
  nome: string;
  cnpj: string;
  receitas: number;
  despesas: number;
  lucro: number;
  margem: number;
  saldo: number;
  aReceber: number;
  aPagar: number;
  inadimplencia: number;
  liquidez: number;
  contasCount: number;
  ticketMedio: number;
  saldoProjetado: number;
}

export interface BIEmpresasTabProps {
  comparativoEmpresas: EmpresaComparativo[];
}
