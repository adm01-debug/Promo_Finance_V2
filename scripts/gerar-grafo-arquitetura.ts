// Gera src/lib/arquitetura/grafo-observado.json a partir dos imports reais.
//   bun run scripts/gerar-grafo-arquitetura.ts           regenera o snapshot
//   bun run scripts/gerar-grafo-arquitetura.ts --check   só compara (exit 1 se desatualizado)
// Executar da raiz do repositório.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analisarDrift, construirGrafoObservado } from '../src/lib/arquitetura/analisador-imports';

const args = process.argv.slice(2);
const desconhecidos = args.filter((a) => a !== '--check');
if (desconhecidos.length > 0) {
  console.error(`❌ Argumento desconhecido: ${desconhecidos.join(' ')} (uso: [--check])`);
  process.exit(2);
}

try {
  const raiz = process.cwd();
  // Fora da raiz o analisador não acha arquivo nenhum e gravaria um grafo vazio
  // por cima do snapshot (ou morreria com ENOENT sem dizer o motivo).
  if (!existsSync(resolve(raiz, 'src/lib/arquitetura/modulos.ts'))) {
    throw new Error(`${raiz} não é a raiz do repositório (src/lib/arquitetura/modulos.ts ausente)`);
  }
  const arestas = construirGrafoObservado(raiz).filter((a) => !a.tipoApenas);
  const chaves = [...new Set(arestas.map((a) => `${a.de}->${a.para}`))].sort();
  const drift = analisarDrift(raiz);
  const snap = {
    geradoPor: 'bun run scripts/gerar-grafo-arquitetura.ts',
    arestasObservadas: chaves,
    totalImportsAnalisados: arestas.length,
    driftResumo: {
      naoDeclaradas: drift.naoDeclaradas.length,
      inversoesDeCamada: drift.inversoesDeCamada.length,
      declaradasSemUso: drift.declaradasSemUso.map((d) => `${d.de}->${d.para}`).sort(),
    },
  };
  const destino = resolve(raiz, 'src/lib/arquitetura/grafo-observado.json');
  const conteudo = JSON.stringify(snap, null, 2) + '\n';
  if (args.includes('--check')) {
    const emDisco = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
    if (emDisco !== conteudo) {
      console.error(
        '❌ grafo-observado.json desatualizado — execute: bun run scripts/gerar-grafo-arquitetura.ts'
      );
      process.exit(1);
    }
    console.log('ok', chaves.length, '(em dia)');
  } else {
    writeFileSync(destino, conteudo);
    console.log('ok', chaves.length);
  }
} catch (err) {
  console.error('❌ Erro ao gerar grafo de arquitetura:', err instanceof Error ? err.message : err);
  process.exit(1);
}
