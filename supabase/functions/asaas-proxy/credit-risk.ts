export interface AnaliseRiscoIa {
  score: number
  recomendacao: string
}

export function extrairAnaliseRisco(texto: unknown): AnaliseRiscoIa | null {
  if (typeof texto !== 'string') return null
  const trechoJson = texto.match(/\{[\s\S]*\}/)?.[0]
  if (!trechoJson) return null

  try {
    const valor = JSON.parse(trechoJson) as Record<string, unknown>
    const score = Number(valor.score)
    const recomendacao = typeof valor.recomendacao === 'string' ? valor.recomendacao.trim() : ''
    if (!Number.isInteger(score) || score < 0 || score > 1000 || !recomendacao) return null
    return { score, recomendacao }
  } catch {
    return null
  }
}

export function faixaDoScore(score: number): 'BAIXO' | 'MEDIO' | 'ALTO' {
  if (score > 800) return 'BAIXO'
  if (score > 400) return 'MEDIO'
  return 'ALTO'
}
