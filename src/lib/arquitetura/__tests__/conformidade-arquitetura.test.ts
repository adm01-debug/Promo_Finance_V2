/**
 * Testes de conformidade arquitetural.
 *
 * Falham o build sempre que a estrutura real do repositório divergir do
 * manifesto de 12 módulos / 4 camadas: caminhos inexistentes, ciclos de
 * dependência, inversão de camadas ou vazamento de framework/infra dentro
 * do núcleo de domínio fiscal.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ADAPTERS_AUTORIZADOS,
  CAMADAS,
  IMPORTS_PROIBIDOS_NO_NUCLEO,
  MODULOS,
  detectarCiclos,
  modulosDaCamada,
  obterModulo,
  violacoesDeCamada,
} from '../modulos';

const RAIZ = process.cwd();

function listarArquivos(alvo: string): string[] {
  const absoluto = path.join(RAIZ, alvo);
  if (!fs.existsSync(absoluto)) return [];
  const stat = fs.statSync(absoluto);
  if (stat.isFile()) return [alvo];

  const resultado: string[] = [];
  for (const entrada of fs.readdirSync(absoluto, { withFileTypes: true })) {
    const relativo = path.posix.join(alvo, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === '__tests__' || entrada.name === 'node_modules') continue;
      resultado.push(...listarArquivos(relativo));
    } else if (/\.(ts|tsx)$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) {
      resultado.push(relativo);
    }
  }
  return resultado;
}

function importsDe(arquivoRelativo: string): string[] {
  const conteudo = fs.readFileSync(path.join(RAIZ, arquivoRelativo), 'utf8');
  const regex = /(?:from|import)\s*['"]([^'"]+)['"]/g;
  const encontrados: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(conteudo)) !== null) encontrados.push(m[1]);
  return encontrados;
}

describe('manifesto de arquitetura', () => {
  it('declara exatamente 12 módulos e 4 camadas', () => {
    expect(MODULOS).toHaveLength(12);
    expect(CAMADAS).toHaveLength(4);
  });

  it('não possui ids duplicados', () => {
    const ids = MODULOS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('distribui os módulos entre todas as camadas', () => {
    for (const camada of CAMADAS) {
      expect(modulosDaCamada(camada.id).length).toBeGreaterThan(0);
    }
  });

  it('resolve módulos por id e falha em id inválido', () => {
    expect(obterModulo('M07').nome).toContain('Direta');
    // @ts-expect-error id inválido é rejeitado em runtime
    expect(() => obterModulo('M99')).toThrow();
  });

  it('mantém o grafo de dependências acíclico', () => {
    expect(detectarCiclos()).toEqual([]);
  });

  it('respeita a direção das camadas (nenhuma dependência sobe de camada)', () => {
    expect(violacoesDeCamada()).toEqual([]);
  });

  it('detecta ciclos artificiais (sanidade do algoritmo)', () => {
    const ciclos = detectarCiclos([
      { ...obterModulo('M11'), dependencias: ['M07'] },
      obterModulo('M07'),
    ]);
    expect(ciclos.length).toBeGreaterThan(0);
  });
});

describe('estrutura real do repositório', () => {
  it.each(MODULOS.flatMap((m) => m.caminhos.map((c) => [m.id, c] as const)))(
    '%s possui o caminho declarado %s',
    (_id, caminho) => {
      expect(fs.existsSync(path.join(RAIZ, caminho))).toBe(true);
    },
  );
});

describe('pureza do núcleo de domínio fiscal', () => {
  const modulosPuros = MODULOS.filter((m) => m.puro);

  it('cobre os cinco módulos do núcleo (M07-M11)', () => {
    expect(modulosPuros.map((m) => m.id)).toEqual(['M07', 'M08', 'M09', 'M10', 'M11']);
  });

  it('nenhum arquivo do núcleo importa framework ou infraestrutura', () => {
    const violacoes: string[] = [];

    for (const modulo of modulosPuros) {
      for (const caminho of modulo.caminhos) {
        for (const arquivo of listarArquivos(caminho)) {
          if (ADAPTERS_AUTORIZADOS.includes(arquivo)) continue;
          for (const dep of importsDe(arquivo)) {
            const proibido = IMPORTS_PROIBIDOS_NO_NUCLEO.some(
              (p) => dep === p || dep.startsWith(`${p}/`),
            );
            if (proibido) violacoes.push(`${modulo.id} :: ${arquivo} importa "${dep}"`);
          }
        }
      }
    }

    expect(violacoes).toEqual([]);
  });

  it('todo adapter autorizado existe e pertence a um módulo puro', () => {
    for (const adapter of ADAPTERS_AUTORIZADOS) {
      expect(fs.existsSync(path.join(RAIZ, adapter))).toBe(true);
      const pertence = modulosPuros.some((m) =>
        m.caminhos.some((c) => adapter === c || adapter.startsWith(`${c}/`)),
      );
      expect(pertence, `${adapter} não pertence a nenhum módulo puro`).toBe(true);
    }
  });
});
