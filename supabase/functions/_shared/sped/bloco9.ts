import { reg } from './push-helper.ts';

/**
 * Monta o bloco 9 completo de um arquivo SPED — abertura (`9001`), um
 * `9900` por tipo de registro presente no arquivo com sua contagem real
 * (o `9900` também conta a si mesmo, e ao `9001`/`9990` que o acompanham —
 * algoritmo padrão do leiaute SPED) e o fechamento do bloco (`9990`) — a
 * partir das linhas de dados já emitidas (todos os blocos anteriores, sem
 * incluir o bloco 9).
 *
 * Substitui, nas três funções que geram SPED (`gerar-sped-ecd`,
 * `gerar-sped-ecf`, `exportar-sped-contribuicoes`), uma lista de tipos
 * cravada manualmente (ex.: `['0','I','J']` no ECD) que nunca refletia os
 * registros de fato presentes no arquivo — ver Etapa 40 do plano.
 *
 * `9999` (fechamento do ARQUIVO, não do bloco 9) fica de fora de
 * propósito: seu valor depende do array final incluindo o bloco 9 que esta
 * função devolve, então continua responsabilidade do chamador, com
 * `linhas.length + 1` sobre o array já concatenado — cálculo que já estava
 * correto nas três funções antes desta correção.
 */
export function buildBloco9(linhasDeDados: string[]): string[] {
  const linha9001 = reg('9001', '0');

  // Tabula por tipo de registro as linhas de dados + a abertura do bloco 9
  // (o '9900' de código '9001' precisa contar essa linha).
  const contagem = new Map<string, number>();
  for (const linha of [...linhasDeDados, linha9001]) {
    const tipo = linha.split('|')[1];
    if (tipo) contagem.set(tipo, (contagem.get(tipo) ?? 0) + 1);
  }

  // Ordem de emissão dos '9900': primeira aparição no arquivo — que já
  // segue a ordem dos blocos de dados, na sequência em que o chamador os
  // escreveu — seguida de '9001', '9900' e '9990', que não aparecem em
  // `linhasDeDados` e vêm nessa ordem dentro do próprio bloco 9.
  const vistos = new Set<string>();
  const ordem: string[] = [];
  for (const linha of linhasDeDados) {
    const tipo = linha.split('|')[1];
    if (tipo && !vistos.has(tipo)) {
      vistos.add(tipo);
      ordem.push(tipo);
    }
  }
  ordem.push('9001', '9900', '9990');

  // O '9900' de código '9900' conta quantas linhas '9900' existem no
  // arquivo — exatamente uma por código listado em `ordem`.
  contagem.set('9900', ordem.length);
  contagem.set('9990', 1);

  const linhas9900 = ordem.map((tipo) => reg('9900', tipo, contagem.get(tipo) ?? 0));

  const bloco9 = [linha9001, ...linhas9900];
  bloco9.push(reg('9990', bloco9.length + 1));
  return bloco9;
}
