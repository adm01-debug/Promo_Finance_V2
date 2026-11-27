// Nota da página "Memória de Cálculo IBS/CBS" (etapa 94) do PDF executivo.
//
// A apuração só apropria crédito com origem = xml_destacado e
// efeito_tributario = true (useApuracoesTributarias.ts). O crédito estimado por
// alíquota existe na base e aparece na aba Créditos do painel
// (GestorCreditosTributarios.tsx), mas não entra nos números desta página.
//
// A nota fica fora do handler porque o buffer do jsPDF não é legível (streams
// comprimidos): em vez de garantir a string na fonte, o teste chama o render com
// um dublê da página e confere o que seria impresso.

export interface DocPaginaPdf {
  setFontSize?(tamanho: number): void;
  setTextColor?(r: number, g: number, b: number): void;
  text(texto: string, x: number, y: number, opcoes?: { maxWidth: number }): void;
}

/**
 * Texto da nota. `empresaNome` é a empresa do relatório: a aba Créditos segue a
 * empresa selecionada no painel, então a nota diz qual empresa selecionar para
 * achar os documentos citados.
 */
export function notaCreditoApuracao(empresaNome: string): string {
  return (
    'Créditos apropriados: documentos com origem XML destacado (grupo IBSCBS da NF-e). ' +
    'Crédito estimado por alíquota não entra neste total; a discriminação por documento ' +
    `consta na aba Créditos do painel da Reforma Tributária, com a empresa ${empresaNome} selecionada.`
  );
}

/** Emite a nota na página de memória de cálculo, abaixo do subtítulo. */
export function renderNotaCreditoApuracao(doc: DocPaginaPdf, empresaNome: string): void {
  doc.setFontSize?.(9);
  doc.setTextColor?.(100, 116, 139);
  doc.text(notaCreditoApuracao(empresaNome), 15, 33, { maxWidth: 180 });
}
