import type { EfdContribuicoesInput } from '../layout.ts';

/**
 * Dois cenários fixos: COM crédito (`M100` presente, bloco M com 5
 * registros) e SEM crédito (`M100` ausente, bloco M com 4). É exatamente a
 * variação que expôs o `|M990|5|` cravado — o teste "sem crédito" é o que
 * teria pegado o defeito original antes dele ir para produção.
 */
export const EFD_CONTRIB_COM_CREDITO: EfdContribuicoesInput = {
  empresa: {
    cnpj: '12.345.678/0001-99',
    razao_social: 'Empresa Teste EFD LTDA',
    inscricao_estadual: '110042490114',
    inscricao_municipal: '987654321',
  },
  ano: 2026,
  mes: 3,
  apuracao: {
    cbs_creditos: 1500.5,
    cbs_debitos: 4200.75,
    cbs_a_pagar: 2700.25,
  },
};

export const EFD_CONTRIB_SEM_CREDITO: EfdContribuicoesInput = {
  ...EFD_CONTRIB_COM_CREDITO,
  apuracao: {
    cbs_creditos: 0,
    cbs_debitos: 4200.75,
    cbs_a_pagar: 4200.75,
  },
};

export const EFD_CONTRIB_SEM_APURACAO: EfdContribuicoesInput = {
  ...EFD_CONTRIB_COM_CREDITO,
  apuracao: null,
};
