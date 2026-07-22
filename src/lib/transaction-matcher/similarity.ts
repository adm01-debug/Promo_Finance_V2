// Funções de similaridade (texto, valor e data) usadas pelo motor de matching.

export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extrairPalavrasChave(texto: string): string[] {
  const stopWords = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'para', 'com', 'em', 'por',
    'ltda', 'sa', 'me', 'eireli', 'epp', 'sas', 'ss',
    'pix', 'ted', 'doc', 'boleto', 'pag', 'pagamento', 'recebimento',
    'transferencia', 'debito', 'credito', 'enviado', 'recebido',
  ]);

  return normalizarTexto(texto)
    .split(' ')
    .filter((palavra) => palavra.length > 2 && !stopWords.has(palavra));
}

export function calcularSimilaridadeTexto(
  texto1: string,
  texto2: string,
): { score: number; tipo: 'exato' | 'parcial' | 'nenhum' } {
  const normalizado1 = normalizarTexto(texto1);
  const normalizado2 = normalizarTexto(texto2);

  if (normalizado1 === normalizado2) {
    return { score: 1, tipo: 'exato' };
  }

  if (normalizado1.includes(normalizado2) || normalizado2.includes(normalizado1)) {
    const maior = Math.max(normalizado1.length, normalizado2.length);
    const menor = Math.min(normalizado1.length, normalizado2.length);
    return { score: menor / maior, tipo: 'parcial' };
  }

  const palavras1 = new Set(extrairPalavrasChave(texto1));
  const palavras2 = new Set(extrairPalavrasChave(texto2));

  if (palavras1.size === 0 || palavras2.size === 0) {
    return { score: 0, tipo: 'nenhum' };
  }

  const intersecao = [...palavras1].filter((p) => palavras2.has(p)).length;
  const uniao = new Set([...palavras1, ...palavras2]).size;
  const jaccard = intersecao / uniao;

  let matchesParciais = 0;
  for (const p1 of palavras1) {
    for (const p2 of palavras2) {
      if (p1.includes(p2) || p2.includes(p1)) {
        matchesParciais++;
      }
    }
  }

  const scoreParcial = matchesParciais / Math.max(palavras1.size, palavras2.size);
  const scoreFinal = Math.max(jaccard, scoreParcial * 0.8);

  return {
    score: scoreFinal,
    tipo: scoreFinal > 0.3 ? 'parcial' : 'nenhum',
  };
}

export function calcularSimilaridadeValor(
  valor1: number,
  valor2: number,
  tolerancia: number,
): { score: number; tipo: 'exato' | 'proximo' | 'diferente' } {
  const diff = Math.abs(valor1 - valor2);
  const percentDiff = (diff / Math.max(Math.abs(valor1), Math.abs(valor2))) * 100;

  if (diff < 0.01) {
    return { score: 1, tipo: 'exato' };
  }

  if (percentDiff <= tolerancia) {
    return { score: 1 - (percentDiff / tolerancia) * 0.3, tipo: 'proximo' };
  }

  if (percentDiff <= tolerancia * 5) {
    return { score: 0.5 - (percentDiff - tolerancia) / (tolerancia * 10), tipo: 'proximo' };
  }

  return { score: 0, tipo: 'diferente' };
}

export function calcularSimilaridadeData(
  data1: Date,
  data2: Date,
  toleranciaDias: number,
): number {
  const diffMs = Math.abs(data1.getTime() - data2.getTime());
  const diffDias = diffMs / (1000 * 60 * 60 * 24);

  if (diffDias <= 1) return 1;
  if (diffDias <= toleranciaDias) return 1 - (diffDias / toleranciaDias) * 0.5;
  if (diffDias <= toleranciaDias * 2) {
    return 0.3 - (diffDias - toleranciaDias) / (toleranciaDias * 4);
  }
  return 0;
}
