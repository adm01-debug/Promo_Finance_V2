import { assertEquals } from 'jsr:@std/assert@1'
import { dataAlvoUtc, normalizarCanais, normalizarDiasGatilho } from './domain.ts'

Deno.test('normaliza dias, remove duplicados e rejeita valores inválidos', () => {
  assertEquals(normalizarDiasGatilho([3, -3, 0, 3, 1.5, '7', 999]), [-3, 0, 3])
  assertEquals(normalizarDiasGatilho(null), [])
})

Deno.test('normaliza e limita canais ao contrato conhecido', () => {
  assertEquals(normalizarCanais([' Email ', 'WHATSAPP', 'email', 'fax', null]), ['email', 'whatsapp'])
})

Deno.test('calcula datas antes, no dia e depois do vencimento em UTC', () => {
  const agora = new Date('2026-08-22T23:59:00-03:00')
  assertEquals(dataAlvoUtc(agora, -3), '2026-08-26')
  assertEquals(dataAlvoUtc(agora, 0), '2026-08-23')
  assertEquals(dataAlvoUtc(agora, 5), '2026-08-18')
})
