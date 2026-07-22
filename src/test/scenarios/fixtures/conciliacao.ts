import type { Rng } from "../rng";

export interface ExtratoLinha {
  id: string;
  transacaoExternaId: string;
  valor: number; // + crédito / - débito
  data: string;
  descricao: string;
}

export interface LancamentoFixture {
  id: string;
  tipo: "pagar" | "receber";
  valor: number;
  data: string;
}

export function makeExtrato(rng: Rng, size: number): ExtratoLinha[] {
  const out: ExtratoLinha[] = [];
  for (let i = 0; i < size; i++) {
    const isCredito = rng.bool(0.5);
    const valor = Number((rng.int(1000, 500000) / 100).toFixed(2));
    out.push({
      id: `tx-${rng.seed}-${i}`,
      transacaoExternaId: `ext-${rng.seed}-${i}`,
      valor: isCredito ? valor : -valor,
      data: `2026-07-${(i % 28) + 1}`.padStart(10, "0"),
      descricao: rng.pick(["FORNECEDOR ABC", "CLIENTE XYZ", "PIX", "BOLETO"]),
    });
  }
  return out;
}

export function makeLancamentos(rng: Rng, extrato: ExtratoLinha[]): LancamentoFixture[] {
  // 70% do extrato tem lançamento correspondente
  return extrato
    .filter(() => rng.bool(0.7))
    .map((tx, i) => ({
      id: `lanc-${rng.seed}-${i}`,
      tipo: tx.valor > 0 ? "receber" : "pagar",
      valor: Math.abs(tx.valor),
      data: tx.data,
    }));
}
