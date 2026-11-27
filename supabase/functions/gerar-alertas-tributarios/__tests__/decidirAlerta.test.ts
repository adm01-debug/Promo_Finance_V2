import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { decidirAlerta } from '../index.ts';

const aberta = (id: string, prioridade: string, entidade_id?: string | null) => ({
  id,
  prioridade,
  entidade_id: entidade_id ?? null,
  resolvido: false,
});

Deno.test('decidirAlerta cria quando nao ha linha recente da mesma origem', () => {
  assertEquals(decidirAlerta({ prioridade: 'alta', entidade_id: 'ap-1' }, []), { acao: 'criar' });
});

Deno.test('decidirAlerta ignora repeticao de prioridade igual ou menor na linha aberta', () => {
  const linhas = [aberta('a1', 'alta', 'ap-1')];
  assertEquals(decidirAlerta({ prioridade: 'alta', entidade_id: 'ap-1' }, linhas), {
    acao: 'ignorar',
  });
  assertEquals(decidirAlerta({ prioridade: 'media', entidade_id: 'ap-1' }, linhas), {
    acao: 'ignorar',
  });
});

Deno.test('decidirAlerta escala a linha aberta quando a severidade sobe', () => {
  assertEquals(
    decidirAlerta({ prioridade: 'critica', entidade_id: 'ap-1' }, [aberta('a1', 'alta', 'ap-1')]),
    { acao: 'escalar', id: 'a1' }
  );
});

Deno.test('decidirAlerta nao escala alerta de outra origem', () => {
  const linhas = [aberta('outro', 'media', 'ap-2')];
  assertEquals(decidirAlerta({ prioridade: 'critica', entidade_id: 'ap-1' }, linhas), {
    acao: 'criar',
  });
});

Deno.test('decidirAlerta respeita alerta resolvido quando a prioridade nao sobe', () => {
  const resolvida = [{ id: 'r1', prioridade: 'alta', entidade_id: 'ap-1', resolvido: true }];
  assertEquals(decidirAlerta({ prioridade: 'alta', entidade_id: 'ap-1' }, resolvida), {
    acao: 'ignorar',
  });
});

Deno.test('decidirAlerta cria alerta novo quando a escalada e real sobre linha resolvida', () => {
  const resolvida = [{ id: 'r1', prioridade: 'media', entidade_id: 'ap-1', resolvido: true }];
  assertEquals(decidirAlerta({ prioridade: 'critica', entidade_id: 'ap-1' }, resolvida), {
    acao: 'criar',
  });
});

Deno.test('decidirAlerta prefere a linha aberta quando ha aberta e resolvida', () => {
  const linhas = [
    { id: 'r1', prioridade: 'media', entidade_id: 'ap-1', resolvido: true },
    aberta('a1', 'alta', 'ap-1'),
  ];
  assertEquals(decidirAlerta({ prioridade: 'critica', entidade_id: 'ap-1' }, linhas), {
    acao: 'escalar',
    id: 'a1',
  });
});

Deno.test('decidirAlerta reconhece a linha legada sem entidade_id', () => {
  const legada = [{ id: 'l1', prioridade: 'media', entidade_id: null, resolvido: false }];
  assertEquals(decidirAlerta({ prioridade: 'alta', entidade_id: 'ap-1' }, legada), {
    acao: 'escalar',
    id: 'l1',
  });
});
