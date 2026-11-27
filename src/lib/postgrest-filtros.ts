/**
 * Escapa um valor para uso dentro de filtros lógicos (`.or()` / `.and()`) do
 * PostgREST. Sem as aspas duplas, caracteres como `,`, `.` e `(` são lidos
 * como separadores da gramática de filtros e a consulta falha.
 */
export function valorPostgrest(valor: string): string {
  return `"${valor.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Monta um padrão `ILIKE` "contém" a partir de texto livre, tratando `%` e `_`
 * digitados pelo usuário como literais em vez de curingas.
 */
export function padraoIlikeContem(texto: string): string {
  const comCuringasEscapados = texto.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
  return valorPostgrest(`%${comCuringasEscapados}%`);
}
