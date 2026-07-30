import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guarda de conformidade dos imports das Edge Functions (runtime Deno).
 *
 * Motivação: um import inválido em Deno não é detectado pelo typecheck do
 * frontend nem pelo bundler do Vite — ele só falha em produção, no boot da
 * função. Estes testes travam as três classes de falha já observadas:
 *   1. subpaths inexistentes de `@supabase/supabase-js` (ex.: `/cors`);
 *   2. especificadores `npm:`/`https://` sem versão fixada;
 *   3. uso do alias `@/` do frontend, que não existe no runtime Deno.
 */

const RAIZ_FUNCOES = join(process.cwd(), 'supabase', 'functions');

function listarArquivos(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) {
      listarArquivos(caminho, acc);
    } else if (caminho.endsWith('.ts')) {
      acc.push(caminho);
    }
  }
  return acc;
}

const ARQUIVOS = listarArquivos(RAIZ_FUNCOES);

/** Versão única do cliente Supabase permitida nas Edge Functions. */
const VERSAO_CANONICA_SUPABASE_JS = '2.49.4';

const REGEX_ESPECIFICADOR = /from\s+['"]([^'"]+)['"]/g;

interface ImportObservado {
  arquivo: string;
  especificador: string;
}

const IMPORTS: ImportObservado[] = ARQUIVOS.flatMap((arquivo) => {
  const conteudo = readFileSync(arquivo, 'utf8');
  const encontrados: ImportObservado[] = [];
  for (const match of conteudo.matchAll(REGEX_ESPECIFICADOR)) {
    encontrados.push({
      arquivo: arquivo.replace(`${process.cwd()}/`, ''),
      especificador: match[1],
    });
  }
  return encontrados;
});

describe('Edge Functions — conformidade de imports Deno', () => {
  it('encontra arquivos de função para auditar', () => {
    expect(ARQUIVOS.length).toBeGreaterThan(0);
    expect(IMPORTS.length).toBeGreaterThan(0);
  });

  it('usa uma única versão canônica de @supabase/supabase-js', () => {
    const versoes = new Set(
      IMPORTS.map(({ especificador }) =>
        especificador.match(/@supabase\/supabase-js@([\d.]+)/)?.[1],
      ).filter((v): v is string => Boolean(v)),
    );
    expect(
      [...versoes],
      'versões divergentes do supabase-js causam comportamento inconsistente entre funções',
    ).toEqual([VERSAO_CANONICA_SUPABASE_JS]);
  });

  it('não importa @supabase/supabase-js sem versão fixada', () => {
    const flutuantes = IMPORTS.filter(({ especificador }) =>
      /@supabase\/supabase-js(?![@\d])/.test(especificador),
    );
    expect(flutuantes.map((i) => `${i.arquivo} -> ${i.especificador}`)).toEqual([]);
  });


  it('não usa o alias "@/" do frontend dentro das funções', () => {
    const invalidos = IMPORTS.filter(({ especificador }) => especificador.startsWith('@/'));
    expect(invalidos.map((i) => `${i.arquivo} -> ${i.especificador}`)).toEqual([]);
  });

  it('fixa versão em todo especificador npm:', () => {
    const semVersao = IMPORTS.filter(
      ({ especificador }) =>
        especificador.startsWith('npm:') && !/@[\d]+(\.[\d]+)*(\/|$)/.test(especificador.slice(4)),
    );
    expect(semVersao.map((i) => `${i.arquivo} -> ${i.especificador}`)).toEqual([]);
  });

  it('fixa versão em todo especificador https:// (deno.land / esm.sh)', () => {
    const semVersao = IMPORTS.filter(
      ({ especificador }) =>
        especificador.startsWith('https://') && !/@v?[\d]+(\.[\d]+)*/.test(especificador),
    );
    expect(semVersao.map((i) => `${i.arquivo} -> ${i.especificador}`)).toEqual([]);
  });

  it('todo import relativo aponta para arquivo com extensão .ts', () => {
    const semExtensao = IMPORTS.filter(
      ({ especificador }) => especificador.startsWith('.') && !especificador.endsWith('.ts'),
    );
    expect(semExtensao.map((i) => `${i.arquivo} -> ${i.especificador}`)).toEqual([]);
  });
});
