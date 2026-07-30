import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analisarDrift, construirGrafoObservado } from '../src/lib/arquitetura/analisador-imports';
const raiz = process.cwd();
const arestas = construirGrafoObservado(raiz).filter(a => !a.tipoApenas);
const chaves = [...new Set(arestas.map(a => `${a.de}->${a.para}`))].sort();
const drift = analisarDrift(raiz);
const snap = {
  geradoPor: 'bun run scripts/gerar-grafo-arquitetura.ts',
  arestasObservadas: chaves,
  totalImportsAnalisados: arestas.length,
  driftResumo: {
    naoDeclaradas: drift.naoDeclaradas.length,
    inversoesDeCamada: drift.inversoesDeCamada.length,
    declaradasSemUso: drift.declaradasSemUso.map(d => `${d.de}->${d.para}`).sort(),
  },
};
writeFileSync(resolve(raiz, 'src/lib/arquitetura/grafo-observado.json'), JSON.stringify(snap, null, 2) + '\n');
console.log('ok', chaves.length);
