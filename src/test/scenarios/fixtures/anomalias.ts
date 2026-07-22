import type { Rng } from "../rng";

export interface AnomaliaFixture {
  id: string;
  tipo: string;
  status: "nova";
  score: number;
}

export type RevisaoAcao = "confirmar" | "falso_positivo" | "pular";

export function makeAnomalias(rng: Rng, size: number): AnomaliaFixture[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `anom-${rng.seed}-${i}`,
    tipo: rng.pick(["duplicidade", "valor_atipico", "beneficiario_novo"]),
    status: "nova" as const,
    score: rng.int(50, 100),
  }));
}

export function makeAcoes(rng: Rng, size: number): RevisaoAcao[] {
  return Array.from({ length: size }, () =>
    rng.pick(["confirmar", "falso_positivo", "pular"] as const),
  );
}
