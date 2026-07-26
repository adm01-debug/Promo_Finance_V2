import { describe, it, expect } from 'vitest';

import {
  ANEXO_I,
  ANEXO_II,
  ANEXO_III,
  ANEXO_IV,
  ANEXO_V,
  LIMITE_SIMPLES_NACIONAL,
  identificarFaixa,
  obterAnexo,
  type FaixaSimples,
} from '../aliquotas-simples';
import { ANEXOS, LIMITE_SIMPLES } from '../shared-logic';
import type { AnexoSimples } from '../types';

/**
 * Coerência entre as DUAS representações das tabelas do Simples Nacional:
 *
 *  - `aliquotas-simples.ts` (fonte canônica, com faixa `de`/`até`) — usada por
 *    telas de consulta, DAS e relatórios;
 *  - `shared-logic.ts#ANEXOS` (forma compacta, apenas `ate`) — usada pelo motor
 *    de simulação e espelhada na Edge Function.
 *
 * Uma divergência numérica entre elas produziria valores diferentes para o MESMO
 * contribuinte dependendo da tela — falha fiscal silenciosa. Este teste bloqueia
 * essa classe inteira de erro, e não apenas uma instância dela.
 */

const CANONICAS: Record<AnexoSimples, FaixaSimples[]> = {
  I: ANEXO_I,
  II: ANEXO_II,
  III: ANEXO_III,
  IV: ANEXO_IV,
  V: ANEXO_V,
};

const ANEXOS_LISTA = Object.keys(CANONICAS) as AnexoSimples[];

describe('Coerência das tabelas do Simples Nacional', () => {
  it('o limite do Simples é o mesmo nas duas fontes', () => {
    expect(LIMITE_SIMPLES).toBe(LIMITE_SIMPLES_NACIONAL);
  });

  it.each(ANEXOS_LISTA)('anexo %s: motor e tabela canônica têm faixas idênticas', (anexo) => {
    const canonica = CANONICAS[anexo];
    const motor = ANEXOS[anexo];

    expect(motor).toHaveLength(canonica.length);
    canonica.forEach((f, i) => {
      expect(motor[i].faixa, `faixa ${i + 1} do anexo ${anexo}`).toBe(f.faixa);
      expect(motor[i].ate, `teto da faixa ${f.faixa} do anexo ${anexo}`).toBe(f.rbt12_ate);
      expect(motor[i].aliq, `alíquota da faixa ${f.faixa} do anexo ${anexo}`).toBeCloseTo(
        f.aliquota,
        10,
      );
      expect(motor[i].pd, `parcela a deduzir da faixa ${f.faixa} do anexo ${anexo}`).toBe(f.pd);
    });
  });

  it.each(ANEXOS_LISTA)('anexo %s: faixas são contínuas, ordenadas e sem lacunas', (anexo) => {
    const faixas = obterAnexo(anexo);
    expect(faixas[0].rbt12_de).toBe(0);
    expect(faixas[faixas.length - 1].rbt12_ate).toBe(LIMITE_SIMPLES_NACIONAL);

    for (let i = 1; i < faixas.length; i++) {
      // O início da faixa seguinte é o teto anterior + 1 centavo (padrão LC 123/2006).
      expect(faixas[i].rbt12_de).toBeCloseTo(faixas[i - 1].rbt12_ate + 0.01, 2);
      expect(faixas[i].rbt12_ate).toBeGreaterThan(faixas[i].rbt12_de);
      expect(faixas[i].aliquota).toBeGreaterThan(faixas[i - 1].aliquota);
      expect(faixas[i].pd).toBeGreaterThan(faixas[i - 1].pd);
      expect(faixas[i].faixa).toBe(faixas[i - 1].faixa + 1);
    }
  });

  it.each(ANEXOS_LISTA)(
    'anexo %s: a alíquota efetiva é contínua na virada de faixa e nunca negativa',
    (anexo) => {
      const faixas = obterAnexo(anexo);
      const efetiva = (rbt12: number, f: FaixaSimples) => (rbt12 * f.aliquota - f.pd) / rbt12;

      // Faixas 1→5: a parcela a deduzir existe justamente para evitar salto na virada.
      // A transição 5→6 é descontínua POR DESENHO LEGAL (LC 123/2006): a última
      // faixa usa alíquota nominal e PD muito maiores, então é validada à parte.
      for (let i = 0; i < faixas.length - 2; i++) {
        const teto = faixas[i].rbt12_ate;
        const antes = efetiva(teto, faixas[i]);
        const depois = efetiva(teto + 0.01, faixas[i + 1]);
        expect(Math.abs(depois - antes), `descontinuidade no teto da faixa ${i + 1}`).toBeLessThan(
          0.005,
        );
        expect(depois).toBeGreaterThanOrEqual(antes - 1e-9);
      }

      // Na última faixa a efetiva ainda deve crescer monotonicamente até o teto
      // do Simples. Não se compara com a faixa 5: a LC 123/2006 usa alíquota
      // nominal e PD próprias na 6ª faixa, o que gera degrau legítimo.
      const ultima = faixas[faixas.length - 1];
      expect(efetiva(ultima.rbt12_ate, ultima)).toBeGreaterThan(
        efetiva(ultima.rbt12_de + 0.01, ultima),
      );



      for (const f of faixas) {
        const piso = Math.max(f.rbt12_de, 0.01);
        expect(efetiva(piso, f), `alíquota efetiva negativa na faixa ${f.faixa}`).toBeGreaterThan(0);
        // Na 1ª faixa a PD é zero, logo efetiva == nominal; nas demais, sempre menor.
        expect(efetiva(f.rbt12_ate, f)).toBeLessThanOrEqual(f.aliquota);
        if (f.pd > 0) expect(efetiva(f.rbt12_ate, f)).toBeLessThan(f.aliquota);

      }
    },
  );

  it('identificarFaixa concorda com o motor em centenas de cenários de RBT12', () => {
    const faixaDoMotor = (rbt12: number, anexo: AnexoSimples) =>
      ANEXOS[anexo].find((f) => rbt12 <= f.ate) ?? null;

    let verificados = 0;
    for (const anexo of ANEXOS_LISTA) {
      const pontos: number[] = [0.01, 1, 179_999.99];
      for (const f of obterAnexo(anexo)) {
        pontos.push(f.rbt12_de || 0.01, f.rbt12_ate, f.rbt12_ate - 0.01, (f.rbt12_de + f.rbt12_ate) / 2);
      }
      for (let i = 0; i < 100; i++) {
        pontos.push(Math.round(Math.random() * LIMITE_SIMPLES_NACIONAL * 100) / 100);
      }

      for (const rbt12 of pontos) {
        if (rbt12 <= 0 || rbt12 > LIMITE_SIMPLES_NACIONAL) continue;
        const canonica = identificarFaixa(rbt12, anexo);
        const motor = faixaDoMotor(rbt12, anexo);
        expect(canonica, `RBT12 ${rbt12} sem faixa no anexo ${anexo}`).not.toBeNull();
        expect(motor?.faixa, `divergência de faixa em RBT12 ${rbt12} (anexo ${anexo})`).toBe(
          canonica?.faixa,
        );
        verificados++;
      }
    }
    expect(verificados).toBeGreaterThan(500);
  });

  it('identificarFaixa retorna null acima do limite e para valores inválidos', () => {
    expect(identificarFaixa(LIMITE_SIMPLES_NACIONAL + 0.01, 'I')).toBeNull();
    expect(identificarFaixa(-1, 'III')).toBeNull();
  });
});
