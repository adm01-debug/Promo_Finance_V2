
import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { simularSimples, simularPresumido, simularReal, LIMITE_SIMPLES } from "./tributario-logic.ts";

Deno.test("Simular Simples - Caso Básico", () => {
  const params = {
    faturamentoAnual: 100000,
    percentualServicos: 0,
    margemLucro: 15
  };
  const result = simularSimples(params, 2024, 1);
  assertEquals(result.regime, "simples_nacional");
  assertEquals(result.elegivel, true);
  assert(result.totalTributos > 0);
  assertEquals(result.faixaAplicavel, 1);
});

Deno.test("Simular Simples - Limite Inelegível", () => {
  const params = {
    faturamentoAnual: LIMITE_SIMPLES + 1,
    percentualServicos: 0,
    margemLucro: 15
  };
  const result = simularSimples(params, 2024, 1);
  assertEquals(result.elegivel, false);
});

Deno.test("Simular Presumido - Cálculo IRPJ", () => {
  const params = {
    faturamentoAnual: 1000000,
    percentualServicos: 100, // 100% serviços -> 32% presunção
    margemLucro: 20
  };
  const result = simularPresumido(params);
  // Base IRPJ = 1M * 32% = 320k
  // IRPJ = 320k * 15% + (320k - 240k) * 10% = 48k + 8k = 56k
  assertEquals(result.irpj, 56000);
});

Deno.test("Simular Real - Margem de Lucro", () => {
  const params = {
    faturamentoAnual: 1000000,
    margemLucro: 10,
    percentualServicos: 50
  };
  const result = simularReal(params);
  // Lucro = 100k
  // IRPJ = 100k * 15% = 15k
  assertEquals(result.irpj, 15000);
});
