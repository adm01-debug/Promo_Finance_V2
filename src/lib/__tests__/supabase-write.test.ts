/**
 * Testes — supabase-write
 *
 * O que estes testes precisam provar, para além do caminho feliz:
 *  - a falha do PostgREST vira exceção com o contexto de negócio junto;
 *  - `exigirLinhas` não mente: se a resposta não permite contar, ele falha
 *    em vez de dar por verificado;
 *  - `bestEffort` não realimenta o rastreador de erros por padrão (senão a
 *    telemetria que ele protege entraria em laço).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostgrestError } from '@supabase/supabase-js';

const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));
const trackerMock = vi.hoisted(() => ({ captureException: vi.fn() }));

vi.mock('@/lib/logger', () => ({ logger: loggerMock }));
vi.mock('@/lib/error-tracking', () => ({ errorTracker: trackerMock }));

import { mustSucceed, bestEffort, SupabaseWriteError } from '@/lib/supabase-write';
import type { RespostaSupabase } from '@/lib/supabase-write';

function erroPg(code: string, message = 'boom'): PostgrestError {
  return { code, message, details: 'det', hint: 'dica', name: 'PostgrestError' } as PostgrestError;
}

/**
 * O builder do PostgREST é um *thenable*, não uma Promise. Os helpers precisam
 * aceitá-lo como está — daí o tipo `PromiseLike` na assinatura.
 */
