/**
 * Garante que o snapshot consumido pela página de documentação viva
 * (`grafo-observado.json`) reflete o estado atual do repositório.
 *
 * Se alguém alterar imports entre módulos sem regenerar o snapshot
 * (`bun run scripts/gerar-grafo-arquitetura.ts`), este teste falha.
 */

import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';

import { analisarDrift, construirGrafoObservado } from '../analisador-imports';
import snapshot from '../grafo-observado.json';

const RAIZ = resolve(__dirname, '../../../..');

describe('snapshot do grafo de arquitetura', () => {
  const arestas = construirGrafoObservado(RAIZ).filter((a) => !a.tipoApenas);
  const chaves = [...new Set(arestas.map((a) => `${a.de}->${a.para}`))].sort();

  it('lista de arestas está sincronizada com o código', () => {
    expect(snapshot.arestasObservadas).toEqual(chaves);
  });

  it('contagem de imports analisados está sincronizada', () => {
    expect(snapshot.totalImportsAnalisados).toBe(arestas.length);
  });

  it('resumo de drift está sincronizado e zerado', () => {
    const drift = analisarDrift(RAIZ);
    expect(snapshot.driftResumo.naoDeclaradas).toBe(drift.naoDeclaradas.length);
    expect(snapshot.driftResumo.inversoesDeCamada).toBe(drift.inversoesDeCamada.length);
    expect(snapshot.driftResumo.declaradasSemUso).toEqual(
      drift.declaradasSemUso.map((d) => `${d.de}->${d.para}`).sort(),
    );
    expect(snapshot.driftResumo.naoDeclaradas).toBe(0);
    expect(snapshot.driftResumo.inversoesDeCamada).toBe(0);
  });
});
