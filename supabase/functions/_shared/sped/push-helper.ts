/**
 * Rastreador de linhas SPED: acumula as linhas do arquivo e conta quantas
 * pertencem a cada bloco (primeiro caractere do código de registro), para
 * que os registros de fechamento de bloco (`X990`) tenham a contagem real
 * em vez de um número cravado.
 *
 * Extraído de `gerar-sped-ecd` e `gerar-sped-ecf`, que já tinham essa mesma
 * lógica duplicada, e adotado por `exportar-sped-contribuicoes`, que ainda
 * não a usava — daí o `M990` cravado que a Etapa 40 corrigiu.
 */
export interface LinhaTracker {
  readonly linhas: string[];
  readonly blocoCount: Map<string, number>;
  push(linha: string): void;
}

export function createLinhaTracker(): LinhaTracker {
  const linhas: string[] = [];
  const blocoCount = new Map<string, number>();
  return {
    linhas,
    blocoCount,
    push(linha: string) {
      linhas.push(linha);
      const tipo = linha.split('|')[1];
      if (tipo) {
        const bloco = tipo[0];
        blocoCount.set(bloco, (blocoCount.get(bloco) ?? 0) + 1);
      }
    },
  };
}

/**
 * Monta uma linha de registro SPED (`|CAMPO1|CAMPO2|...|`), tratando
 * `null`/`undefined` como campo vazio. Mesmo helper `reg()` que já existia,
 * duplicado, em `gerar-sped-ecd` e `gerar-sped-ecf` — agora compartilhado
 * e também adotado por `exportar-sped-contribuicoes`, que montava as
 * linhas com `.join('|')` cru.
 */
export function reg(...campos: (string | number | null | undefined)[]): string {
  return '|' + campos.map((c) => (c === null || c === undefined ? '' : String(c))).join('|') + '|';
}
