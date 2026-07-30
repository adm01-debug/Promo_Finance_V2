import { describe, it, expect } from "vitest";
import { createRng } from "../rng";
import { duplicate, reorder, shouldFail } from "../faults";

describe("faults", () => {
  it("reorder é permutação (mesmo multiset)", () => {
    const rng = createRng(1);
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const out = reorder(input, rng);
    expect(out.slice().sort()).toEqual(input.slice().sort());
    expect(out.length).toBe(input.length);
  });

  it("duplicate mantém todos os originais e não perde nenhum", () => {
    const rng = createRng(2);
    const input = ["a", "b", "c"];
    const out = duplicate(input, 3, rng);
    for (const el of input) expect(out.includes(el)).toBe(true);
    expect(out.length).toBeGreaterThanOrEqual(input.length);
  });

  it("shouldFail(none) nunca falha", () => {
    const rng = createRng(3);
    for (let i = 0; i < 100; i++) {
      expect(shouldFail({ kind: "none" }, rng, i)).toBeNull();
    }
  });

  it("shouldFail(timeout, 3) falha a partir da 4ª op", () => {
    const rng = createRng(4);
    expect(shouldFail({ kind: "timeout", param: 3 }, rng, 0)).toBeNull();
    expect(shouldFail({ kind: "timeout", param: 3 }, rng, 3)).toBe("timeout");
  });

  it("rng é determinístico por seed", () => {
    const a = createRng(7);
    const b = createRng(7);
    for (let i = 0; i < 10; i++) expect(a.next()).toBe(b.next());
  });
});
