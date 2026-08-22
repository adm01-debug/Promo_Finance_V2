export const CANAIS_REGUA = ['email', 'whatsapp', 'sms', 'telefone'] as const
export type CanalRegua = (typeof CANAIS_REGUA)[number]

export function normalizarDiasGatilho(valor: unknown): number[] {
  if (!Array.isArray(valor)) return []
  return [...new Set(valor
    .filter((item): item is number => Number.isInteger(item))
    .filter((item) => item >= -365 && item <= 365))]
    .sort((a, b) => a - b)
}

export function normalizarCanais(valor: unknown): CanalRegua[] {
  if (!Array.isArray(valor)) return []
  const permitidos = new Set<string>(CANAIS_REGUA)
  return [...new Set(valor
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is CanalRegua => permitidos.has(item)))]
}

export function dataAlvoUtc(agora: Date, diasDesdeVencimento: number): string {
  const alvo = new Date(Date.UTC(
    agora.getUTCFullYear(),
    agora.getUTCMonth(),
    agora.getUTCDate() - diasDesdeVencimento,
  ))
  return alvo.toISOString().slice(0, 10)
}
