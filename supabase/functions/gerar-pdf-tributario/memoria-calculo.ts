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
  splitTextToSize?(texto: string, largura: number): string[];
}

/**
 * Geometria da nota na pagina (mm) e o piso do bloco seguinte. `baseLegalMinY` e o
 * Y historico da base legal: com a nota em duas linhas o layout nao muda; com
 * razao social longa (o cadastro aceita 255 caracteres) a base legal e a tabela
 * descem junto, em vez de o texto da nota escrever por cima delas.
 */
export const NOTA_GEOMETRIA = {
  y: 33,
  maxWidth: 180,
  /** Entrelinha da fonte 9 no jsPDF (mm). */
  alturaLinha: 3.7,
  /** Folga entre a ultima linha da nota e a base legal (mm). */
  folga: 4,
  /** Y minimo da base legal; a tabela entra 6 mm abaixo dela. */
  baseLegalMinY: 44,
  /** Caracteres por linha usados quando o doc nao expoe `splitTextToSize`. */
  caracteresPorLinha: 112,
};

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

/**
 * Emite a nota na página de memória de cálculo, abaixo do subtítulo, e devolve o Y
 * livre para o bloco seguinte (base legal e tabela).
 */
export function renderNotaCreditoApuracao(
  doc: DocPaginaPdf,
  empresaNome: string,
  y: number = NOTA_GEOMETRIA.y
): number {
  const texto = notaCreditoApuracao(empresaNome);
  doc.setFontSize?.(9);
  doc.setTextColor?.(100, 116, 139);
  doc.text(texto, 15, y, { maxWidth: NOTA_GEOMETRIA.maxWidth });

  const linhas = doc.splitTextToSize
    ? doc.splitTextToSize(texto, NOTA_GEOMETRIA.maxWidth).length
    : Math.ceil(texto.length / NOTA_GEOMETRIA.caracteresPorLinha);

  return Math.max(
    NOTA_GEOMETRIA.baseLegalMinY,
    y + Math.max(1, linhas) * NOTA_GEOMETRIA.alturaLinha + NOTA_GEOMETRIA.folga
  );
}
