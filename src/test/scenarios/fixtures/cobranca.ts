import type { Rng } from "../rng";

export interface BoletoFixture {
  id: string;
  clienteId: string;
  valor: number;
  vencimento: string;
  status: "aberto" | "pago" | "vencido";
}

export interface EtapaReguaFixture {
  id: string;
  ordem: number;
  diasAposVencimento: number;
  canal: "email" | "whatsapp" | "sms";
}

export function makeBoletos(rng: Rng, size: number): BoletoFixture[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `bol-${rng.seed}-${i}`,
    clienteId: `cli-${rng.seed}-${i % Math.max(1, Math.floor(size / 3))}`,
    valor: Number((rng.int(5000, 500000) / 100).toFixed(2)),
    vencimento: `2026-07-${(i % 28) + 1}`.padStart(10, "0"),
    status: rng.pick(["aberto", "vencido"] as const),
  }));
}

export function makeReguaEtapas(): EtapaReguaFixture[] {
  return [
    { id: "et1", ordem: 1, diasAposVencimento: 1, canal: "email" },
    { id: "et2", ordem: 2, diasAposVencimento: 3, canal: "whatsapp" },
    { id: "et3", ordem: 3, diasAposVencimento: 7, canal: "sms" },
  ];
}
