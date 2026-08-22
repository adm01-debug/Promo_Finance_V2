import { assertEquals } from 'jsr:@std/assert@1'
import { extrairAnaliseRisco, faixaDoScore } from './credit-risk.ts'

Deno.test('extrai resposta JSON mesmo dentro de bloco markdown', () => {
  assertEquals(
    extrairAnaliseRisco('```json\n{"score": 720, "recomendacao": "Manter limite atual"}\n```'),
    { score: 720, recomendacao: 'Manter limite atual' },
  )
})

Deno.test('rejeita score inventado, fora da faixa ou resposta incompleta', () => {
  assertEquals(extrairAnaliseRisco('score aproximado 500'), null)
  assertEquals(extrairAnaliseRisco('{"score": 1001, "recomendacao": "x"}'), null)
  assertEquals(extrairAnaliseRisco('{"score": 500}'), null)
})

Deno.test('classifica as fronteiras de risco', () => {
  assertEquals(faixaDoScore(801), 'BAIXO')
  assertEquals(faixaDoScore(800), 'MEDIO')
  assertEquals(faixaDoScore(401), 'MEDIO')
  assertEquals(faixaDoScore(400), 'ALTO')
})
