export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const pct = (v: number) =>
  `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`;

export const LOCAL_LABEL: Record<string, string> = {
  estabelecimento_prestador: 'Estabelecimento prestador',
  local_da_prestacao: 'Local da prestação',
  domicilio_tomador: 'Domicílio do tomador',
};
