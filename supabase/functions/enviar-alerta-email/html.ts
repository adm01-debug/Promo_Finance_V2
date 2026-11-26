/**
 * Sanitização do texto que chega pelos fluxos que disparam e-mail
 * (`executar-regua-cobranca`, `gerar-resumo-financeiro-diario`, alertas do
 * `asaas-proxy`).
 *
 * O template monta o HTML desta função, então a conversão fica aqui — no dono
 * da marcação — e não nos chamadores: assim todo remetente fica protegido e o
 * mesmo texto pode seguir cru para canais de texto (WhatsApp), onde entidades
 * escapadas apareceriam literalmente para o cliente.
 */

/** Escapa os caracteres que permitem reescrever o HTML (`& < > " '`). */
export function escaparHtml(texto: string): string {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Escapa e converte quebras de linha em `<br />` (o HTML colapsa `\n`). */
export function textoParaHtml(texto: string): string {
  return escaparHtml(texto).replace(/\r\n|\r|\n/g, '<br />');
}

/**
 * Assunto viaja como texto puro no `subject` e interpolado no `<h2>`.
 * Aqui só se remove CR/LF — um `\n` abriria cabeçalho novo no e-mail — e o
 * nome entre `<` e `>` continua visível para o cliente. A versão para o `<h2>`
 * e `textoParaHtml`.
 */
export function assuntoSeguro(texto: string): string {
  return String(texto)
    .replace(/[\r\n]+/g, ' ')
    .trim();
}