function comoBuilder<T>(resposta: RespostaSupabase<T>): PromiseLike<RespostaSupabase<T>> {
  return {
    then(aoResolver) {
      return Promise.resolve(resposta).then(aoResolver);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mustSucceed', () => {
  it('devolve data quando não há erro', async () => {
    const data = await mustSucceed(
      comoBuilder({ data: [{ id: 'a1' }], error: null }),
      'criar a conta'
    );
    expect(data).toEqual([{ id: 'a1' }]);
  });

  it('aceita o builder thenable do PostgREST, não só Promise', async () => {
    let consumido = false;
    const thenable: PromiseLike<RespostaSupabase<{ id: string }>> = {
      then(aoResolver) {
        consumido = true;
        return Promise.resolve({ data: { id: 'x' }, error: null } as const).then(aoResolver);
      },
    };
    await expect(mustSucceed(thenable, 'gravar')).resolves.toEqual({ id: 'x' });
    expect(consumido).toBe(true);
  });

  it('lança SupabaseWriteError com o contexto de negócio na mensagem', async () => {
    await expect(
      mustSucceed(comoBuilder({ data: null, error: erroPg('23505') }), 'aprovar o pagamento')
    ).rejects.toMatchObject({
      name: 'SupabaseWriteError',
      operacao: 'aprovar o pagamento',
      code: '23505',
      message: 'Falha ao aprovar o pagamento: Já existe um registro com esses dados.',
      details: 'det',
      hint: 'dica',
    });
  });

  it('traduz PGRST204 — o incidente que originou o módulo', async () => {
    const erro = await mustSucceed(
      comoBuilder({
        data: null,
        error: erroPg('PGRST204', "Could not find the 'aprovado_em' column"),
      }),
      'registrar o aprovador'
    ).catch((e: unknown) => e as SupabaseWriteError);

    expect(erro).toBeInstanceOf(SupabaseWriteError);
    expect(erro.isSchemaError).toBe(true);
    expect(erro.message).toContain('Campo inexistente na tabela');
  });

  it('classifica bloqueio de RLS como erro de permissão', async () => {
    const erro = await mustSucceed(
      comoBuilder({ data: null, error: erroPg('42501') }),
      'inserir a transação'
    ).catch((e: unknown) => e as SupabaseWriteError);

    expect(erro.isPermissionError).toBe(true);
    expect(erro.isSchemaError).toBe(false);
  });

  it('preserva a mensagem original quando o código é desconhecido', async () => {
    await expect(
      mustSucceed(
        comoBuilder({ data: null, error: erroPg('XX999', 'pânico no servidor') }),
        'salvar'
      )
    ).rejects.toThrow('Falha ao salvar: pânico no servidor');
  });

  it('não lança quando error é null, mesmo com data null', async () => {
    // É o retorno de um update sem .select() — comportamento normal do PostgREST.
    await expect(
      mustSucceed(comoBuilder({ data: null, error: null }), 'atualizar')
    ).resolves.toBeNull();
  });
});

describe('mustSucceed com exigirLinhas', () => {
  it('falha quando o update não atingiu nenhuma linha (array vazio)', async () => {
    const erro = await mustSucceed(comoBuilder({ data: [], error: null }), 'quitar o acordo', {
      exigirLinhas: true,
    }).catch((e: unknown) => e as SupabaseWriteError);

    expect(erro.isNenhumaLinha).toBe(true);
    expect(erro.message).toBe('Falha ao quitar o acordo: nenhuma linha foi afetada.');
  });

  it('falha quando count é 0', async () => {
    const erro = await mustSucceed(
      comoBuilder({ data: null, error: null, count: 0 }),
      'marcar como recolhido',
      { exigirLinhas: true }
    ).catch((e: unknown) => e as SupabaseWriteError);

    expect(erro.code).toBe('NENHUMA_LINHA');
  });

  it('passa quando count é maior que 0 mesmo com data null', async () => {
    await expect(
      mustSucceed(comoBuilder({ data: null, error: null, count: 3 }), 'marcar DARF', {
        exigirLinhas: true,
      })
    ).resolves.toBeNull();
  });

  it('passa quando .single() devolveu um objeto', async () => {
    await expect(
      mustSucceed(comoBuilder({ data: { id: 'a' }, error: null }), 'criar', { exigirLinhas: true })
    ).resolves.toEqual({ id: 'a' });
  });

  it('recusa-se a fingir verificação quando a resposta não permite contar', async () => {
    // Update sem .select() e sem count: não há como saber se atingiu linha.
    // Dar por verificado aqui seria recriar exatamente o fail-open que o
    // módulo existe para eliminar.
    const erro = await mustSucceed(comoBuilder({ data: null, error: null }), 'conciliar', {
      exigirLinhas: true,
    }).catch((e: unknown) => e as SupabaseWriteError);

    expect(erro.code).toBe('CONTAGEM_INDISPONIVEL');
    expect(erro.message).toContain(".select('id')");
  });

  it('falha quando o lote pegou só parte das linhas esperadas', async () => {
    // O caso que motivou o número: `update().in('id', [a, b, c])` em que só
    // duas linhas estão no escopo da empresa devolve `error: null` e duas
    // linhas. Sem comparar com o esperado, a terceira fica para trás calada.
    const erro = await mustSucceed(
      comoBuilder({ data: [{ id: 'a' }, { id: 'b' }], error: null }),
      'marcar as retenções como recolhidas',
      { exigirLinhas: 3 }
    ).catch((e: unknown) => e as SupabaseWriteError);

    expect(erro.isLinhasParciais).toBe(true);
    expect(erro.message).toBe(
      'Falha ao marcar as retenções como recolhidas: 2 de 3 registros foram afetados.'
    );
  });

  it('passa quando o lote atinge exatamente o esperado', async () => {
    await expect(
      mustSucceed(comoBuilder({ data: null, error: null, count: 3 }), 'marcar retenções', {
        exigirLinhas: 3,
      })
    ).resolves.toBeNull();
  });

  it('lote vazio ainda cai em NENHUMA_LINHA, não em parcial', async () => {
    const erro = await mustSucceed(comoBuilder({ data: [], error: null }), 'marcar retenções', {
      exigirLinhas: 2,
    }).catch((e: unknown) => e as SupabaseWriteError);

    expect(erro.code).toBe('NENHUMA_LINHA');
  });

  it('recusa exigirLinhas: 0 — verificação que não verifica nada é enfeite', async () => {
    const erro = await mustSucceed(comoBuilder({ data: [], error: null }), 'marcar retenções', {
      exigirLinhas: 0,
    }).catch((e: unknown) => e as SupabaseWriteError);

    expect(erro.code).toBe('CONTAGEM_INVALIDA');
  });

  it('exigirLinhas: false não verifica nada', async () => {
    await expect(
      mustSucceed(comoBuilder({ data: [], error: null }), 'apagar', { exigirLinhas: false })
    ).resolves.toEqual([]);
  });

  it('não verifica linhas quando a opção não é pedida', async () => {
    await expect(mustSucceed(comoBuilder({ data: [], error: null }), 'apagar')).resolves.toEqual(
      []
    );
  });
});

describe('bestEffort', () => {
  it('devolve true e não loga quando a escrita passa', async () => {
    await expect(
      bestEffort(comoBuilder({ data: null, error: null }), 'registrar auditoria')
    ).resolves.toBe(true);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('devolve false e loga quando a escrita falha, sem lançar', async () => {
    await expect(
      bestEffort(comoBuilder({ data: null, error: erroPg('42501') }), 'registrar auditoria')
    ).resolves.toBe(false);

    expect(loggerMock.warn).toHaveBeenCalledWith(
      '[supabase-write] escrita acessória falhou',
      expect.objectContaining({ contexto: 'registrar auditoria', code: '42501' })
    );
  });

  it('absorve rejeição do builder (falha de rede), não só error no corpo', async () => {
    const rejeitado: PromiseLike<RespostaSupabase<never>> = {
      then(_ok, aoFalhar) {
        return Promise.reject(new Error('network down')).then(undefined, aoFalhar);
      },
    };
    await expect(bestEffort(rejeitado, 'enviar telemetria')).resolves.toBe(false);
    expect(loggerMock.warn).toHaveBeenCalled();
  });

  it('não reporta ao rastreador por padrão — evita laço na telemetria', async () => {
    await bestEffort(comoBuilder({ data: null, error: erroPg('23505') }), 'gravar log de erro');
    await Promise.resolve();
    expect(trackerMock.captureException).not.toHaveBeenCalled();
  });

  it('reporta ao rastreador quando explicitamente pedido', async () => {
    await bestEffort(comoBuilder({ data: null, error: erroPg('23505') }), 'sincronizar score', {
      reportar: true,
    });
    // o import dinâmico resolve no microtask seguinte
    await vi.waitFor(() => expect(trackerMock.captureException).toHaveBeenCalledTimes(1));
    expect(trackerMock.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: expect.objectContaining({ contexto: 'sincronizar score' }) })
    );
  });
});
